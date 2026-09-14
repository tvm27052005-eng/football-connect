import { Request, Response } from 'express';

export const systemArchitectureDocs = {
  projectName: 'FOOTBALL CONNECT',
  tagline: 'Hệ thống Quản lý lịch sân bóng đá và Kết nối ghép đối trực tuyến hàng đầu',
  version: '2.0.0-PROD',
  architectureSections: [
    {
      id: 'system-arch',
      title: '1. System Architecture',
      content: `
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts + Motion    |
|  Zustand Stores (Auth, Chat, Notif) + React Hook Form + Zod + Axios + Socket.IO   |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / WSS
                                           v
+-----------------------------------------------------------------------------------+
|                                 GATEWAY & NGINX                                   |
|               Reverse Proxy (Port 3000) - Rate Limiting & SSL Termination         |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                             BACKEND REST & SOCKET SERVER                          |
|  Node.js + Express.js + TypeScript + Socket.IO Server Engine                      |
|  Middlewares: JWT Auth, RBAC Guardian, Anti Double-Booking Lock, Error Handler    |
|  Controllers: Auth, Venue, Field, Booking, Match, Chat, Notif, Review, Stats      |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                                DATABASE & STORAGE                                 |
|  MongoDB / Mongoose ODM Data Layer with Atomic Transactions & Compound Indexes   |
|  Collections: users, venues, fields, bookings, matches, matchParticipants, ...    |
+-----------------------------------------------------------------------------------+
      `
    },
    {
      id: 'db-arch',
      title: '2. Database Architecture (Mongoose & MongoDB)',
      content: `
- Users: { id, name, email, password, phone, role[USER|OWNER|ADMIN], avatar, bio, location, skillLevel, preferredFieldType, preferredPosition, isActive }
- Venues: { id, name, ownerId -> User, address, city, district, description, images[], latitude, longitude, amenities[], rating, reviewCount, priceRange, status }
- Fields: { id, venueId -> Venue, name, fieldType[5v5|7v7|11v11], capacity, pricePerHour, surfaceType, status }
- Bookings: { id, userId -> User, venueId -> Venue, fieldId -> Field, bookingDate, startTime, endTime, totalPrice, status[PENDING|CONFIRMED|CANCELLED|COMPLETED], paymentStatus, note }
- Matches: { id, creatorId -> User, title, venueId -> Venue, fieldId -> Field, matchDate, startTime, endTime, fieldType, skillLevel, maxPlayers, currentPlayers, status[OPEN|FULL|STARTED|COMPLETED|CANCELLED], costPerPerson }
- MatchParticipants: { id, matchId -> Match, userId -> User, team[A|B|UNASSIGNED], status[CONFIRMED|LEFT], joinedAt }
- Conversations & Messages: { id, type[DIRECT|MATCH|VENUE], participantIds[] } -> { id, conversationId, senderId, content, type, readBy[] }
- Notifications: { id, userId, title, message, type, isRead, link, createdAt }
- Reviews: { id, userId, venueId, bookingId, rating[1-5], comment, images[], ownerReply }
- Reports: { id, reporterId, targetType, targetId, reason, status }
      `
    },
    {
      id: 'api-arch',
      title: '3. API Architecture (RESTful)',
      content: `
- Auth: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
- Users: GET /api/users/profile, PUT /api/users/profile, PUT /api/users/change-password, GET /api/users (Admin), PUT /api/users/:id/toggle-status
- Venues: GET /api/venues, GET /api/venues/:id, POST /api/venues, PUT /api/venues/:id, DELETE /api/venues/:id
- Fields: GET /api/fields, GET /api/fields/:id/availability?date=..., POST /api/fields, PUT /api/fields/:id, DELETE /api/fields/:id
- Bookings: GET /api/bookings, POST /api/bookings (Anti-conflict), PUT /api/bookings/:id/cancel, PUT /api/bookings/:id/status
- Matches: GET /api/matches, GET /api/matches/recommendations, POST /api/matches, POST /api/matches/:id/join, DELETE /api/matches/:id/leave
- Chat: GET /api/conversations, POST /api/conversations/direct, GET /api/conversations/:id/messages, POST /api/conversations/:id/messages
- Notifications: GET /api/notifications, PUT /api/notifications/read-all, PUT /api/notifications/:id/read
- Reviews: GET /api/reviews, POST /api/reviews, POST /api/reviews/:id/reply, DELETE /api/reviews/:id
- Stats: GET /api/stats/owner, GET /api/stats/admin
      `
    },
    {
      id: 'rbac-matrix',
      title: '10. Role Permission Matrix (RBAC)',
      content: `
| Chức năng / Quyền hạn          | USER (Cầu thủ) | OWNER (Chủ sân) | ADMIN (Quản trị) |
|--------------------------------|:--------------:|:---------------:|:----------------:|
| Đăng ký / Đăng nhập / Profile  |        ✅      |        ✅       |        ✅        |
| Tìm kiếm sân & Xem chi tiết    |        ✅      |        ✅       |        ✅        |
| Đặt sân & Hủy đặt sân của mình |        ✅      |        ✅       |        ✅        |
| Đánh giá sân sau khi đá        |        ✅      |        ❌       |        ❌        |
| Tạo trận tìm đối / Tham gia    |        ✅      |        ✅       |        ✅        |
| Chat trực tuyến & Nhận thông báo|       ✅      |        ✅       |        ✅        |
| Quản lý sân & Sân con của mình |        ❌      |        ✅       |        ✅ (All)  |
| Duyệt / Hủy đặt sân tại cụm sân |       ❌      |        ✅       |        ✅ (All)  |
| Xem thống kê doanh thu cụm sân |        ❌      |        ✅       |        ✅ (Toàn sàn)|
| Trả lời Review của khách       |        ❌      |        ✅       |        ✅        |
| Quản trị User, Khóa tài khoản  |        ❌      |        ❌       |        ✅        |
| Quản trị Báo cáo & Hệ thống    |        ❌      |        ❌       |        ✅        |
      `
    }
  ]
};

export const docsController = {
  getArchitectureDocs: (_req: Request, res: Response): void => {
    res.json({
      success: true,
      data: systemArchitectureDocs
    });
  }
};
