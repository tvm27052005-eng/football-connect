<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b9a443c2-78d3-4631-94b0-cbd3b55badd7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and configure MongoDB and server settings. The assistant works in knowledge mode without an AI key.
3. Run the app:
   `npm run dev`

See [ASSISTANT.md](ASSISTANT.md) for chatbot architecture, AI configuration, privacy, testing and production deployment.

## Email OTP bằng Brevo API trên Render

Ứng dụng gửi OTP qua Brevo Transactional API bằng HTTPS, phù hợp với Render Free và không cần mở cổng SMTP. Cấu hình mặc định:

```env
MAIL_PROVIDER="brevo"
BREVO_API_KEY="xkeysib-your-api-key"
MAIL_FROM="Football Connect <your-verified-email@gmail.com>"
```

Các bước cấu hình:

1. Tạo tài khoản Brevo Free tại `https://www.brevo.com` và xác nhận email tài khoản.
2. Trong Brevo, mở **Settings → Senders, Domains & Dedicated IPs → Senders → Add a sender**.
3. Nhập tên `Football Connect` và địa chỉ Gmail bạn đang sở hữu. Nhập mã xác thực 6 chữ số Brevo gửi về Gmail để sender chuyển sang trạng thái đã xác minh.
4. Mở **Settings → SMTP & API → API Keys**, chọn **Generate a new API key**, đặt tên như `football-connect-render` và sao chép key bắt đầu bằng `xkeysib-`. Brevo chỉ hiển thị toàn bộ key một lần.
5. Nếu Brevo yêu cầu kích hoạt Transactional platform, hoàn thành bước kích hoạt hoặc gửi yêu cầu hỗ trợ ngay trong dashboard.
6. Thêm ba biến phía trên vào `.env` để chạy local. `MAIL_FROM` phải dùng đúng email sender vừa xác minh. Không thêm tiền tố `VITE_` và không commit API key.
7. Khởi động lại bằng `npm.cmd run dev`. Log phải có `Email OTP đã cấu hình qua brevo`.
8. Đăng ký bằng email chưa tồn tại, kiểm tra Inbox và Spam rồi nhập OTP nhận được.
9. Trên Render, mở **Service → Environment**, thêm cùng ba biến, lưu và deploy lại commit mới nhất.

Khi chưa có domain riêng, Brevo có thể thay địa chỉ Gmail hiển thị bằng một sender kỹ thuật thuộc `t-sender-sib.com`. Đây là hành vi của Brevo để đáp ứng quy định của nhà cung cấp hộp thư; luồng OTP vẫn hoạt động. Gói Free hiện có giới hạn 300 lượt gửi mỗi ngày.

Kiểm tra tự động không gửi email thật:

```powershell
npm.cmd run test:email
npm.cmd run test:otp
```

Nếu Brevo từ chối request, API đăng ký trả `503` và hệ thống xóa OTP vừa tạo, vì vậy người dùng có thể sửa cấu hình rồi yêu cầu mã mới. Resend và SMTP vẫn được giữ làm phương án dự phòng qua `MAIL_PROVIDER="resend"` hoặc `MAIL_PROVIDER="smtp"`.

## Thanh toán tự động cho từng chủ sân

Luồng đặt sân dùng **payOS** và chuyển tiền thẳng vào tài khoản của từng chủ sân:

1. Mỗi chủ sân tạo một tài khoản/kênh thanh toán payOS, liên kết tài khoản ngân hàng chính chủ và lấy `Client ID`, `API Key`, `Checksum Key`.
   Chủ sân có thể đăng nhập cổng chủ sân, mở **Thanh toán & QR payOS**, nhập ba thông tin này và bấm **Kết nối và kiểm tra payOS**. Hệ thống sẽ xác thực tài khoản, lưu secret đã mã hóa ở server và tự dùng đúng tài khoản cho các đơn của chủ sân đó. Có thể mở liên kết đăng ký payOS ngay tại màn hình này.
2. Đặt `APP_URL` thành địa chỉ HTTPS công khai của website. `localhost` chỉ dùng khi phát triển và không thể nhận webhook từ payOS.
3. Cách khuyến nghị là kết nối trong cổng chủ sân. Cách cấu hình `.env` dưới đây vẫn được hỗ trợ để tương thích các kênh cũ:

   ```env
   APP_URL="https://football-connect.example"
   PAYOS_CHANNELS_JSON='{"owner_001":{"clientId":"...","apiKey":"...","checksumKey":"..."},"owner_002":{"clientId":"...","apiKey":"...","checksumKey":"..."}}'
   PAYMENT_HOLD_MINUTES="15"
   BOOKING_CANCEL_BEFORE_HOURS="2"
   ```

4. Trong từng kênh payOS, đăng ký webhook HTTPS theo mẫu:

   ```text
   https://football-connect.example/api/payments/payos/webhook/owner_001
   ```

   Phần cuối URL phải đúng ID của chủ sân sở hữu kênh. Server dùng `Checksum Key` của chính kênh đó để xác minh chữ ký; không đưa ba khóa payOS vào biến `VITE_*` hoặc mã front-end.

Đơn mới ở trạng thái `Chờ thanh toán`. Server giữ ca trong thời gian cấu hình, tự hủy đơn chưa trả đủ tiền, đồng thời đối soát lại với payOS nếu webhook bị chậm. Chỉ webhook có chữ ký hợp lệ hoặc kết quả đối soát server-to-server mới được chuyển đơn sang `Đã hoàn thành`.

Khách đã thanh toán cần liên hệ chủ sân trước hạn hủy. Chủ sân hủy đơn để tạo khoản `Chờ hoàn tiền`, chuyển tiền lại qua ngân hàng, rồi nhập mã giao dịch thực tế để xác nhận `Đã hoàn tiền`. Nút xác nhận chỉ ghi nhận việc hoàn tiền đã thực hiện; website không giả lập hoặc tự động chuyển tiền ra.

Chạy kiểm tra thanh toán:

```bash
npm run test:payments
```
