import 'dotenv/config';
import nodemailer, { Transporter } from 'nodemailer';
import { MaXacThucModel } from '../models/mongoose.models.js';

interface SendOtpOptions {
  to: string;
  otp: string;
  purpose: 'REGISTER' | 'FORGOT_PASSWORD';
  userName?: string;
}


type OtpPurpose = 'REGISTER' | 'FORGOT_PASSWORD';
type DbMucDich = 'DANG_KY' | 'QUEN_MAT_KHAU';

const purposeToMucDich = (purpose: OtpPurpose): DbMucDich => {
  return purpose === 'REGISTER' ? 'DANG_KY' : 'QUEN_MAT_KHAU';
};



const OTP_EXPIRY_MS = 60 * 1000;      
const OTP_COOLDOWN_MS = 60 * 1000;     
const OTP_MAX_ATTEMPTS = 5;           

export const otpManager = {

  // Kiểm tra gửi OTP
  isInCooldown: async (
    email: string,
    purpose: OtpPurpose
  ): Promise<{ inCooldown: boolean; remainingSeconds: number }> => {
    const mucDich = purposeToMucDich(purpose);
    const existing = await MaXacThucModel.findOne({
      email: email.toLowerCase().trim(),
      muc_dich: mucDich
    }).sort({ gui_luc: -1 }).lean();

    if (!existing) return { inCooldown: false, remainingSeconds: 0 };

    const elapsed = Date.now() - new Date(existing.gui_luc).getTime();
    if (elapsed < OTP_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
      return { inCooldown: true, remainingSeconds };
    }

    return { inCooldown: false, remainingSeconds: 0 };
  },

  generateOtp: (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  saveOtp: async (
    email: string,
    otp: string,
    purpose: OtpPurpose,
    registrationPayload?: Record<string, unknown>
  ): Promise<void> => {
    const mucDich = purposeToMucDich(purpose);
    const normalizedEmail = email.toLowerCase().trim();

    await MaXacThucModel.deleteMany({
      email: normalizedEmail,
      muc_dich: mucDich
    });

    // Tạo OTP mới: het_han_luc cho MongoDB TTL index là 10 phút để tránh bị MongoDB xóa sớm trước khi check
    const doc = await MaXacThucModel.create({
      email: normalizedEmail,
      ma_otp: otp,
      muc_dich: mucDich,
      het_han_luc: new Date(Date.now() + 10 * 60 * 1000), // 10 phút MongoDB mới tự động xóa
      gui_luc: new Date(),
      so_lan_thu: 0,
      da_su_dung: false,
      du_lieu_dang_ky: registrationPayload || undefined
    });

    console.log(`💾 [SAVE OTP SUCCESS] Đã lưu OTP [${otp}] vào DB cho email: ${normalizedEmail} (mục đích: ${mucDich}, ID: ${doc._id})`);
  },

  // Xác thực OTP
  verifyOtp: async (
    email: string,
    inputOtp: string,
    purpose: OtpPurpose
  ): Promise<{ valid: boolean; message: string; registrationPayload?: Record<string, unknown> }> => {
    const mucDich = purposeToMucDich(purpose);
    const normalizedEmail = email.toLowerCase().trim();
    const cleanInputOtp = String(inputOtp || '').trim();

    // Luôn sắp xếp gui_luc: -1 để lấy mã OTP mới nhất vừa gửi
    const otpDoc = await MaXacThucModel.findOne({
      email: normalizedEmail,
      muc_dich: mucDich
    }).sort({ gui_luc: -1 });

    // Không tìm thấy OTP
    if (!otpDoc) {
      console.warn(`⚠️ [VERIFY OTP] Không tìm thấy OTP trong DB cho email: ${normalizedEmail}, mục đích: ${mucDich}`);
      return {
        valid: false,
        message: 'Mã OTP không tồn tại hoặc bạn chưa bấm gửi mã. Vui lòng bấm "Gửi lại mã OTP"!'
      };
    }

    // Đã sử dụng rồi
    if (otpDoc.da_su_dung) {
      return {
        valid: false,
        message: 'Mã OTP này đã được sử dụng. Mỗi mã chỉ dùng được 1 lần.'
      };
    }

    // Kiểm tra thời gian hết hạn (1 phút = 60s + 30s buffer cho độ trễ mạng/mở mail)
    const elapsedMs = Date.now() - new Date(otpDoc.gui_luc).getTime();
    const maxAllowedMs = OTP_EXPIRY_MS + 30000; // 60s + 30s buffer = 90s
    if (elapsedMs > maxAllowedMs) {
      console.warn(`⚠️ [VERIFY OTP] Mã OTP của ${normalizedEmail} đã hết hạn (đã gửi ${Math.round(elapsedMs / 1000)}s trước, tối đa cho phép ${Math.round(maxAllowedMs / 1000)}s).`);
      await MaXacThucModel.deleteOne({ _id: otpDoc._id });
      return {
        valid: false,
        message: 'Mã OTP đã hết hạn (quá 1 phút). Vui lòng bấm gửi lại mã mới!'
      };
    }

    // Quá số lần thử
    if (otpDoc.so_lan_thu >= OTP_MAX_ATTEMPTS) {
      await MaXacThucModel.deleteOne({ _id: otpDoc._id });
      return {
        valid: false,
        message: 'Bạn đã nhập sai mã OTP quá 5 lần. Mã này đã bị hủy, vui lòng yêu cầu mã mới.'
      };
    }

    const expectedOtp = String(otpDoc.ma_otp || '').trim();
    console.log(`🔍 [VERIFY OTP] Email: ${normalizedEmail} | Nhập: "${cleanInputOtp}" | Trong DB: "${expectedOtp}"`);

    // Sai mã OTP
    if (cleanInputOtp !== expectedOtp) {
      otpDoc.so_lan_thu += 1;
      await otpDoc.save();
      const remaining = OTP_MAX_ATTEMPTS - otpDoc.so_lan_thu;
      return {
        valid: false,
        message: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.`
      };
    }

    // Xác thực thành công — xóa sạch OTP mục đích này trong DB
    const payload = otpDoc.du_lieu_dang_ky;
    await MaXacThucModel.deleteMany({
      email: normalizedEmail,
      muc_dich: mucDich
    });

    console.log(`✅ [VERIFY OTP SUCCESS] Xác thực OTP thành công cho: ${normalizedEmail}`);

    return {
      valid: true,
      message: 'Xác thực OTP thành công!',
      registrationPayload: payload as Record<string, unknown> | undefined
    };
  }
};

// Create nodemailer transporter
let transporter: Transporter | null = null;

const getTransporter = async (): Promise<Transporter> => {
  if (transporter) return transporter;

  const host = (process.env.MAIL_HOST || process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.MAIL_PORT || process.env.SMTP_PORT) || 587;
  const user = (process.env.MAIL_USER || process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.MAIL_PASS || process.env.SMTP_PASS || '').trim();
  // Strip whitespace if present (Gmail app passwords usually have spaces like "lwpa pkma myww ylli")
  const pass = rawPass.replace(/\s+/g, '');

  if (user && pass) {
    if (host.includes('gmail.com') || user.endsWith('@gmail.com') || host === '') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
      console.log(`📧 [Nodemailer] Configured Gmail service for: ${user}`);
    } else {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
      console.log(`📧 [Nodemailer] Configured SMTP (${host}:${port}) for: ${user}`);
    }
  } else {
    throw new Error('Thiếu cấu hình MAIL_USER và MAIL_PASS để gửi email OTP.');
  }

  return transporter;
};

// ========================= SEND OTP EMAIL =========================

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
          <h1>⚽ FOOTBALL CONNECT</h1>
          <p>Nền tảng kết nối bóng đá phong trào số 1 Việt Nam với sự đầu tư của chủ tịch TĂNG VĂN MINH</p>
        </div>
        <div class="content">
          <div class="title">${title}</div>
          <div class="desc">${description}</div>

          <div class="otp-box">
            <div class="otp-label">MÃ XÁC THỰC OTP CỦA BẠN</div>
            <div class="otp-code">${otp}</div>
          </div>

          <div class="note">
            <strong>Lưu ý bảo mật quan trọng:</strong><br/>
            • Mã OTP này có hiệu lực trong vòng <strong>1 phút</strong>.<br/>
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

  const senderUser = (process.env.MAIL_USER || process.env.SMTP_USER || '').trim();
  const customFrom = (process.env.MAIL_FROM || process.env.SMTP_FROM || '').trim();
  const fromAddress = customFrom
    ? (customFrom.includes('<') ? customFrom : `"Football Connect Vietnam" <${customFrom}>`)
    : senderUser
    ? `"Football Connect Vietnam" <${senderUser}>`
    : '"Football Connect Vietnam" <no-reply@footballconnect.vn>';

  try {
    const client = await getTransporter();
    const info = await client.sendMail({
      from: fromAddress,
      to,
      subject,
      html: htmlContent
    });
    console.log(`✅ [EMAIL SENT] OTP successfully sent to: ${to} (MessageId: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`❌ [EMAIL ERROR] Failed to dispatch email to ${to}:`, err);
    return false;
  }
};
