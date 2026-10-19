import {
  IUser,
  IVenue,
  IField,
  IBooking,
  IMatch,
  IMatchParticipant,
  IConversation,
  IMessage,
  INotification,
  IReview,
  IPayment,
  IReport
} from '../types/index.js';

// Pre-seeded Users with passwords (all pass: "123456" for ease of testing)
export const initialUsers: IUser[] = [
  {
    id: 'user_1',
    name: 'Nguyễn Văn Hải',
    email: 'user@footballconnect.vn',
    password: '$2a$10$wNq1cZpvh48p/1P3GgQY6eS6q4h6m8dG.oWcMqvW345eF8Bkm4Y.G', // "123456"
    phone: '0912345678',
    role: 'USER',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    bio: 'Đam mê bóng đá sân 7, vị trí tiền vệ cánh hoặc hộ công. Thường rảnh tối T3, T5, CN.',
    location: { city: 'Hà Nội', district: 'Cầu Giấy', latitude: 21.0285, longitude: 105.7854 },
    skillLevel: 'INTERMEDIATE',
    preferredFieldType: '7_vs_7',
    preferredPosition: 'Tiền vệ (CM/CAM)',
    isActive: true,
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2025-01-10T08:00:00.000Z'
  },
  {
    id: 'user_2',
    name: 'Trần Minh Quang',
    email: 'quang@footballconnect.vn',
    password: '$2a$10$wNq1cZpvh48p/1P3GgQY6eS6q4h6m8dG.oWcMqvW345eF8Bkm4Y.G', // "123456"
    phone: '0988776655',
    role: 'USER',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    bio: 'Thủ môn chuyên bắt sân 5 & 7. Phản xạ tốt, chơi chân tự tin.',
    location: { city: 'Hà Nội', district: 'Thanh Xuân', latitude: 20.9985, longitude: 105.8054 },
    skillLevel: 'ADVANCED',
    preferredFieldType: '7_vs_7',
    preferredPosition: 'Thủ môn (GK)',
    isActive: true,
    createdAt: '2025-01-12T09:00:00.000Z',
    updatedAt: '2025-01-12T09:00:00.000Z'
  },
  {
    id: 'owner_1',
    name: 'Lê Hoàng Long (Chủ sân)',
    email: 'owner@footballconnect.vn',
    password: '$2a$10$wNq1cZpvh48p/1P3GgQY6eS6q4h6m8dG.oWcMqvW345eF8Bkm4Y.G', // "123456"
    phone: '0903456789',
    role: 'OWNER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Chủ chuỗi cụm sân bóng đá cỏ nhân tạo chất lượng cao tại Cầu Giấy và Mỹ Đình.',
    location: { city: 'Hà Nội', district: 'Cầu Giấy', latitude: 21.0333, longitude: 105.7833 },
    businessName: 'Công Ty TNHH Thể Thao Long Phát',
    businessTaxId: '0108928381',
    isActive: true,
    createdAt: '2025-01-05T07:00:00.000Z',
    updatedAt: '2025-01-05T07:00:00.000Z'
  },
  {
    id: 'owner_2',
    name: 'Phạm Đức Thành (Chủ sân SG)',
    email: 'owner2@footballconnect.vn',
    password: '$2a$10$wNq1cZpvh48p/1P3GgQY6eS6q4h6m8dG.oWcMqvW345eF8Bkm4Y.G', // "123456"
    phone: '0938123456',
    role: 'OWNER',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    bio: 'Quản lý cụm sân bóng đá mini Bình Thạnh & Quận 7.',
    location: { city: 'TP. Hồ Chí Minh', district: 'Bình Thạnh', latitude: 10.8015, longitude: 106.7115 },
    businessName: 'CLB Bóng Đá Saigon Arena',
    businessTaxId: '0315894721',
    isActive: true,
    createdAt: '2025-01-08T07:00:00.000Z',
    updatedAt: '2025-01-08T07:00:00.000Z'
  },
  {
    id: 'admin_1',
    name: 'Quản Trị Viên Hệ Thống',
    email: 'admin@footballconnect.vn',
    password: '$2a$10$wNq1cZpvh48p/1P3GgQY6eS6q4h6m8dG.oWcMqvW345eF8Bkm4Y.G', // "123456"
    phone: '0999888999',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    bio: 'Hệ thống Quản trị & Điều phối Football Connect Vietnam.',
    location: { city: 'Hà Nội', district: 'Ba Đình', latitude: 21.0338, longitude: 105.8342 },
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
];

export const initialVenues: IVenue[] = [
  {
    id: 'venue_1',
    name: 'Sân Bóng Đá Cầu Giấy Arena',
    ownerId: 'owner_1',
    ownerName: 'Lê Hoàng Long (Chủ sân)',
    address: 'Số 10 Chu Văn An kéo dài, Phường Dịch Vọng Hậu',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    description: 'Cụm 6 sân cỏ nhân tạo nhập khẩu Châu Âu sợi kim cương êm ái. Hệ thống đèn LED hiện đại đạt chuẩn thi đấu buổi tối, bãi đỗ xe ô tô miễn phí rộng rãi, phòng thay đồ tắm nóng lạnh miễn phí, căng tin phục vụ nước giải khát.',
    images: [
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
      'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800'
    ],
    latitude: 21.0365,
    longitude: 105.7885,
    amenities: ['Bãi đỗ ô tô', 'Hệ thống đèn LED', 'Phòng tắm nóng lạnh', 'Căng tin nước', 'Wifi tốc độ cao', 'Cho thuê áo bib/bóng', 'Khán đài có mái'],
    rating: 4.8,
    reviewCount: 24,
    priceRange: { min: 350000, max: 750000 },
    openTime: '06:00',
    closeTime: '23:00',
    status: 'ACTIVE',
    createdAt: '2025-01-06T10:00:00.000Z',
    updatedAt: '2025-01-06T10:00:00.000Z'
  },
  {
    id: 'venue_2',
    name: 'Trung Tâm Thể Thao Mỹ Đình Star',
    ownerId: 'owner_1',
    ownerName: 'Lê Hoàng Long (Chủ sân)',
    address: 'Đường Lê Đức Thọ, Phường Mỹ Đình 2, Nam Từ Liêm',
    city: 'Hà Nội',
    district: 'Nam Từ Liêm',
    description: 'Tổ hợp sân bóng 7 người và 11 người đạt chuẩn FIFA Quality. Mặt cỏ mềm hạt cao su đàn hồi tốt, thoát nước nhanh sau mưa. Điểm hẹn quen thuộc của các giải phong trào và công ty.',
    images: [
      'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'
    ],
    latitude: 21.0289,
    longitude: 105.7675,
    amenities: ['Bãi đỗ xe lớn', 'Đèn chiếu sáng 800 Lux', 'Phòng y tế sơ cấp cứu', 'Căng tin', 'Trọng tài theo yêu cầu', 'Livestream trận đấu'],
    rating: 4.9,
    reviewCount: 42,
    priceRange: { min: 450000, max: 950000 },
    openTime: '06:00',
    closeTime: '23:30',
    status: 'ACTIVE',
    createdAt: '2025-01-08T10:00:00.000Z',
    updatedAt: '2025-01-08T10:00:00.000Z'
  },
  {
    id: 'venue_3',
    name: 'Sân Bóng Đá Saigon Sport Park',
    ownerId: 'owner_2',
    ownerName: 'Phạm Đức Thành (Chủ sân SG)',
    address: '48/2 Điện Biên Phủ, Phường 25, Quận Bình Thạnh',
    city: 'TP. Hồ Chí Minh',
    district: 'Bình Thạnh',
    description: 'Sân bóng thoáng mát nằm ven kênh Nhiêu Lộc, gió mát tự nhiên. Cỏ mới thay 2025, lưới chắn bóng cao 12m, không gian văn minh thể thao.',
    images: [
      'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800',
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800'
    ],
    latitude: 10.8035,
    longitude: 106.7155,
    amenities: ['Bãi đỗ xe máy & ô tô', 'Tủ đồ locker an toàn', 'Nước trà đá free', 'Bán giày/tất phụ kiện', 'Hỗ trợ ghép đội'],
    rating: 4.7,
    reviewCount: 19,
    priceRange: { min: 300000, max: 650000 },
    openTime: '05:30',
    closeTime: '23:00',
    status: 'ACTIVE',
    createdAt: '2025-01-10T10:00:00.000Z',
    updatedAt: '2025-01-10T10:00:00.000Z'
  },
  {
    id: 'venue_4',
    name: 'Phúc Long Football Hub Thanh Xuân',
    ownerId: 'owner_1',
    ownerName: 'Lê Hoàng Long (Chủ sân)',
    address: '168 Khuất Duy Tiến, Phường Nhân Chính, Thanh Xuân',
    city: 'Hà Nội',
    district: 'Thanh Xuân',
    description: 'Nằm ngay ngã tư Khuất Duy Tiến - Lê Văn Lương thuận tiện đi lại. 4 sân 7 người có thể ghép thành 1 sân 11 người. Mặt cỏ mịn, trơn láng chuẩn thi đấu.',
    images: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800'
    ],
    latitude: 20.9998,
    longitude: 105.7995,
    amenities: ['Gần trung tâm', 'Đèn LED chống chói', 'Phòng thay đồ', 'Bình nước miễn phí', 'Wifi'],
    rating: 4.6,
    reviewCount: 15,
    priceRange: { min: 380000, max: 700000 },
    openTime: '06:00',
    closeTime: '22:30',
    status: 'ACTIVE',
    createdAt: '2025-01-14T10:00:00.000Z',
    updatedAt: '2025-01-14T10:00:00.000Z'
  }
];

export const initialFields: IField[] = [
  // Fields for venue_1 (Cầu Giấy Arena)
  {
    id: 'field_1_1',
    venueId: 'venue_1',
    name: 'Sân 1 (Sân 7 người)',
    fieldType: '7_vs_7',
    capacity: 14,
    pricePerHour: 400000,
    surfaceType: 'ARTIFICIAL_GRASS',
    status: 'ACTIVE',
    createdAt: '2025-01-06T10:00:00.000Z',
    updatedAt: '2025-01-06T10:00:00.000Z'
  },
  {
    id: 'field_1_2',
    venueId: 'venue_1',
    name: 'Sân 2 (Sân 7 người VIP)',
    fieldType: '7_vs_7',
    capacity: 14,
    pricePerHour: 450000,
    surfaceType: 'ARTIFICIAL_GRASS',
    status: 'ACTIVE',
    createdAt: '2025-01-06T10:00:00.000Z',
    updatedAt: '2025-01-06T10:00:00.000Z'
  },
  {
    id: 'field_1_3',
    venueId: 'venue_1',
    name: 'Sân 3 (Sân 5 người)',
    fieldType: '5_vs_5',
    capacity: 10,
    pricePerHour: 280000,
    surfaceType: 'ARTIFICIAL_GRASS',
    status: 'ACTIVE',
    createdAt: '2025-01-06T10:00:00.000Z',
    updatedAt: '2025-01-06T10:00:00.000Z'
  },
  {
    id: 'field_1_4',
    venueId: 'venue_1',
    name: 'Sân 4 (Sân 5 người)',
    fieldType: '5_vs_5',
    capacity: 10,
    pricePerHour: 280000,
    surfaceType: 'ARTIFICIAL_GRASS',
    status: 'ACTIVE',
    createdAt: '2025-01-06T10:00:00.000Z',
    updatedAt: '2025-01-06T10:00:00.000Z'
  },
  // Fields for venue_2 (Mỹ Đình Star)
  {
    id: 'field_2_1',
    venueId: 'venue_2',
    name: 'Sân A1 (Sân 7 người tiêu chuẩn)',
    fieldType: '7_vs_7',
    capacity: 14,
    pricePerHour: 500000,
    surfaceType: 'ARTIFICIAL_GRASS',
    status: 'ACTIVE',
    createdAt: '2025-01-08T10:00:00.000Z',
    updatedAt: '2025-01-08T10:00:00.000Z'
  },
 
  // Fields for venue_3 (Saigon Sport Park)
  {
    id: 'field_3_1',
    venueId: 'venue_3',
    name: 'Sân SG-1 (Sân 5 Futsal ngoài trời)',
    fieldType: '5_vs_5',
    capacity: 10,
    pricePerHour: 300000,
    surfaceType: 'INDOOR_FUTSAL',
    status: 'ACTIVE',
    createdAt: '2025-01-10T10:00:00.000Z',
    updatedAt: '2025-01-10T10:00:00.000Z'
  },
  {
    id: 'field_3_2',
    venueId: 'venue_3',
    name: 'Sân SG-2 (Sân 7 người ven kênh)',
    fieldType: '7_vs_7',
    capacity: 14,
    pricePerHour: 420000,
    surfaceType: 'ARTIFICIAL_GRASS',
    status: 'ACTIVE',
    createdAt: '2025-01-10T10:00:00.000Z',
    updatedAt: '2025-01-10T10:00:00.000Z'
  },
  // Fields for venue_4
  {
    id: 'field_4_1',
    venueId: 'venue_4',
    name: 'Sân TX-01 (Sân 7 người)',
    fieldType: '7_vs_7',
    capacity: 14,
    pricePerHour: 400000,
    surfaceType: 'ARTIFICIAL_GRASS',
    status: 'ACTIVE',
    createdAt: '2025-01-14T10:00:00.000Z',
    updatedAt: '2025-01-14T10:00:00.000Z'
  }
];

// Helper to get formatted today string (YYYY-MM-DD)
const todayStr = new Date().toISOString().split('T')[0];
const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

export const initialBookings: IBooking[] = [
  {
    id: 'book_1',
    userId: 'user_1',
    userName: 'Nguyễn Văn Hải',
    userPhone: '0912345678',
    userEmail: 'user@footballconnect.vn',
    venueId: 'venue_1',
    venueName: 'Sân Bóng Đá Cầu Giấy Arena',
    venueAddress: 'Số 10 Chu Văn An kéo dài, Phường Dịch Vọng Hậu',
    fieldId: 'field_1_1',
    fieldName: 'Sân 1 (Sân 7 người)',
    fieldType: '7_vs_7',
    bookingDate: todayStr,
    startTime: '17:30',
    endTime: '19:00',
    durationHours: 1.5,
    totalPrice: 600000,
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    paymentMethod: 'VNPAY',
    note: 'Đội công ty đá giao lưu, chuẩn bị giúp 1 bộ áo bib đỏ và 2 quả bóng số 5.',
    createdAt: '2025-02-01T10:00:00.000Z',
    updatedAt: '2025-02-01T10:00:00.000Z'
  },
  {
    id: 'book_2',
    userId: 'user_2',
    userName: 'Trần Minh Quang',
    userPhone: '0988776655',
    userEmail: 'quang@footballconnect.vn',
    venueId: 'venue_1',
    venueName: 'Sân Bóng Đá Cầu Giấy Arena',
    venueAddress: 'Số 10 Chu Văn An kéo dài, Phường Dịch Vọng Hậu',
    fieldId: 'field_1_2',
    fieldName: 'Sân 2 (Sân 7 người VIP)',
    fieldType: '7_vs_7',
    bookingDate: todayStr,
    startTime: '19:00',
    endTime: '20:30',
    durationHours: 1.5,
    totalPrice: 675000,
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    paymentMethod: 'MOMO',
    note: 'Trận tìm đối sinh viên Bách Khoa.',
    createdAt: '2025-02-02T11:00:00.000Z',
    updatedAt: '2025-02-02T11:00:00.000Z'
  },
  {
    id: 'book_3',
    userId: 'user_1',
    userName: 'Nguyễn Văn Hải',
    userPhone: '0912345678',
    userEmail: 'user@footballconnect.vn',
    venueId: 'venue_2',
    venueName: 'Trung Tâm Thể Thao Mỹ Đình Star',
    venueAddress: 'Đường Lê Đức Thọ, Phường Mỹ Đình 2, Nam Từ Liêm',
    fieldId: 'field_2_1',
    fieldName: 'Sân A1 (Sân 7 người tiêu chuẩn)',
    fieldType: '7_vs_7',
    bookingDate: tomorrowStr,
    startTime: '18:00',
    endTime: '19:30',
    durationHours: 1.5,
    totalPrice: 750000,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'CASH',
    note: 'Chờ chủ sân duyệt giữ chỗ.',
    createdAt: '2025-02-03T12:00:00.000Z',
    updatedAt: '2025-02-03T12:00:00.000Z'
  },
  {
    id: 'book_4',
    userId: 'user_1',
    userName: 'Nguyễn Văn Hải',
    userPhone: '0912345678',
    userEmail: 'user@footballconnect.vn',
    venueId: 'venue_1',
    venueName: 'Sân Bóng Đá Cầu Giấy Arena',
    venueAddress: 'Số 10 Chu Văn An kéo dài, Phường Dịch Vọng Hậu',
    fieldId: 'field_1_1',
    fieldName: 'Sân 1 (Sân 7 người)',
    fieldType: '7_vs_7',
    bookingDate: '2025-01-20',
    startTime: '19:00',
    endTime: '20:30',
    durationHours: 1.5,
    totalPrice: 600000,
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    paymentMethod: 'VNPAY',
    note: 'Trận đấu đã hoàn thành tốt đẹp.',
    createdAt: '2025-01-18T12:00:00.000Z',
    updatedAt: '2025-01-20T21:00:00.000Z'
  }
];

export const initialMatches: IMatch[] = [
  {
    id: 'match_1',
    creatorId: 'user_1',
    creatorName: 'Nguyễn Văn Hải',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    creatorPhone: '0912345678',
    title: 'FC Cầu Giấy United tìm đối tác giao lưu sân 7 tối nay',
    venueId: 'venue_1',
    venueName: 'Sân Bóng Đá Cầu Giấy Arena',
    venueAddress: 'Số 10 Chu Văn An kéo dài, Phường Dịch Vọng Hậu, Cầu Giấy',
    fieldId: 'field_1_1',
    fieldName: 'Sân 1 (Sân 7 người)',
    matchDate: todayStr,
    startTime: '19:30',
    endTime: '21:00',
    fieldType: '7_vs_7',
    skillLevel: 'INTERMEDIATE',
    maxPlayers: 14,
    currentPlayers: 7,
    description: 'Đội hình văn phòng U25-U30 đá dưỡng sinh vui vẻ, không chơi xấu. Cần tìm 1 Đội đối thủ (Team B) giao lưu nhẹ nhàng chia đôi tiền sân.',
    status: 'OPEN',
    costPerPerson: 300000,
    totalFieldFee: 600000,
    costSharing: '50_50',
    teamAName: 'FC Cầu Giấy Stars',
    teamBName: 'Đang tìm đối thủ Đội B...',
    teamACaptain: 'Nguyễn Văn Hải (Đội trưởng)',
    teamAPhone: '0912345678',
    teamBJoined: false,
    createdAt: '2025-02-01T08:00:00.000Z',
    updatedAt: '2025-02-01T08:00:00.000Z'
  },
  {
    id: 'match_2',
    creatorId: 'user_2',
    creatorName: 'Trần Minh Quang',
    creatorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    creatorPhone: '0988776655',
    title: 'FC Mỹ Đình Warriors cáp kèo giao hữu sân 7 - Đội thua trả tiền sân',
    venueId: 'venue_2',
    venueName: 'Trung Tâm Thể Thao Mỹ Đình Star',
    venueAddress: 'Đường Lê Đức Thọ, Phường Mỹ Đình 2, Nam Từ Liêm',
    fieldId: 'field_2_1',
    fieldName: 'Sân A1 (Sân 7 người tiêu chuẩn)',
    matchDate: tomorrowStr,
    startTime: '18:30',
    endTime: '20:00',
    fieldType: '7_vs_7',
    skillLevel: 'ADVANCED',
    maxPlayers: 14,
    currentPlayers: 14,
    description: 'Trận cọ xát căng thẳng trước giải đấu. Đã có Đội FC Thăng Long nhận kèo bắt cặp thành công.',
    status: 'FULL',
    costPerPerson: 750000,
    totalFieldFee: 750000,
    costSharing: 'LOOSER_PAYS',
    teamAName: 'Mỹ Đình Warriors',
    teamBName: 'FC Thăng Long',
    teamACaptain: 'Trần Minh Quang',
    teamBCaptain: 'Lê Văn Hoàng',
    teamAPhone: '0988776655',
    teamBPhone: '0977112233',
    teamBJoined: true,
    createdAt: '2025-02-02T09:00:00.000Z',
    updatedAt: '2025-02-02T09:00:00.000Z'
  },
  {
    id: 'match_3',
    creatorId: 'user_1',
    creatorName: 'Nguyễn Văn Hải',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    creatorPhone: '0912345678',
    title: 'FC Saigon IT tìm kèo giao lưu sân 5 - Đội A bao toàn bộ tiền sân',
    venueId: 'venue_3',
    venueName: 'Sân Bóng Đá Saigon Sport Park',
    venueAddress: '48/2 Điện Biên Phủ, Phường 25, Quận Bình Thạnh',
    fieldId: 'field_3_1',
    fieldName: 'Sân SG-1',
    matchDate: tomorrowStr,
    startTime: '20:00',
    endTime: '21:30',
    fieldType: '5_vs_5',
    skillLevel: 'BEGINNER',
    maxPlayers: 10,
    currentPlayers: 5,
    description: 'Kèo đá vui giải tỏa stress sau giờ làm việc. Đội A đã trả tiền sân 100%, mời 1 Đội B đối thủ tới giao lưu miễn phí!',
    status: 'OPEN',
    costPerPerson: 0,
    totalFieldFee: 450000,
    costSharing: 'HOME_PAYS',
    teamAName: 'Saigon IT Club',
    teamBName: 'Đang tìm Đội B đối thủ...',
    teamACaptain: 'Nguyễn Văn Hải',
    teamAPhone: '0912345678',
    teamBJoined: false,
    createdAt: '2025-02-03T10:00:00.000Z',
    updatedAt: '2025-02-03T10:00:00.000Z'
  }
];

export const initialMatchParticipants: IMatchParticipant[] = [
  {
    id: 'part_1',
    matchId: 'match_1',
    userId: 'user_1',
    userName: 'Nguyễn Văn Hải',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    userPhone: '0912345678',
    skillLevel: 'INTERMEDIATE',
    team: 'A',
    status: 'CONFIRMED',
    joinedAt: '2025-02-01T08:00:00.000Z'
  },
  {
    id: 'part_2',
    matchId: 'match_1',
    userId: 'user_2',
    userName: 'Trần Minh Quang',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    userPhone: '0988776655',
    skillLevel: 'ADVANCED',
    team: 'B',
    status: 'CONFIRMED',
    joinedAt: '2025-02-01T09:30:00.000Z'
  },
  {
    id: 'part_3',
    matchId: 'match_2',
    userId: 'user_2',
    userName: 'Trần Minh Quang',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    userPhone: '0988776655',
    skillLevel: 'ADVANCED',
    team: 'A',
    status: 'CONFIRMED',
    joinedAt: '2025-02-02T09:00:00.000Z'
  }
];

export const initialConversations: IConversation[] = [
  {
    id: 'conv_1',
    type: 'MATCH',
    title: 'Phòng Chat Trận: FC Cầu Giấy United tìm đối',
    matchId: 'match_1',
    participantIds: ['user_1', 'user_2'],
    lastMessage: {
      content: 'Chào anh em, tối nay anh em mặc áo màu trắng giúp mình nhé!',
      senderId: 'user_1',
      senderName: 'Nguyễn Văn Hải',
      createdAt: '2025-02-01T15:30:00.000Z'
    },
    createdAt: '2025-02-01T08:00:00.000Z',
    updatedAt: '2025-02-01T15:30:00.000Z'
  },
  {
    id: 'conv_2',
    type: 'DIRECT',
    title: 'Lê Hoàng Long (Chủ sân)',
    participantIds: ['user_1', 'owner_1'],
    lastMessage: {
      content: 'Dạ sân số 1 đã chuẩn bị sẵn sàng cho đội của anh lúc 17h30 rồi nhé!',
      senderId: 'owner_1',
      senderName: 'Lê Hoàng Long (Chủ sân)',
      createdAt: '2025-02-01T14:00:00.000Z'
    },
    createdAt: '2025-02-01T10:00:00.000Z',
    updatedAt: '2025-02-01T14:00:00.000Z'
  }
];

export const initialMessages: IMessage[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_1',
    senderId: 'user_1',
    senderName: 'Nguyễn Văn Hải',
    senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    content: 'Chào mừng các bạn tham gia trận đấu giao hữu!',
    type: 'TEXT',
    readBy: ['user_1', 'user_2'],
    createdAt: '2025-02-01T10:00:00.000Z'
  },
  {
    id: 'msg_2',
    conversationId: 'conv_1',
    senderId: 'user_2',
    senderName: 'Trần Minh Quang',
    senderAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    content: 'Em vào đội B bắt gôn nha anh Hải!',
    type: 'TEXT',
    readBy: ['user_1', 'user_2'],
    createdAt: '2025-02-01T11:20:00.000Z'
  },
  {
    id: 'msg_3',
    conversationId: 'conv_1',
    senderId: 'user_1',
    senderName: 'Nguyễn Văn Hải',
    senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    content: 'Chào anh em, tối nay anh em mặc áo màu trắng giúp mình nhé!',
    type: 'TEXT',
    readBy: ['user_1'],
    createdAt: '2025-02-01T15:30:00.000Z'
  },
  {
    id: 'msg_4',
    conversationId: 'conv_2',
    senderId: 'user_1',
    senderName: 'Nguyễn Văn Hải',
    senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    content: 'Anh Long ơi kiểm tra giúp em đơn đặt sân lúc 17h30 hôm nay đã nhận được chưa ạ?',
    type: 'TEXT',
    readBy: ['user_1', 'owner_1'],
    createdAt: '2025-02-01T13:45:00.000Z'
  },
  {
    id: 'msg_5',
    conversationId: 'conv_2',
    senderId: 'owner_1',
    senderName: 'Lê Hoàng Long (Chủ sân)',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    content: 'Dạ sân số 1 đã chuẩn bị sẵn sàng cho đội của anh lúc 17h30 rồi nhé!',
    type: 'TEXT',
    readBy: ['user_1', 'owner_1'],
    createdAt: '2025-02-01T14:00:00.000Z'
  }
];

export const initialNotifications: INotification[] = [
  {
    id: 'notif_1',
    userId: 'user_1',
    title: 'Đặt sân thành công!',
    message: 'Đơn đặt Sân 1 (Sân 7 người) tại Sân Bóng Đá Cầu Giấy Arena lúc 17:30 hôm nay đã được xác nhận.',
    type: 'BOOKING_CONFIRMED',
    link: '/bookings',
    isRead: false,
    createdAt: '2025-02-01T10:00:00.000Z'
  },
  {
    id: 'notif_2',
    userId: 'user_1',
    title: 'Thành viên mới tham gia trận đấu',
    message: 'Trần Minh Quang vừa tham gia trận "FC Cầu Giấy United tìm đối tác giao lưu".',
    type: 'MATCH_JOINED',
    link: '/matches/match_1',
    isRead: false,
    createdAt: '2025-02-01T09:30:00.000Z'
  },
  {
    id: 'notif_3',
    userId: 'owner_1',
    title: 'Có lượt đặt sân mới',
    message: 'Khách hàng Nguyễn Văn Hải vừa đặt Sân A1 lúc 18:00 ngày mai.',
    type: 'SYSTEM',
    link: '/owner/bookings',
    isRead: false,
    createdAt: '2025-02-03T12:00:00.000Z'
  }
];

export const initialReviews: IReview[] = [
  {
    id: 'rev_1',
    userId: 'user_1',
    userName: 'Nguyễn Văn Hải',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    venueId: 'venue_1',
    bookingId: 'book_4',
    rating: 5,
    comment: 'Sân cỏ rất mới và êm, hệ thống đèn sáng trưng không bị chói mắt. Bãi đỗ xe máy ô tô rộng rãi, nhân viên hỗ trợ nhiệt tình. Sẽ ủng hộ lâu dài!',
    images: ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600'],
    ownerReply: {
      content: 'Cảm ơn anh Hải và anh em trong đội đã tin tưởng ủng hộ sân Cầu Giấy Arena. Chúc đội bóng luôn giữ vững đam mê!',
      createdAt: '2025-01-21T09:00:00.000Z'
    },
    createdAt: '2025-01-20T21:30:00.000Z'
  },
  {
    id: 'rev_2',
    userId: 'user_2',
    userName: 'Trần Minh Quang',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    venueId: 'venue_2',
    rating: 5,
    comment: 'Sân 7 người đạt chuẩn FIFA tuyệt vời! Mặt cỏ mướt bóng lăn rất đầm chân. Phòng thay đồ sạch sẽ.',
    createdAt: '2025-01-25T20:00:00.000Z'
  }
];

export const initialReports: IReport[] = [
  {
    id: 'rep_1',
    reporterId: 'user_2',
    reporterName: 'Trần Minh Quang',
    targetType: 'MATCH',
    targetId: 'match_fake',
    targetTitle: 'Kèo bóng đá cá cược bất thường',
    reason: 'Nội dung mô tả có dấu hiệu spam hoặc tổ chức cá cược phi thể thao.',
    status: 'PENDING',
    createdAt: '2025-02-02T14:00:00.000Z'
  }
];

// Persistent Live Database Engine in Server Memory
class DatabaseStore {
  users: IUser[] = [...initialUsers];
  venues: IVenue[] = [...initialVenues];
  fields: IField[] = [...initialFields];
  bookings: IBooking[] = [...initialBookings];
  matches: IMatch[] = [...initialMatches];
  matchParticipants: IMatchParticipant[] = [...initialMatchParticipants];
  conversations: IConversation[] = [...initialConversations];
  messages: IMessage[] = [...initialMessages];
  notifications: INotification[] = [...initialNotifications];
  reviews: IReview[] = [...initialReviews];
  reports: IReport[] = [...initialReports];

  // Helper for generating standard IDs
  generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  // Atomic conflict check for Double Booking prevention
  checkBookingConflict(fieldId: string, bookingDate: string, startTime: string, endTime: string, excludeBookingId?: string): boolean {
    const existing = this.bookings.find(b => {
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.fieldId !== fieldId || b.bookingDate !== bookingDate) return false;
      if (b.status === 'CANCELLED') return false;

      // Time overlap calculation (e.g. 17:30 to 19:00 vs 18:00 to 19:30)
      const isOverlap = (startTime < b.endTime && endTime > b.startTime);
      return isOverlap;
    });

    return !!existing;
  }
}

export const db = new DatabaseStore();
