import assert from 'node:assert/strict';
import test from 'node:test';
import { getEmailConfigurationStatus, sendOtpEmail } from '../services/email.service.js';

test('ưu tiên Brevo khi có API key và kiểm tra MAIL_FROM', () => {
  assert.deepEqual(getEmailConfigurationStatus({
    BREVO_API_KEY: 'xkeysib-test',
    MAIL_FROM: 'Football Connect <sender@example.com>'
  }), {
    configured: true,
    provider: 'brevo',
    from: 'Football Connect <sender@example.com>'
  });

  assert.deepEqual(getEmailConfigurationStatus({
    MAIL_PROVIDER: 'brevo',
    BREVO_API_KEY: 'xkeysib-test'
  }), {
    configured: false,
    provider: 'brevo',
    reason: 'Thiếu MAIL_FROM'
  });
});

test('chọn Resend khi có API key và kiểm tra MAIL_FROM', () => {
  assert.deepEqual(getEmailConfigurationStatus({
    RESEND_API_KEY: 're_test',
    MAIL_FROM: 'no-reply@example.com'
  }), {
    configured: true,
    provider: 'resend',
    from: 'no-reply@example.com'
  });

  assert.deepEqual(getEmailConfigurationStatus({
    MAIL_PROVIDER: 'resend',
    RESEND_API_KEY: 're_test'
  }), {
    configured: false,
    provider: 'resend',
    reason: 'Thiếu MAIL_FROM'
  });
});

test('vẫn hỗ trợ SMTP khi được chọn rõ ràng', () => {
  assert.deepEqual(getEmailConfigurationStatus({
    MAIL_PROVIDER: 'smtp',
    MAIL_USER: 'mailer@example.com',
    MAIL_PASS: 'secret'
  }), {
    configured: true,
    provider: 'smtp',
    from: 'mailer@example.com'
  });
});

test('gửi OTP qua Brevo Transactional API với sender đã tách tên và email', async () => {
  const previousEnvironment = {
    MAIL_PROVIDER: process.env.MAIL_PROVIDER,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    MAIL_FROM: process.env.MAIL_FROM
  };
  const originalFetch = globalThis.fetch;
  let capturedUrl = '';
  let capturedInit: RequestInit | undefined;

  process.env.MAIL_PROVIDER = 'brevo';
  process.env.BREVO_API_KEY = 'xkeysib-test-key';
  process.env.MAIL_FROM = 'Football Connect <verified@gmail.com>';
  globalThis.fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedInit = init;
    return new Response(JSON.stringify({ messageId: '<message@brevo>' }), { status: 201 });
  };

  try {
    const sent = await sendOtpEmail({
      to: 'user@example.com',
      otp: '654321',
      purpose: 'REGISTER',
      userName: 'Người dùng thử'
    });

    assert.equal(sent, true);
    assert.equal(capturedUrl, 'https://api.brevo.com/v3/smtp/email');
    const headers = capturedInit?.headers as Record<string, string>;
    assert.equal(headers['api-key'], 'xkeysib-test-key');
    assert.equal(headers.Accept, 'application/json');

    const body = JSON.parse(String(capturedInit?.body));
    assert.deepEqual(body.sender, {
      name: 'Football Connect',
      email: 'verified@gmail.com'
    });
    assert.deepEqual(body.to, [{ email: 'user@example.com' }]);
    assert.equal(body.subject.includes('Football Connect'), true);
    assert.match(body.htmlContent, /654321/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('gửi OTP qua Resend REST API và escape dữ liệu HTML', async () => {
  const previousEnvironment = {
    MAIL_PROVIDER: process.env.MAIL_PROVIDER,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    MAIL_FROM: process.env.MAIL_FROM
  };
  const originalFetch = globalThis.fetch;
  let capturedUrl = '';
  let capturedInit: RequestInit | undefined;

  process.env.MAIL_PROVIDER = 'resend';
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.MAIL_FROM = 'no-reply@example.com';
  globalThis.fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedInit = init;
    return new Response(JSON.stringify({ id: 'email_123' }), { status: 200 });
  };

  try {
    const sent = await sendOtpEmail({
      to: 'user@example.com',
      otp: '123456',
      purpose: 'REGISTER',
      userName: '<script>alert(1)</script>'
    });

    assert.equal(sent, true);
    assert.equal(capturedUrl, 'https://api.resend.com/emails');
    assert.equal((capturedInit?.headers as Record<string, string>).Authorization, 'Bearer re_test_key');

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.from, '"Football Connect Vietnam" <no-reply@example.com>');
    assert.deepEqual(body.to, ['user@example.com']);
    assert.match(body.html, /123456/);
    assert.match(body.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(body.html, /<script>alert\(1\)<\/script>/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
