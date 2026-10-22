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
