import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { db } from '../models/db.js';
import { MaXacThucModel, NguoiDungModel } from '../models/mongoose.models.js';
import { comparePassword } from '../utils/bcrypt.js';

test('luồng đăng ký gửi OTP và xác thực tạo tài khoản', async () => {
  const databaseName = `football-connect-otp-test-${process.pid}-${Date.now()}`;
  const mongoUri = `mongodb://127.0.0.1:27017/${databaseName}`;
  const nativeFetch = globalThis.fetch.bind(globalThis);
  const previousEnvironment = {
    MAIL_PROVIDER: process.env.MAIL_PROVIDER,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    MAIL_FROM: process.env.MAIL_FROM
  };
  const previousMongoState = db.isMongoConnected;
  const email = `otp-flow-${Date.now()}@example.com`;
  const failedEmail = `otp-failed-${Date.now()}@example.com`;
  let brevoStatus = 201;
  const app = createApp();
  const server = app.listen(0, '127.0.0.1');

  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    db.isMongoConnected = true;
    process.env.MAIL_PROVIDER = 'brevo';
    process.env.BREVO_API_KEY = 'xkeysib-test-key';
    process.env.MAIL_FROM = 'no-reply@example.com';
    globalThis.fetch = async (input, init) => {
      if (String(input) === 'https://api.brevo.com/v3/smtp/email') {
        return new Response(JSON.stringify({ messageId: '<email_test_otp@brevo>' }), { status: brevoStatus });
      }
      return nativeFetch(input, init);
    };

    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const sendResponse = await fetch(`${baseUrl}/api/auth/register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'OTP Integration Test',
        email,
        password: 'Password123!',
        phone: '0900000000',
        role: 'USER'
      })
    });
    const sendBody = await sendResponse.json() as { success: boolean; message: string };
    assert.equal(sendResponse.status, 200);
    assert.equal(sendBody.success, true);

    const otpDocument = await MaXacThucModel.findOne({ email }).lean() as { ma_otp?: string } | null;
    assert.match(String(otpDocument?.ma_otp), /^\d{6}$/);

    const verifyResponse = await fetch(`${baseUrl}/api/auth/verify-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: otpDocument?.ma_otp })
    });
    const verifyBody = await verifyResponse.json() as {
      success: boolean;
      data?: { user?: { email?: string }; accessToken?: string };
    };
    assert.equal(verifyResponse.status, 201);
    assert.equal(verifyBody.success, true);
    assert.equal(verifyBody.data?.user?.email, email);
    assert.ok(verifyBody.data?.accessToken);
    assert.equal(await MaXacThucModel.countDocuments({ email }), 0);

    const storedUser = await NguoiDungModel.findOne({ email }).lean() as { mat_khau?: string } | null;
    assert.match(String(storedUser?.mat_khau), /^\$2[aby]\$/);

    const forgotSendResponse = await fetch(`${baseUrl}/api/auth/forgot-password-otp`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
    });
    assert.equal(forgotSendResponse.status, 200);
    const forgotOtp = await MaXacThucModel.findOne({ email, muc_dich: 'QUEN_MAT_KHAU' }).lean() as { ma_otp?: string } | null;
    assert.match(String(forgotOtp?.ma_otp), /^\d{6}$/);

    const samePasswordResponse = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: forgotOtp?.ma_otp, newPassword: 'Password123!' })
    });
    const samePasswordBody = await samePasswordResponse.json() as { success: boolean; message: string };
    assert.equal(samePasswordResponse.status, 400);
    assert.match(samePasswordBody.message, /không được trùng/);
    assert.equal(await MaXacThucModel.countDocuments({ email, muc_dich: 'QUEN_MAT_KHAU' }), 1);

    const resetResponse = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: forgotOtp?.ma_otp, newPassword: 'DifferentPassword456!' })
    });
    assert.equal(resetResponse.status, 200);
    assert.equal(await MaXacThucModel.countDocuments({ email, muc_dich: 'QUEN_MAT_KHAU' }), 0);
    const resetUser = await NguoiDungModel.findOne({ email }).lean() as { mat_khau?: string } | null;
    assert.equal(await comparePassword('DifferentPassword456!', String(resetUser?.mat_khau)), true);

    brevoStatus = 401;
    const failedResponse = await fetch(`${baseUrl}/api/auth/register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'OTP Failed Delivery Test',
        email: failedEmail,
        password: 'Password123!',
        role: 'USER'
      })
    });
    const failedBody = await failedResponse.json() as { success: boolean };
    assert.equal(failedResponse.status, 503);
    assert.equal(failedBody.success, false);
    assert.equal(await MaXacThucModel.countDocuments({ email: failedEmail }), 0);
  } finally {
    globalThis.fetch = nativeFetch;
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    db.users = db.users.filter(user => user.email !== email);
    db.isMongoConnected = previousMongoState;
    await mongoose.connection.dropDatabase().catch(() => undefined);
    await mongoose.disconnect().catch(() => undefined);
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
