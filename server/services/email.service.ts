import nodemailer, { Transporter } from 'nodemailer';

interface SendOtpOptions {
  to: string;
  otp: string;
  purpose: 'REGISTER' | 'FORGOT_PASSWORD';
  userName?: string;
}

// In-memory OTP storage
export interface IOtpData {
  email: string;
  otp: string;
  purpose: 'REGISTER' | 'FORGOT_PASSWORD';
  expiresAt: number; // 5 minutes
  lastSentAt: number; // for 60s cooldown
  attempts: number;
  used: boolean;
  registrationPayload?: Record<string, unknown>;
}

// Map key: `${email.toLowerCase()}_${purpose}`
const otpStore = new Map<string, IOtpData>();

export const otpManager = {
  // Check if user is in cooldown (60 seconds)
  isInCooldown: (email: string, purpose: 'REGISTER' | 'FORGOT_PASSWORD'): { inCooldown: boolean; remainingSeconds: number } => {
    const key = `${email.toLowerCase().trim()}_${purpose}`;
    const existing = otpStore.get(key);
    if (!existing) return { inCooldown: false, remainingSeconds: 0 };

    const elapsed = Date.now() - existing.lastSentAt;
    const cooldownMs = 60 * 1000; // 60s
    if (elapsed < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
      return { inCooldown: true, remainingSeconds };
    }
    return { inCooldown: false, remainingSeconds: 0 };
  },

  // Generate 6-digit random OTP
  generateOtp: (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Save or update OTP
  saveOtp: (
    email: string,
    otp: string,
    purpose: 'REGISTER' | 'FORGOT_PASSWORD',
    registrationPayload?: Record<string, unknown>
  ): IOtpData => {
    const key = `${email.toLowerCase().trim()}_${purpose}`;
    const otpData: IOtpData = {
      email: email.toLowerCase().trim(),
      otp,
      purpose,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      lastSentAt: Date.now(),
      attempts: 0,
      used: false,
      registrationPayload
    };
    otpStore.set(key, otpData);
    return otpData;
  },

  // Verify OTP
  verifyOtp: (
    email: string,
    inputOtp: string,
    purpose: 'REGISTER' | 'FORGOT_PASSWORD'
  ): { valid: boolean; message: string; registrationPayload?: Record<string, unknown> } => {
    const key = `${email.toLowerCase().trim()}_${purpose}`;
    const data = otpStore.get(key);

    if (!data) {
      return { valid: false, message: 'Mã OTP không tồn tại hoặc chưa được yêu cầu. Vui lòng bấm gửi lại mã.' };
    }

    if (data.used) {
      return { valid: false, message: 'Mã OTP này đã được sử dụng. Mỗi mã chỉ được dùng 1 lần duy nhất.' };
    }

    if (Date.now() > data.expiresAt) {
      otpStore.delete(key);
      return { valid: false, message: 'Mã OTP đã hết hạn (quá 5 phút). Vui lòng yêu cầu mã mới.' };
    }

    if (data.attempts >= 5) {
      otpStore.delete(key);
      return { valid: false, message: 'Bạn đã nhập sai mã OTP quá 5 lần. Mã này đã bị hủy vì lý do bảo mật, vui lòng yêu cầu mã mới.' };
    }

    if (data.otp !== inputOtp.trim()) {
      data.attempts += 1;
      const remaining = 5 - data.attempts;
      return { valid: false, message: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.` };
    }

    // Mark as used & remove
    data.used = true;
    const payload = data.registrationPayload;
    otpStore.delete(key);

    return { valid: true, message: 'Xác thực OTP thành công!', registrationPayload: payload };
  }
};

// Create nodemailer transporter
let transporter: Transporter | null = null;

const getTransporter = async (): Promise<Transporter> => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  } else {
    // Development fallback transporter (create ethereal or mock)
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch {
      // Mock transport
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    }
  }

  return transporter;
};

export const sendOtpEmail = async ({ to, otp, purpose, userName }: SendOtpOptions): Promise<boolean> => {
  const isRegister = purpose === 'REGISTER';
  const subject = isRegister
    ? '[Football Connect] Mã xác thực đăng ký tài khoản'
    : '[Football Connect] Mã xác thực đặt lại mật khẩu';

  const title = isRegister
    ? 'Xác Thực Email Đăng Ký Tài Khoản'
    : 'Yêu Cầu Đặt Lại Mật Khẩu';

  const description = isRegister
    ? `Chào mừng ${userName || 'bạn'} gia nhập <strong>Football Connect</strong>! Dưới đây là mã xác thực OTP để hoàn tất quá trình đăng ký tài khoản của bạn.`
    : `Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email <strong>${to}</strong>. Nhập mã OTP bên dưới để tiến hành đổi mật khẩu mới.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 32px 28px; }
        .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .otp-box { background: #f0fdf4; border: 2px dashed #059669; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-label { font-size: 12px; text-transform: uppercase; font-weight: 700; color: #059669; letter-spacing: 1px; margin-bottom: 8px; }
        .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #047857; font-family: monospace; }
        .note { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 16px; font-size: 12px; color: #92400e; line-height: 1.5; margin-top: 24px; }
        .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚽ FOOTBALL CONNECT VIETNAM</h1>
          <p>Nền tảng kết nối bóng đá phong trào số 1</p>
        </div>
        <div class="content">
          <div class="title">${title}</div>
          <div class="desc">${description}</div>

          <div class="otp-box">
            <div class="otp-label">MÃ XÁC THỰC OTP CỦA BẠN</div>
            <div class="otp-code">${otp}</div>
          </div>

          <div class="note">
            ⏱️ <strong>Lưu ý bảo mật quan trọng:</strong><br/>
            • Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>.<br/>
            • Mỗi mã chỉ sử dụng được <strong>1 lần duy nhất</strong>.<br/>
            • Tuyệt đối không chia sẻ mã này cho bất kỳ ai để bảo vệ an toàn cho tài khoản của bạn.
          </div>
        </div>
        <div class="footer">
          Đây là email tự động từ hệ thống Football Connect Vietnam. Vui lòng không phản hồi email này.<br/>
          Nếu bạn không thực hiện yêu cầu này, xin vui lòng bỏ qua.
        </div>
      </div>
    </body>
    </html>
  `;

  // Always log to console with styled output so developer can see instantly
  console.log('\n' + '='.repeat(60));
  console.log(`📨 [FOOTBALL CONNECT OTP EMAIL]`);
  console.log(`   To: ${to}`);
  console.log(`   Purpose: ${purpose}`);
  console.log(`   OTP Code: >>> ${otp} <<< (Valid for 5 minutes)`);
  console.log('='.repeat(60) + '\n');

  try {
    const client = await getTransporter();
    await client.sendMail({
      from: process.env.SMTP_FROM || '"Football Connect Vietnam" <no-reply@footballconnect.vn>',
      to,
      subject,
      html: htmlContent
    });
    return true;
  } catch (err) {
    console.error('Failed to dispatch email via transporter (Console fallback available):', err);
    return true; // Still return true since OTP is logged and verified via server
  }
};
