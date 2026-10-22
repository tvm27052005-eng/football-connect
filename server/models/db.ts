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
import {
  NguoiDungModel,
  CumSanBongModel,
  SanChiTietModel,
  DonDatSanModel,
  KeoGiaoHuuModel,
  ThanhVienKeoModel,
  DanhGiaModel,
  ThanhToanModel,
  HoiThoaiModel,
  TinNhanModel,
  ThongBaoModel,
  BaoCaoModel
} from './mongoose.models.js';

const ADMIN_PASSWORD_HASH = '$2b$10$ZERM7hJv2Pqkcj/I5my42uUn0lLqTX3MLd1WWzQFaSDb3OuGAba42';

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
    password: ADMIN_PASSWORD_HASH, // "123456"
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

// Mappers between Memory Types and MongoDB Documents
export const mappers = {
  userToMongo: (u: IUser) => ({
    ma_nguoi_dung: u.id,
    ho_ten: u.name,
    email: u.email,
    mat_khau: u.password,
    so_dien_thoai: u.phone,
    vai_tro: u.role === 'OWNER' ? 'CHU_SAN' : u.role === 'ADMIN' ? 'ADMIN' : 'KHACH_HANG',
    anh_dai_dien: u.avatar,
    gioi_thieu: u.bio,
    dia_chi: u.location ? {
      thanh_pho: u.location.city,
      quan_huyen: u.location.district,
      vi_do: u.location.latitude,
      kinh_do: u.location.longitude
    } : undefined,
    trinh_do: u.skillLevel,
    loai_san_yeu_thich: u.preferredFieldType,
    vi_tri_so_truong: u.preferredPosition,
    trang_thai: u.isActive !== false,
    ten_doanh_nghiep: u.businessName,
    ma_so_thue: u.businessTaxId,
    payos: u.payos
  }),
  mongoToUser: (doc: any): IUser => ({
    id: doc.ma_nguoi_dung,
    name: doc.ho_ten,
    email: doc.email,
    password: doc.mat_khau,
    phone: doc.so_dien_thoai || '',
    role: (doc.vai_tro === 'CHU_SAN' ? 'OWNER' : doc.vai_tro === 'ADMIN' ? 'ADMIN' : 'USER') as any,
    avatar: doc.anh_dai_dien,
    bio: doc.gioi_thieu,
    location: doc.dia_chi ? {
      city: doc.dia_chi.thanh_pho || 'Hà Nội',
      district: doc.dia_chi.quan_huyen || 'Cầu Giấy',
      latitude: doc.dia_chi.vi_do,
      longitude: doc.dia_chi.kinh_do
    } : undefined,
    skillLevel: doc.trinh_do || 'INTERMEDIATE',
    preferredFieldType: doc.loai_san_yeu_thich || '7_vs_7',
    preferredPosition: doc.vi_tri_so_truong || 'Tiền vệ (CM)',
    isActive: doc.trang_thai !== false,
    businessName: doc.ten_doanh_nghiep,
    businessTaxId: doc.ma_so_thue,
    payos: doc.payos ? {
      clientId: doc.payos.clientId,
      apiKeyEncrypted: doc.payos.apiKeyEncrypted,
      checksumKeyEncrypted: doc.payos.checksumKeyEncrypted,
      accountNumber: doc.payos.accountNumber,
      accountName: doc.payos.accountName,
      bankBin: doc.payos.bankBin,
      connectedAt: new Date(doc.payos.connectedAt).toISOString()
    } : undefined,
    createdAt: doc.ngay_tao ? new Date(doc.ngay_tao).toISOString() : new Date().toISOString(),
    updatedAt: doc.ngay_cap_nhat ? new Date(doc.ngay_cap_nhat).toISOString() : new Date().toISOString()
  }),

  venueToMongo: (v: IVenue) => ({
    ma_cum_san: v.id,
    ma_chu_san: v.ownerId,
    ten_chu_san: v.ownerName || '',
    ten_cum_san: v.name,
    dia_chi: v.address,
    thanh_pho: v.city,
    quan_huyen: v.district,
    mo_ta: v.description || '',
    danh_sach_anh: v.images || [],
    vi_do: v.latitude,
    kinh_do: v.longitude,
    tien_ich: v.amenities || [],
    danh_gia_sao: v.rating || 5.0,
    so_luong_danh_gia: v.reviewCount || 0,
    gia_tu: v.priceRange?.min || 200000,
    gia_den: v.priceRange?.max || 800000,
    gio_mo_cua: v.openTime || '06:00',
    gio_dong_cua: v.closeTime || '23:00',
    trang_thai: v.status === 'ACTIVE' ? 'DANG_HOAT_DONG' : v.status === 'PENDING_APPROVAL' ? 'CHO_DUYET' : v.status === 'MAINTENANCE' ? 'BAO_TRI' : 'DONG_CUA'
  }),
  mongoToVenue: (doc: any): IVenue => ({
    id: doc.ma_cum_san,
    name: doc.ten_cum_san,
    ownerId: doc.ma_chu_san,
    ownerName: doc.ten_chu_san,
    address: doc.dia_chi,
    city: doc.thanh_pho,
    district: doc.quan_huyen,
    description: doc.mo_ta || '',
    images: doc.danh_sach_anh || [],
    latitude: doc.vi_do || 21.0,
    longitude: doc.kinh_do || 105.8,
    amenities: doc.tien_ich || [],
    rating: doc.danh_gia_sao || 5.0,
    reviewCount: doc.so_luong_danh_gia || 0,
    priceRange: { min: doc.gia_tu || 200000, max: doc.gia_den || 800000 },
    openTime: doc.gio_mo_cua || '06:00',
    closeTime: doc.gio_dong_cua || '23:00',
    status: (doc.trang_thai === 'DANG_HOAT_DONG' ? 'ACTIVE' : doc.trang_thai === 'CHO_DUYET' ? 'PENDING_APPROVAL' : doc.trang_thai === 'BAO_TRI' ? 'MAINTENANCE' : 'CLOSED') as any,
    createdAt: doc.ngay_tao ? new Date(doc.ngay_tao).toISOString() : new Date().toISOString(),
    updatedAt: doc.ngay_cap_nhat ? new Date(doc.ngay_cap_nhat).toISOString() : new Date().toISOString()
  }),

  fieldToMongo: (f: IField) => ({
    ma_san_con: f.id,
    ma_cum_san: f.venueId,
    ten_san: f.name,
    loai_san: f.fieldType === '5_vs_5' ? 'SAN_5' : f.fieldType === '11_vs_11' ? 'SAN_11' : 'SAN_7',
    suc_chua: f.capacity,
    gia_thue_gio: f.pricePerHour,
    mat_co: f.surfaceType === 'NATURAL_GRASS' ? 'Cỏ tự nhiên' : f.surfaceType === 'INDOOR_FUTSAL' ? 'Futsal trong nhà' : 'Cỏ nhân tạo',
    trang_thai: f.status === 'ACTIVE' ? 'DANG_HOAT_DONG' : 'BAO_TRI',
    khung_gio_thue: f.timeSlots || []
  }),
  mongoToField: (doc: any): IField => ({
    id: doc.ma_san_con,
    venueId: doc.ma_cum_san,
    name: doc.ten_san,
    fieldType: (doc.loai_san === 'SAN_5' ? '5_vs_5' : doc.loai_san === 'SAN_11' ? '11_vs_11' : '7_vs_7') as any,
    capacity: doc.suc_chua || 14,
    pricePerHour: doc.gia_thue_gio || 400000,
    timeSlots: doc.khung_gio_thue && doc.khung_gio_thue.length > 0 ? doc.khung_gio_thue : undefined,
    surfaceType: (doc.mat_co === 'Cỏ tự nhiên' ? 'NATURAL_GRASS' : doc.mat_co === 'Futsal trong nhà' ? 'INDOOR_FUTSAL' : 'ARTIFICIAL_GRASS') as any,
    status: (doc.trang_thai === 'DANG_HOAT_DONG' ? 'ACTIVE' : 'MAINTENANCE') as any,
    createdAt: doc.ngay_tao ? new Date(doc.ngay_tao).toISOString() : new Date().toISOString(),
    updatedAt: doc.ngay_cap_nhat ? new Date(doc.ngay_cap_nhat).toISOString() : new Date().toISOString()
  }),

  bookingToMongo: (b: IBooking) => ({
    payment: b.payment,
    refund: b.refund,
    audit: b.audit,
    ma_don_dat: b.id,
    ma_khach_hang: b.userId,
    ten_khach_hang: b.userName || '',
    so_dien_thoai: b.userPhone,
    email: b.userEmail,
    ma_cum_san: b.venueId,
    ten_cum_san: b.venueName || '',
    dia_chi_san: b.venueAddress,
    ma_san_con: b.fieldId,
    ten_san_con: b.fieldName || '',
    loai_san: b.fieldType || '7_vs_7',
    ngay_dat: b.bookingDate,
    gio_bat_dau: b.startTime,
    gio_ket_thuc: b.endTime,
    thoi_luong_gio: b.durationHours || 1.5,
    tong_tien: b.totalPrice,
    trang_thai_don: b.status === 'CONFIRMED' ? 'DA_XAC_NHAN' : b.status === 'PENDING' ? 'CHO_DUYET' : b.status === 'CANCELLED' ? 'DA_HUY' : 'HOAN_THANH',
    trang_thai_thanh_toan: b.paymentStatus === 'PAID' ? 'DA_THANH_TOAN' : b.paymentStatus === 'REFUNDED' ? 'HOAN_TIEN' : 'CHUA_THANH_TOAN',
    phuong_thuc_thanh_toan: (b.paymentMethod === 'CASH' ? 'TIEN_MAT' : b.paymentMethod) || 'TIEN_MAT',
    ghi_chu: b.note,
    ly_do_huy: b.cancellationReason
  }),
  mongoToBooking: (doc: any): IBooking => ({
    payment: doc.payment,
    refund: doc.refund,
    audit: doc.audit,
    id: doc.ma_don_dat,
    userId: doc.ma_khach_hang,
    userName: doc.ten_khach_hang,
    userPhone: doc.so_dien_thoai,
    userEmail: doc.email,
    venueId: doc.ma_cum_san,
    venueName: doc.ten_cum_san,
    venueAddress: doc.dia_chi_san,
    fieldId: doc.ma_san_con,
    fieldName: doc.ten_san_con,
    fieldType: doc.loai_san,
    bookingDate: doc.ngay_dat,
    startTime: doc.gio_bat_dau,
    endTime: doc.gio_ket_thuc,
    durationHours: doc.thoi_luong_gio || 1.5,
    totalPrice: doc.tong_tien,
    status: (doc.trang_thai_don === 'DA_XAC_NHAN' ? 'CONFIRMED' : doc.trang_thai_don === 'CHO_DUYET' ? 'PENDING' : doc.trang_thai_don === 'DA_HUY' ? 'CANCELLED' : 'COMPLETED') as any,
    paymentStatus: (doc.trang_thai_thanh_toan === 'DA_THANH_TOAN' ? 'PAID' : doc.trang_thai_thanh_toan === 'HOAN_TIEN' ? 'REFUNDED' : 'UNPAID') as any,
    paymentMethod: (doc.phuong_thuc_thanh_toan === 'TIEN_MAT' ? 'CASH' : doc.phuong_thuc_thanh_toan) as any,
    note: doc.ghi_chu,
    cancellationReason: doc.ly_do_huy,
    createdAt: doc.ngay_tao ? new Date(doc.ngay_tao).toISOString() : new Date().toISOString(),
    updatedAt: doc.ngay_cap_nhat ? new Date(doc.ngay_cap_nhat).toISOString() : new Date().toISOString()
  }),

  matchToMongo: (m: IMatch) => ({
    ma_keo_dau: m.id,
    ma_nguoi_tao: m.creatorId,
    ten_nguoi_tao: m.creatorName || '',
    anh_nguoi_tao: m.creatorAvatar,
    sdt_nguoi_tao: m.creatorPhone,
    tieu_de_keo: m.title,
    ma_cum_san: m.venueId,
    ten_cum_san: m.venueName || '',
    dia_chi_san: m.venueAddress,
    ma_san_con: m.fieldId,
    ten_san_con: m.fieldName,
    ngay_thi_dau: m.matchDate,
    gio_bat_dau: m.startTime,
    gio_ket_thuc: m.endTime,
    loai_san: m.fieldType,
    trinh_do: m.skillLevel,
    so_nguoi_toi_da: m.maxPlayers,
    so_nguoi_hien_tai: m.currentPlayers,
    mo_ta: m.description,
    trang_thai_keo: m.status === 'PENDING_APPROVAL' ? 'CHO_DUYET' : m.status === 'OPEN' ? 'DANG_TIM_DOI' : m.status === 'FULL' ? 'DA_DU_DOI' : m.status === 'CANCELLED' ? 'DA_HUY' : 'HOAN_THANH',
    tien_san_moi_nguoi: m.costPerPerson,
    tong_tien_san: m.totalFieldFee,
    hinh_thuc_chia_tien: m.costSharing === '50_50' ? 'CHIA_DOI_50_50' : m.costSharing === 'LOOSER_PAYS' ? 'THUA_TRA' : 'BAO_SAN',
    ten_doi_a: m.teamAName,
    ten_doi_b: m.teamBName,
    doi_truong_doi_a: m.teamACaptain,
    doi_truong_doi_b: m.teamBCaptain,
    sdt_doi_a: m.teamAPhone,
    sdt_doi_b: m.teamBPhone,
    doi_b_da_tham_gia: m.teamBJoined
  }),
  mongoToMatch: (doc: any): IMatch => ({
    id: doc.ma_keo_dau,
    creatorId: doc.ma_nguoi_tao,
    creatorName: doc.ten_nguoi_tao,
    creatorAvatar: doc.anh_nguoi_tao,
    creatorPhone: doc.sdt_nguoi_tao,
    title: doc.tieu_de_keo,
    venueId: doc.ma_cum_san,
    venueName: doc.ten_cum_san,
    venueAddress: doc.dia_chi_san,
    fieldId: doc.ma_san_con,
    fieldName: doc.ten_san_con,
    matchDate: doc.ngay_thi_dau,
    startTime: doc.gio_bat_dau,
    endTime: doc.gio_ket_thuc,
    fieldType: doc.loai_san,
    skillLevel: doc.trinh_do,
    maxPlayers: doc.so_nguoi_toi_da,
    currentPlayers: doc.so_nguoi_hien_tai,
    description: doc.mo_ta || '',
    status: (doc.trang_thai_keo === 'CHO_DUYET' ? 'PENDING_APPROVAL' : doc.trang_thai_keo === 'DANG_TIM_DOI' ? 'OPEN' : doc.trang_thai_keo === 'DA_DU_DOI' ? 'FULL' : doc.trang_thai_keo === 'DA_HUY' ? 'CANCELLED' : 'COMPLETED') as any,
    costPerPerson: doc.tien_san_moi_nguoi,
    totalFieldFee: doc.tong_tien_san,
    costSharing: (doc.hinh_thuc_chia_tien === 'CHIA_DOI_50_50' ? '50_50' : doc.hinh_thuc_chia_tien === 'THUA_TRA' ? 'LOOSER_PAYS' : 'HOME_PAYS') as any,
    teamAName: doc.ten_doi_a,
    teamBName: doc.ten_doi_b,
    teamACaptain: doc.doi_truong_doi_a,
    teamBCaptain: doc.doi_truong_doi_b,
    teamAPhone: doc.sdt_doi_a,
    teamBPhone: doc.sdt_doi_b,
    teamBJoined: doc.doi_b_da_tham_gia,
    createdAt: doc.ngay_tao ? new Date(doc.ngay_tao).toISOString() : new Date().toISOString(),
    updatedAt: doc.ngay_cap_nhat ? new Date(doc.ngay_cap_nhat).toISOString() : new Date().toISOString()
  }),

  participantToMongo: (p: IMatchParticipant) => ({
    ma_tham_gia: p.id,
    ma_keo_dau: p.matchId,
    ma_nguoi_dung: p.userId,
    ten_nguoi_dung: p.userName,
    anh_dai_dien: p.userAvatar,
    so_dien_thoai: p.userPhone,
    trinh_do: p.skillLevel,
    doi_thi_dau: p.team === 'A' ? 'DOI_A' : p.team === 'B' ? 'DOI_B' : 'CHUA_CHON',
    trang_thai: p.status === 'CONFIRMED' ? 'XAC_NHAN' : p.status === 'LEFT' ? 'DA_ROI' : 'CHO_DUYET',
    ngay_tham_gia: p.joinedAt
  }),
  mongoToParticipant: (doc: any): IMatchParticipant => ({
    id: doc.ma_tham_gia,
    matchId: doc.ma_keo_dau,
    userId: doc.ma_nguoi_dung,
    userName: doc.ten_nguoi_dung,
    userAvatar: doc.anh_dai_dien,
    userPhone: doc.so_dien_thoai,
    skillLevel: doc.trinh_do,
    team: (doc.doi_thi_dau === 'DOI_A' ? 'A' : doc.doi_thi_dau === 'DOI_B' ? 'B' : 'UNASSIGNED') as any,
    status: (doc.trang_thai === 'XAC_NHAN' ? 'CONFIRMED' : doc.trang_thai === 'DA_ROI' ? 'LEFT' : 'PENDING') as any,
    joinedAt: doc.ngay_tham_gia || (doc.ngay_tao ? new Date(doc.ngay_tao).toISOString() : new Date().toISOString())
  }),

  reviewToMongo: (r: IReview) => ({
    ma_danh_gia: r.id,
    ma_nguoi_dung: r.userId,
    ten_nguoi_dung: r.userName,
    anh_dai_dien: r.userAvatar,
    ma_cum_san: r.venueId,
    ma_don_dat: r.bookingId,
    so_sao: r.rating,
    nhan_xet: r.comment,
    danh_sach_anh: r.images || [],
    phan_hoi_chu_san: r.ownerReply ? {
      noi_dung: r.ownerReply.content,
      ngay_tra_loi: r.ownerReply.createdAt
    } : undefined
  }),
  mongoToReview: (doc: any): IReview => ({
    id: doc.ma_danh_gia,
    userId: doc.ma_nguoi_dung,
    userName: doc.ten_nguoi_dung,
    userAvatar: doc.anh_dai_dien,
    venueId: doc.ma_cum_san,
    bookingId: doc.ma_don_dat,
    rating: doc.so_sao,
    comment: doc.nhan_xet,
    images: doc.danh_sach_anh || [],
    ownerReply: doc.phan_hoi_chu_san ? {
      content: doc.phan_hoi_chu_san.noi_dung,
      createdAt: doc.phan_hoi_chu_san.ngay_tra_loi
    } : undefined,
    createdAt: doc.ngay_tao ? new Date(doc.ngay_tao).toISOString() : new Date().toISOString()
  }),

  conversationToMongo: (c: IConversation) => ({
    ma_hoi_thoai: c.id,
    loai_hoi_thoai: c.type === 'DIRECT' ? 'TRUC_TIEP' : c.type === 'MATCH' ? 'KEO_DAU' : 'SAN_BONG',
    tieu_de: c.title,
    ma_keo_dau: c.matchId,
    ma_cum_san: c.venueId,
    danh_sach_thanh_vien: c.participantIds,
    tin_nhan_cuoi: c.lastMessage ? {
      noi_dung: c.lastMessage.content,
      ma_nguoi_gui: c.lastMessage.senderId,
      ten_nguoi_gui: c.lastMessage.senderName,
      thoi_gian: c.lastMessage.createdAt
    } : undefined
  }),
  mongoToConversation: (doc: any): IConversation => ({
    id: doc.ma_hoi_thoai,
    type: (doc.loai_hoi_thoai === 'TRUC_TIEP' ? 'DIRECT' : doc.loai_hoi_thoai === 'KEO_DAU' ? 'MATCH' : 'VENUE') as any,
    title: doc.tieu_de,
    matchId: doc.ma_keo_dau,
    venueId: doc.ma_cum_san,
    participantIds: doc.danh_sach_thanh_vien || [],
    lastMessage: doc.tin_nhan_cuoi ? {
      content: doc.tin_nhan_cuoi.noi_dung,
      senderId: doc.tin_nhan_cuoi.ma_nguoi_gui,
      senderName: doc.tin_nhan_cuoi.ten_nguoi_gui,
      createdAt: doc.tin_nhan_cuoi.thoi_gian
    } : undefined,
    createdAt: doc.ngay_tao ? new Date(doc.ngay_tao).toISOString() : new Date().toISOString(),
    updatedAt: doc.ngay_cap_nhat ? new Date(doc.ngay_cap_nhat).toISOString() : new Date().toISOString()
  }),

  messageToMongo: (msg: IMessage) => ({
    ma_tin_nhan: msg.id,
    ma_hoi_thoai: msg.conversationId,
    ma_nguoi_gui: msg.senderId,
    ten_nguoi_gui: msg.senderName,
    anh_nguoi_gui: msg.senderAvatar,
    noi_dung: msg.content,
    loai_tin_nhan: msg.type === 'TEXT' ? 'VAN_BAN' : 'HE_THONG',
    tep_dinh_kem: msg.attachment ? {
      url: msg.attachment.url,
      ten_tep: msg.attachment.filename,
      loai_mime: msg.attachment.mimeType,
      kich_thuoc: msg.attachment.size
    } : undefined,
    da_xem: msg.readBy || []
  }),
  mongoToMessage: (doc: any): IMessage => ({
    id: doc.ma_tin_nhan,
    conversationId: doc.ma_hoi_thoai,
    senderId: doc.ma_nguoi_gui,
    senderName: doc.ten_nguoi_gui,
    senderAvatar: doc.anh_nguoi_gui,
    content: doc.noi_dung,
    type: (doc.loai_tin_nhan === 'VAN_BAN' ? 'TEXT' : 'SYSTEM') as any,
    attachment: doc.tep_dinh_kem ? {
      url: doc.tep_dinh_kem.url,
      filename: doc.tep_dinh_kem.ten_tep,
      mimeType: doc.tep_dinh_kem.loai_mime,
      size: doc.tep_dinh_kem.kich_thuoc
    } : undefined,
    readBy: doc.da_xem || [],
    createdAt: doc.ngay_tao ? new Date(doc.ngay_tao).toISOString() : new Date().toISOString()
  }),

  notifToMongo: (n: INotification) => ({
    ma_thong_bao: n.id,
    ma_nguoi_dung: n.userId,
    tieu_de: n.title,
    noi_dung: n.message,
    loai_thong_bao: n.type,
    duong_dan: n.link,
    da_doc: n.isRead
  }),
  mongoToNotif: (doc: any): INotification => ({
    id: doc.ma_thong_bao,
    userId: doc.ma_nguoi_dung,
    title: doc.tieu_de,
    message: doc.noi_dung,
    type: doc.loai_thong_bao as any,
    link: doc.duong_dan,
    isRead: !!doc.da_doc,
    createdAt: doc.ngay_tao ? new Date(doc.ngay_tao).toISOString() : new Date().toISOString()
  }),

  reportToMongo: (rp: IReport) => ({
    ma_bao_cao: rp.id,
    ma_nguoi_bao_cao: rp.reporterId,
    ten_nguoi_bao_cao: rp.reporterName,
    loai_muc_tieu: rp.targetType,
    ma_muc_tieu: rp.targetId,
    tieu_de_muc_tieu: rp.targetTitle,
    ly_do: rp.reason,
    trang_thai: rp.status === 'PENDING' ? 'CHO_XU_LY' : 'DA_XU_LY',
    ghi_chu_xu_ly: rp.resolutionNote
  }),
  mongoToReport: (doc: any): IReport => ({
    id: doc.ma_bao_cao,
    reporterId: doc.ma_nguoi_bao_cao,
    reporterName: doc.ten_nguoi_bao_cao || '',
    targetType: doc.loai_muc_tieu as any,
    targetId: doc.ma_muc_tieu,
    targetTitle: doc.tieu_de_muc_tieu,
    reason: doc.ly_do,
    status: (doc.trang_thai === 'CHO_XU_LY' ? 'PENDING' : 'RESOLVED') as any,
    resolutionNote: doc.ghi_chu_xu_ly,
    createdAt: doc.ngay_tao ? new Date(doc.ngay_tao).toISOString() : new Date().toISOString()
  }),

  paymentToMongo: (p: IPayment) => ({
    ma_thanh_toan: p.id,
    ma_don_dat: p.bookingId,
    ma_nguoi_dung: p.userId,
    so_tien: p.amount,
    phuong_thuc: p.method === 'CASH' ? 'TIEN_MAT' : p.method,
    trang_thai: p.status === 'SUCCESS' ? 'THANH_CONG' : p.status === 'FAILED' ? 'THAT_BAI' : 'CHO_XU_LY',
    ma_giao_dich: p.transactionCode
  }),
  mongoToPayment: (doc: any): IPayment => ({
    id: doc.ma_thanh_toan,
    bookingId: doc.ma_don_dat,
    userId: doc.ma_nguoi_dung,
    amount: doc.so_tien,
    method: (doc.phuong_thuc === 'TIEN_MAT' ? 'CASH' : doc.phuong_thuc) as any,
    status: (doc.trang_thai === 'THANH_CONG' ? 'SUCCESS' : doc.trang_thai === 'THAT_BAI' ? 'FAILED' : 'PENDING') as any,
    transactionCode: doc.ma_giao_dich,
    createdAt: doc.ngay_tao ? new Date(doc.ngay_tao).toISOString() : new Date().toISOString()
  })
};

// Persistent Database Engine with Real-time MongoDB Synchronization
class DatabaseStore {
  isMongoConnected = false;

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
  payments: IPayment[] = [];

  // Helper for generating standard IDs
  generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  private ensureMongoConnected(operation: string): void {
    if (!this.isMongoConnected) {
      throw new Error(`MongoDB chưa kết nối, không thể ${operation}. Hãy kiểm tra MongoDB và MONGODB_URI.`);
    }
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

  // Initialize and load all records from MongoDB into memory
  async initFromMongoDB(): Promise<void> {
    try {
      const [
        usersDocs, venuesDocs, fieldsDocs, bookingsDocs,
        matchesDocs, participantsDocs, reviewsDocs,
        conversationsDocs, messagesDocs, notificationsDocs, reportsDocs, paymentsDocs
      ] = await Promise.all([
        NguoiDungModel.find().lean(),
        CumSanBongModel.find().lean(),
        SanChiTietModel.find().lean(),
        DonDatSanModel.find().lean(),
        KeoGiaoHuuModel.find().lean(),
        ThanhVienKeoModel.find().lean(),
        DanhGiaModel.find().lean(),
        HoiThoaiModel.find().lean(),
        TinNhanModel.find().lean(),
        ThongBaoModel.find().lean(),
        BaoCaoModel.find().lean(),
        ThanhToanModel.find().lean()
      ]);

      const hasMongoData = [
        usersDocs,
        venuesDocs,
        fieldsDocs,
        bookingsDocs,
        matchesDocs,
        participantsDocs,
        reviewsDocs,
        conversationsDocs,
        messagesDocs,
        notificationsDocs,
        reportsDocs,
        paymentsDocs
      ].some(docs => docs.length > 0);

      if (hasMongoData) {
        this.users = usersDocs.map(mappers.mongoToUser);
        this.venues = venuesDocs.map(mappers.mongoToVenue);
        this.fields = fieldsDocs.map(mappers.mongoToField);
        this.bookings = bookingsDocs.map(mappers.mongoToBooking);
        this.matches = matchesDocs.map(mappers.mongoToMatch);
        this.matchParticipants = participantsDocs.map(mappers.mongoToParticipant);
        this.reviews = reviewsDocs.map(mappers.mongoToReview);
        this.conversations = conversationsDocs.map(mappers.mongoToConversation);
        this.messages = messagesDocs.map(mappers.mongoToMessage);
        this.notifications = notificationsDocs.map(mappers.mongoToNotif);
        this.reports = reportsDocs.map(mappers.mongoToReport);
        this.payments = paymentsDocs.map(mappers.mongoToPayment);

        const admin = this.users.find(user => user.email.toLowerCase() === 'admin@footballconnect.vn');
        if (admin && admin.password !== ADMIN_PASSWORD_HASH) {
          admin.password = ADMIN_PASSWORD_HASH;
          await NguoiDungModel.updateOne(
            { ma_nguoi_dung: admin.id },
            { $set: { mat_khau: ADMIN_PASSWORD_HASH } }
          );
          console.log('🔐 Đã cập nhật mật khẩu admin mặc định thành 123456.');
        }

        console.log(`📦 Đồng bộ thành công từ MongoDB: ${this.users.length} người dùng, ${this.venues.length} cụm sân, ${this.fields.length} sân con, ${this.bookings.length} đơn đặt sân, ${this.matches.length} kèo đấu.`);
      } else {
        console.log('🌱 MongoDB chưa có dữ liệu, tiến hành nạp dữ liệu khởi tạo mẫu...');
        await Promise.all([
          (NguoiDungModel as any).insertMany(this.users.map(mappers.userToMongo)),
          (CumSanBongModel as any).insertMany(this.venues.map(mappers.venueToMongo)),
          (SanChiTietModel as any).insertMany(this.fields.map(mappers.fieldToMongo)),
          (DonDatSanModel as any).insertMany(this.bookings.map(mappers.bookingToMongo)),
          (KeoGiaoHuuModel as any).insertMany(this.matches.map(mappers.matchToMongo)),
          (ThanhVienKeoModel as any).insertMany(this.matchParticipants.map(mappers.participantToMongo)),
          (DanhGiaModel as any).insertMany(this.reviews.map(mappers.reviewToMongo)),
          (HoiThoaiModel as any).insertMany(this.conversations.map(mappers.conversationToMongo)),
          (TinNhanModel as any).insertMany(this.messages.map(mappers.messageToMongo)),
          (ThongBaoModel as any).insertMany(this.notifications.map(mappers.notifToMongo)),
          (BaoCaoModel as any).insertMany(this.reports.map(mappers.reportToMongo))
        ]);
        console.log('✅ Đã nạp dữ liệu mẫu vào MongoDB thành công!');
      }
      this.isMongoConnected = true;
    } catch (err: any) {
      this.isMongoConnected = false;
      console.error('⚠️ Lỗi khi đồng bộ từ MongoDB:', err.message || err);
      throw err;
    }
  }

  // Real-time synchronization methods with MongoDB:
  async syncUser(user: IUser): Promise<void> {
    if (!this.isMongoConnected) {
      throw new Error('MongoDB chưa kết nối, không thể lưu người dùng');
    }

    try {
      await (NguoiDungModel as any).findOneAndUpdate(
        { ma_nguoi_dung: user.id },
        mappers.userToMongo(user),
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      const idx = this.users.findIndex(u => u.id === user.id);
      if (idx >= 0) { this.users[idx] = user; } else { this.users.push(user); }
    } catch (err) {
      console.error('MongoDB syncUser error:', err);
      throw err;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    this.ensureMongoConnected('xóa người dùng');
    try {
      await (NguoiDungModel as any).deleteOne({ ma_nguoi_dung: userId });
      this.users = this.users.filter(u => u.id !== userId);
    } catch (err) {
      console.error('MongoDB deleteUser error:', err);
      throw err;
    }
  }

  async syncVenue(venue: IVenue): Promise<void> {
    this.ensureMongoConnected('lưu cụm sân');

    try {
      await (CumSanBongModel as any).findOneAndUpdate(
        { ma_cum_san: venue.id },
        mappers.venueToMongo(venue),
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      const idx = this.venues.findIndex(v => v.id === venue.id);
      if (idx >= 0) { this.venues[idx] = venue; } else { this.venues.push(venue); }
    } catch (err) {
      console.error('MongoDB syncVenue error:', err);
      throw err;
    }
  }

  async deleteVenue(venueId: string): Promise<void> {
    this.ensureMongoConnected('xóa cụm sân');
    try {
      await Promise.all([
        (CumSanBongModel as any).deleteOne({ ma_cum_san: venueId }),
        (SanChiTietModel as any).deleteMany({ ma_cum_san: venueId })
      ]);
      this.venues = this.venues.filter(v => v.id !== venueId);
      this.fields = this.fields.filter(f => f.venueId !== venueId);
    } catch (err) {
      console.error('MongoDB deleteVenue error:', err);
      throw err;
    }
  }

  async syncField(field: IField): Promise<void> {
    this.ensureMongoConnected('lưu sân con');

    try {
      await (SanChiTietModel as any).findOneAndUpdate(
        { ma_san_con: field.id },
        mappers.fieldToMongo(field),
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      const idx = this.fields.findIndex(f => f.id === field.id);
      if (idx >= 0) { this.fields[idx] = field; } else { this.fields.push(field); }
    } catch (err) {
      console.error('MongoDB syncField error:', err);
      throw err;
    }
  }

  async deleteField(fieldId: string): Promise<void> {
    this.ensureMongoConnected('xóa sân con');
    try {
      await (SanChiTietModel as any).deleteOne({ ma_san_con: fieldId });
      this.fields = this.fields.filter(f => f.id !== fieldId);
    } catch (err) {
      console.error('MongoDB deleteField error:', err);
      throw err;
    }
  }

  async syncBooking(booking: IBooking): Promise<void> {
    this.ensureMongoConnected('lưu đơn đặt sân');
    try {
      await (DonDatSanModel as any).findOneAndUpdate(
        { ma_don_dat: booking.id },
        mappers.bookingToMongo(booking),
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      const idx = this.bookings.findIndex(b => b.id === booking.id);
      if (idx >= 0) { this.bookings[idx] = booking; } else { this.bookings.push(booking); }
    } catch (err) {
      console.error('MongoDB syncBooking error:', err);
      throw err;
    }
  }

  async deleteBooking(bookingId: string): Promise<void> {
    this.ensureMongoConnected('xóa đơn đặt sân');
    try {
      await (DonDatSanModel as any).deleteOne({ ma_don_dat: bookingId });
      this.bookings = this.bookings.filter(b => b.id !== bookingId);
    } catch (err) {
      console.error('MongoDB deleteBooking error:', err);
      throw err;
    }
  }

  async syncMatch(match: IMatch): Promise<void> {
    this.ensureMongoConnected('lưu kèo đấu');
    try {
      await (KeoGiaoHuuModel as any).findOneAndUpdate(
        { ma_keo_dau: match.id },
        mappers.matchToMongo(match),
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      const idx = this.matches.findIndex(m => m.id === match.id);
      if (idx >= 0) { this.matches[idx] = match; } else { this.matches.push(match); }
    } catch (err) {
      console.error('MongoDB syncMatch error:', err);
      throw err;
    }
  }

  async deleteMatch(matchId: string): Promise<void> {
    this.ensureMongoConnected('xóa kèo đấu');
    try {
      await Promise.all([
        (KeoGiaoHuuModel as any).deleteOne({ ma_keo_dau: matchId }),
        (ThanhVienKeoModel as any).deleteMany({ ma_keo_dau: matchId })
      ]);
      this.matches = this.matches.filter(m => m.id !== matchId);
      this.matchParticipants = this.matchParticipants.filter(p => p.matchId !== matchId);
    } catch (err) {
      console.error('MongoDB deleteMatch error:', err);
      throw err;
    }
  }

  async syncMatchParticipant(participant: IMatchParticipant): Promise<void> {
    this.ensureMongoConnected('lưu thành viên kèo đấu');
    try {
      await (ThanhVienKeoModel as any).findOneAndUpdate(
        { ma_tham_gia: participant.id },
        mappers.participantToMongo(participant),
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      const idx = this.matchParticipants.findIndex(p => p.id === participant.id);
      if (idx >= 0) { this.matchParticipants[idx] = participant; } else { this.matchParticipants.push(participant); }
    } catch (err) {
      console.error('MongoDB syncMatchParticipant error:', err);
      throw err;
    }
  }

  async deleteMatchParticipant(participantId: string): Promise<void> {
    this.ensureMongoConnected('xóa thành viên kèo đấu');
    try {
      await (ThanhVienKeoModel as any).deleteOne({ ma_tham_gia: participantId });
      this.matchParticipants = this.matchParticipants.filter(p => p.id !== participantId);
    } catch (err) {
      console.error('MongoDB deleteMatchParticipant error:', err);
      throw err;
    }
  }

  async syncReview(review: IReview): Promise<void> {
    this.ensureMongoConnected('lưu đánh giá');
    try {
      await (DanhGiaModel as any).findOneAndUpdate(
        { ma_danh_gia: review.id },
        mappers.reviewToMongo(review),
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      const idx = this.reviews.findIndex(r => r.id === review.id);
      if (idx >= 0) { this.reviews[idx] = review; } else { this.reviews.push(review); }
    } catch (err) {
      console.error('MongoDB syncReview error:', err);
      throw err;
    }
  }

  async deleteReview(reviewId: string): Promise<void> {
    this.ensureMongoConnected('xóa đánh giá');
    try {
      await (DanhGiaModel as any).deleteOne({ ma_danh_gia: reviewId });
      this.reviews = this.reviews.filter(r => r.id !== reviewId);
    } catch (err) {
      console.error('MongoDB deleteReview error:', err);
      throw err;
    }
  }

  async syncConversation(conv: IConversation): Promise<void> {
    this.ensureMongoConnected('lưu hội thoại');
    try {
      await (HoiThoaiModel as any).findOneAndUpdate(
        { ma_hoi_thoai: conv.id },
        mappers.conversationToMongo(conv),
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      const idx = this.conversations.findIndex(c => c.id === conv.id);
      if (idx >= 0) { this.conversations[idx] = conv; } else { this.conversations.push(conv); }
    } catch (err) {
      console.error('MongoDB syncConversation error:', err);
      throw err;
    }
  }

  async syncMessage(msg: IMessage): Promise<void> {
    this.ensureMongoConnected('lưu tin nhắn');
    try {
      await (TinNhanModel as any).findOneAndUpdate(
        { ma_tin_nhan: msg.id },
        mappers.messageToMongo(msg),
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      const idx = this.messages.findIndex(m => m.id === msg.id);
      if (idx >= 0) { this.messages[idx] = msg; } else { this.messages.push(msg); }
    } catch (err) {
      console.error('MongoDB syncMessage error:', err);
      throw err;
    }
  }

  async syncNotification(notif: INotification): Promise<void> {
    this.ensureMongoConnected('lưu thông báo');

    try {
      await (ThongBaoModel as any).findOneAndUpdate(
        { ma_thong_bao: notif.id },
        mappers.notifToMongo(notif),
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      const idx = this.notifications.findIndex(n => n.id === notif.id);
      if (idx >= 0) { this.notifications[idx] = notif; } else { this.notifications.push(notif); }
    } catch (err) {
      console.error('MongoDB syncNotification error:', err);
      throw err;
    }
  }

  async syncReport(report: IReport): Promise<void> {
    this.ensureMongoConnected('lưu báo cáo');
    try {
      await (BaoCaoModel as any).findOneAndUpdate(
        { ma_bao_cao: report.id },
        mappers.reportToMongo(report),
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      const idx = this.reports.findIndex(r => r.id === report.id);
      if (idx >= 0) { this.reports[idx] = report; } else { this.reports.push(report); }
    } catch (err) {
      console.error('MongoDB syncReport error:', err);
      throw err;
    }
  }

  async syncPayment(payment: IPayment): Promise<void> {
    this.ensureMongoConnected('lưu thanh toán');
    try {
      await (ThanhToanModel as any).findOneAndUpdate(
        { ma_thanh_toan: payment.id },
        mappers.paymentToMongo(payment),
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      const idx = this.payments.findIndex(p => p.id === payment.id);
      if (idx >= 0) { this.payments[idx] = payment; } else { this.payments.push(payment); }
    } catch (err) {
      console.error('MongoDB syncPayment error:', err);
      throw err;
    }
  }
}

export const db = new DatabaseStore();
