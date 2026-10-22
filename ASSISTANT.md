# Football-Connect Assistant

## Kiến trúc và phạm vi đã xác minh

Ứng dụng dùng React 19, TypeScript, Vite, Tailwind; Express, Socket.IO và MongoDB/Mongoose ở server. `server/models/db.ts` có bộ nhớ đệm và dữ liệu seed, được đồng bộ từ MongoDB khi kết nối thành công. Khi MongoDB lỗi, ứng dụng hiện có chế độ fallback dữ liệu trong bộ nhớ. Chatbot không sử dụng dữ liệu seed làm dữ liệu thực tế.

Các trang đang tồn tại: tìm sân và chi tiết sân, đặt sân, lịch đặt cá nhân, kèo giao hữu, chat giữa người dùng, hồ sơ, đăng nhập/đăng ký; cổng chủ sân và quản trị theo vai trò. Trang đặt sân hiện hiển thị lựa chọn chuyển khoản ngân hàng và hướng dẫn QR. Chat giữa người dùng không được coi là kênh nhân viên hỗ trợ. Widget giữ phạm vi tích hợp sẵn có: hiển thị cho khách/người dùng/chủ sân, không hiển thị cho admin.

Luồng: widget → `POST /api/ai/chat` → giới hạn body/tần suất → Zod kiểm tra input → truy xuất hướng dẫn có liên quan → AI provider tùy chọn → phản hồi hoặc hướng dẫn dự phòng. Nội dung trả lời dùng đúng nhãn giao diện như **Tìm sân bóng** và **Đặt lịch sân**, không hiện route trình duyệt. Backend trả thêm action có cấu trúc; frontend chỉ nhận các action trong whitelist rồi điều hướng nội bộ bằng React Router. Không có truy vấn SQL, shell, thao tác đặt sân hoặc đọc dữ liệu tài khoản do AI điều khiển.

Kho hướng dẫn nhỏ được truy xuất bằng ý định/từ khóa, hỗ trợ tìm lại chủ đề của tin người dùng trước đó. Đây không phải vector RAG. AI chỉ nhận đoạn hướng dẫn liên quan và lịch sử giới hạn; không nhận hồ sơ, token đăng nhập, email tài khoản hay dữ liệu người khác từ database. Email/số điện thoại và một số mẫu bí mật trong tin nhắn được che trước khi gửi AI. Cơ chế che không bảo đảm nhận diện mọi dạng dữ liệu cá nhân; giao diện yêu cầu người dùng không nhập bí mật.

## Các file

- `server/controllers/ai.controller.ts`: schema và HTTP response.
- `server/routes/ai.routes.ts`: route và rate limiter.
- `server/middlewares/assistant.middleware.ts`: 12 yêu cầu/IP/phút, bộ nhớ giới hạn.
- `server/services/assistant.knowledge.ts`: hướng dẫn tiếng Việt/Anh đã đối chiếu mã nguồn.
- `server/services/assistant.service.ts`: ngữ cảnh, ngôn ngữ, chuyển tiếp, che dữ liệu, timeout/fallback.
- `server/services/assistant.provider.ts`: interface có thể thay nhà cung cấp; adapter Gemini dùng SDK hiện có.
- `server/app.ts`: giới hạn JSON chat 32 KB và lỗi JSON có cấu trúc.
- `src/services/ai.api.ts`: lịch sử giới hạn, timeout 30 giây, hủy request.
- `src/components/common/AIChatWidget.tsx`: giao diện, phiên, retry, trạng thái và email hỗ trợ.
- `src/components/common/AssistantText.tsx`: Markdown giới hạn an toàn (in đậm, đoạn, xuống dòng), không thực thi HTML hoặc link tùy ý.
- `server/tests/assistant.test.ts`, `package.json`: kiểm thử.
- `.env.example`, `README.md`, `ASSISTANT.md`: cấu hình/tài liệu.

## Cài đặt và cấu hình

Không thêm dependency mới. Cài dependency khóa trong repository bằng `npm ci` (PowerShell có thể dùng `npm.cmd ci`). Sao chép `.env.example` thành `.env`, rồi cấu hình MongoDB và các biến hiện có của ứng dụng. Loader server hiện đọc `.env`, không phải `.env.local`.

```dotenv
AI_PROVIDER=knowledge
AI_MODEL=
GEMINI_API_KEY=
AI_TIMEOUT_MS=15000
AI_SYSTEM_PROMPT="Friendly, concise and professional."
SUPPORT_EMAIL=
```

Mặc định `knowledge` chạy được không cần khóa AI. Để dùng Gemini, đặt `AI_PROVIDER=gemini`, điền `GEMINI_API_KEY` và `AI_MODEL` là ID model được tài khoản Google AI của bạn cấp quyền; khởi động lại server. Không dùng tiền tố `VITE_` cho bí mật. Khóa chỉ được đọc tại server. `AI_TIMEOUT_MS` được chặn trong khoảng 1–25 giây. `AI_SYSTEM_PROMPT` là phần hướng dẫn phong cách, không thay các ràng buộc cơ bản.

`SUPPORT_EMAIL` phải là hộp thư được đơn vị vận hành xác minh. Nếu để trống, chatbot nói rõ chưa cấu hình kênh hỗ trợ. Nút soạn email chỉ mở ứng dụng email; không tự gửi, không tạo ticket và không báo đã gửi. Các thông tin liên hệ viết cứng trong footer chưa được xác minh nên không tự động sử dụng.

```powershell
npm.cmd run dev
# http://localhost:3000
npm.cmd run lint
npm.cmd run test:assistant
npm.cmd run build
```

## API

```json
{"message":"Hướng dẫn đặt sân","history":[{"sender":"user","text":"Tôi cần đặt sân"}]}
```

Message: 1–2.000 ký tự sau trim. History: tối đa 10 tin, mỗi tin tối đa 2.000 ký tự, tổng tối đa 12.000; chỉ role `user`/`ai`. Frontend tự cắt context, backend từ chối dữ liệu vượt giới hạn. Response gồm `reply`, `actions` (nút điều hướng nội bộ), `mode` (`knowledge`/`ai`), `reason` tùy chọn (`TIMEOUT`/`AI_UNAVAILABLE`), `source` (ID hướng dẫn), `handoff` (`email`, `sent:false`) hoặc null. Frontend không tin nhãn/path từ response mà ánh xạ lại theo ID action đã cho phép. Mã lỗi: 400 đầu vào, 413 body quá lớn, 429 giới hạn yêu cầu có `Retry-After`, 503 lỗi nội bộ. Provider lỗi vẫn trả 200 kèm hướng dẫn xác minh và lý do fallback; giao diện hiển thị thông báo rõ ràng.

## Lịch sử và bảo mật

Lưu tối đa 40 tin trong `sessionStorage` của tab, hết hạn sau 24 giờ không cập nhật; đổi tài khoản/đăng xuất sẽ xóa phiên, nút xóa hủy cả request đang chờ. Đóng tab kết thúc sessionStorage (trình duyệt có thể khôi phục phiên theo cài đặt). Backend không ghi hội thoại vào database hoặc log. Không có tính năng xem hội thoại người khác.

Prompt injection được giảm thiểu bằng system instruction riêng, chặn một số mẫu rõ ràng, dữ liệu tối thiểu và không cấp công cụ/thông tin riêng cho AI. Đây không phải bảo đảm tuyệt đối về chất lượng câu trả lời của model. Không đặt bất kỳ bí mật nào trong `AI_SYSTEM_PROMPT`.

## Kiểm thử và giới hạn

Kết quả thực thi ngày 22/10/2026: `npm run test:assistant` đạt **9/9**; TypeScript và build production đã chạy thành công. Build có cảnh báo bundle frontend lớn hơn 500 KB (không làm build thất bại). Kiểm tra mã frontend build không thấy các định danh `GEMINI_API_KEY`, `GoogleGenAI`, `AI_SYSTEM_PROMPT`; kiểm thử không dùng khóa AI thật.

Chạy `npm run test:assistant`: input tiếng Việt và giới hạn, chủ đề tiếp nối/đổi ngôn ngữ, câu hỏi ngoài phạm vi/thiếu dữ liệu, chuyển tiếp chưa gửi, AI lỗi/timeout bằng provider giả lập, che dữ liệu/chặn injection phổ biến, render XSS, HTTP rate limit/header giả và smoke test route cũ. Các bài này không gọi AI trả phí và không ghi database.

Kiểm tra trình duyệt cần thực hiện thêm trên desktop và mobile 360×800/390×844:

1. Mở/thu nhỏ, Escape, xóa hội thoại khi đang gửi; không nhận lại phản hồi đã hủy.
2. Nhập tiếng Việt, Enter gửi, Shift+Enter xuống dòng, chọn cả 5 gợi ý.
3. Hỏi đặt sân rồi “chi tiết hơn”, “trả lời bằng tiếng Anh”.
4. Reload cùng tab giữ phiên; đăng xuất/đổi tài khoản xóa nội dung.
5. DevTools Offline → gửi → thấy lỗi; bật mạng → thử lại không nhân đôi câu hỏi.
6. Kiểm tra khung chat/textarea khi bàn phím mobile mở, không đè thanh điều hướng dưới, nội dung dài không tràn.
7. Kiểm tra tìm sân, đăng nhập, đặt sân, chat và các cổng theo vai trò với tài khoản thử nghiệm.

Môi trường thực thi hiện không có browser kết nối nên chưa xác minh các thao tác UI này. Chưa gọi Gemini thật, chưa kiểm thử gửi email thật hoặc đầy đủ nghiệp vụ với MongoDB/tài khoản thật. Không có API tỷ số/lịch thi đấu chuyên nghiệp, không trả giá/lịch trống trực tiếp trong chatbot; hướng người dùng tới trang tương ứng.

## Production

Thiết lập `.env`/secret manager ở server, `JWT_SECRET` riêng đủ mạnh cho ứng dụng, MongoDB production và hộp thư hỗ trợ thật. Chạy `npm ci`, `npm run lint`, `npm run test:assistant`, `npm run build`, sau đó:

```powershell
$env:NODE_ENV = 'production'
npm.cmd start
```

Ứng dụng hiện nghe cổng 3000. Dùng reverse proxy HTTPS và process manager; chỉ phục vụ `dist` theo cấu trúc hiện có, không phục vụ thư mục repository hay `.env`. Giới hạn chi phí Gemini tại tài khoản nhà cung cấp. Với nhiều instance, thay limiter in-memory bằng Redis hoặc limiter ở gateway; limiter hiện reset khi process restart. Express hiện không tin `X-Forwarded-For`; sau reverse proxy sẽ gom giới hạn theo IP proxy. Cấu hình trust proxy đúng topology và limiter chung trước khi mở rộng; không đặt `trust proxy=true` tùy tiện.

Các API nghiệp vụ, authentication và Socket.IO giữ nguyên; đánh giá production đầy đủ của toàn bộ ứng dụng nằm ngoài thay đổi chatbot này.
