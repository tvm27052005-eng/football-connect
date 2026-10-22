// Reviewed against App.tsx, Navbar and the booking, venue, match and profile pages.
// Routes stay in trusted action metadata and are never shown as browser links in replies.
export interface AssistantAction {
  id: 'find-venues' | 'create-booking' | 'my-bookings' | 'friendly-matches' | 'messages' | 'profile' | 'login' | 'register';
  label: string;
  path: string;
}
export interface AssistantGuide {
  id: string;
  keys: RegExp;
  vi: string;
  en: string;
  actions?: AssistantAction[];
}

const action = (id: AssistantAction['id'], label: string, path: string): AssistantAction => ({ id, label, path });

export const guides: AssistantGuide[] = [
  { id: 'features', keys: /chuc nang|tinh nang|huong dan su dung|features|getting started/, vi: 'Football-Connect hỗ trợ Tìm sân bóng, Đặt lịch sân, Lịch đặt của tôi, Kèo giao hữu, Tin nhắn và Hồ sơ. Đặt lịch sân, lịch đặt, tin nhắn và hồ sơ cần đăng nhập. Chủ sân có khu vực quản lý cụm sân, sân con, đơn đặt và đánh giá theo quyền tài khoản.', en: 'Football-Connect provides Find football pitches, Book a pitch, My bookings, Friendly matches, Messages and Profile. Booking, personal bookings, messages and profile require sign-in. Venue owners have role-based management for venues, fields, bookings and reviews.', actions: [action('find-venues', 'Mở Tìm sân bóng', '/venues'), action('create-booking', 'Mở Đặt lịch sân', '/booking/create')] },
  { id: 'booking', keys: /dat san|dat lich|thanh toan|chuyen khoan|booking|book a|payment|huong dan/, vi: 'Để đặt sân: đăng nhập → chọn **Đặt lịch sân** trên menu → chọn cụm sân, sân con, ngày và khung giờ còn trống → kiểm tra thông tin, thêm ghi chú nếu cần → xác nhận đặt sân. Bạn cũng có thể vào **Tìm sân bóng**, chọn một sân phù hợp rồi bấm **Đặt sân ngay**. Hệ thống hiện hỗ trợ chuyển khoản ngân hàng và hiển thị hướng dẫn QR sau khi tạo đơn. Tạo đơn chưa đồng nghĩa đã thanh toán; hãy mở **Lịch đặt của tôi** để kiểm tra trạng thái.', en: 'To book: sign in → choose **Book a pitch** from the menu → select a venue, field, date and available time → review the details, add an optional note → confirm. You can also open **Find football pitches**, choose a venue, then select **Book now**. The current flow supports bank transfer and shows QR instructions after the booking is created. Creating a booking does not confirm payment; check **My bookings** for its status.', actions: [action('create-booking', 'Mở Đặt lịch sân', '/booking/create'), action('find-venues', 'Mở Tìm sân bóng', '/venues')] },
  { id: 'account', keys: /dang nhap|tai khoan|mat khau|login|account|password/, vi: 'Chọn **Đăng nhập** hoặc **Đăng ký** trên website; sau khi đăng nhập, mở **Hồ sơ** để xem thông tin tài khoản. Nếu không đăng nhập được, hãy kiểm tra email và thông báo lỗi đang hiển thị. Mình không thể xác minh, mở khóa hoặc thay đổi tài khoản qua chat. Không gửi mật khẩu hay OTP.', en: 'Choose **Sign in** or **Register** on the website, then open **Profile** after signing in. If sign-in fails, check your email and the displayed error. I cannot verify, unlock or modify an account through chat. Never send passwords or OTPs.', actions: [action('login', 'Mở Đăng nhập', '/login'), action('register', 'Mở Đăng ký', '/register')] },
  { id: 'error', keys: /loi|khong truy cap|khong phan hoi|khong gui|mobile|error|broken|not working/, vi: 'Bạn gặp lỗi ở phần nào, sau thao tác nào và thông báo chính xác là gì? Hãy cho biết thiết bị và trình duyệt; không gửi mật khẩu, OTP hoặc thông tin thanh toán. Bạn có thể kiểm tra kết nối và tải lại trang sau khi lưu nội dung đang nhập. Với đơn đặt hoặc thanh toán, hãy mở **Lịch đặt của tôi** trước khi thử lại để tránh tạo đơn trùng.', en: 'Which section, action and exact error are involved? Include your device and browser, but no passwords, OTPs or payment details. Check the connection and reload after saving your draft. For bookings or payments, open **My bookings** before retrying to avoid duplicates.', actions: [action('my-bookings', 'Mở Lịch đặt của tôi', '/bookings')] },
  { id: 'matches', keys: /keo|giao huu|doi thu|friendly|match/, vi: 'Chọn **Kèo giao hữu** để xem các kèo đang có, sau đó chọn một kèo để xem chi tiết và thao tác tham gia phù hợp với tài khoản. Đây là kèo bóng đá phong trào, không phải nguồn tỷ số hoặc lịch giải chuyên nghiệp trực tiếp.', en: 'Choose **Friendly matches**, then select a match to view details and the participation actions available to your account. These are community matches, not a live professional results feed.', actions: [action('friendly-matches', 'Mở Kèo giao hữu', '/matches')] },
  { id: 'venues', keys: /san|gia|khu vuc|venue|price|field/, vi: 'Chọn **Tìm sân bóng** để lọc theo khu vực, loại sân, khoảng giá và đánh giá; sau đó chọn một sân để xem chi tiết. Chatbot chưa đọc giá và lịch trống theo thời gian thực nên không thể xác nhận sân rẻ nhất hoặc giờ còn trống. Bạn đang tìm sân ở khu vực nào?', en: 'Choose **Find football pitches** to filter by area, field type, price range and rating, then select a venue for details. The assistant does not read live prices or availability, so it cannot confirm the cheapest venue or a free slot. Which area are you searching in?', actions: [action('find-venues', 'Mở Tìm sân bóng', '/venues')] },
];
export const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
export function retrieve(message: string, history: { sender: string; text: string }[]) {
  const query = normalize(message).replace(/tra loi/g, 'phan hoi');
  let guide = guides.find(g => g.keys.test(query));
  if (!guide && /^(tiep|con|vay|buoc|chi tiet|noi ro|yes|next|more|how|continue|phan hoi bang)|english|tieng anh|tieng viet/.test(query)) {
    for (const prior of [...history].reverse().filter(m => m.sender === 'user')) {
      guide = guides.find(g => g.keys.test(normalize(prior.text)));
      if (guide) break;
    }
  }
  return guide;
}
