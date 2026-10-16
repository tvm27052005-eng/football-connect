export type UserRole = 'USER' | 'OWNER' | 'ADMIN';
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO';
export type FieldType = '5_vs_5' | '7_vs_7' | '11_vs_11';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type MatchStatus = 'OPEN' | 'FULL' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'MATCH_JOINED'
  | 'MATCH_FULL'
  | 'MATCH_REMINDER'
  | 'NEW_MESSAGE'
  | 'NEW_REVIEW'
  | 'SYSTEM';

export interface IUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  location?: {
    city: string;
    district: string;
    latitude?: number;
    longitude?: number;
  };
  skillLevel?: SkillLevel;
  preferredFieldType?: FieldType;
  preferredPosition?: string;
  isActive: boolean;
  businessName?: string;
  businessTaxId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IVenue {
  id: string;
  name: string;
  ownerId: string;
  ownerName?: string;
  address: string;
  city: string;
  district: string;
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
  amenities: string[]; // e.g. 'Parking', 'Showers', 'Lights', 'Drinks', 'Wifi', 'Bibs', 'Locker'
  rating: number;
  reviewCount: number;
  priceRange: {
    min: number;
    max: number;
  };
  openTime: string; // "06:00"
  closeTime: string; // "23:00"
  status: 'ACTIVE' | 'MAINTENANCE' | 'CLOSED' | 'PENDING_APPROVAL';
  createdAt: string;
  updatedAt: string;
}

export interface IField {
  id: string;
  venueId: string;
  name: string;
  fieldType: FieldType;
  capacity: number; // e.g. 10, 14, 22
  pricePerHour: number;
  /** Giá bán thực tế cho từng ca; dùng chung cho availability và booking. */
  timeSlots?: IFieldTimeSlot[];
  surfaceType: 'ARTIFICIAL_GRASS' | 'NATURAL_GRASS' | 'INDOOR_FUTSAL';
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}
// Định nghĩa cấu trúc cho từng khung giờ của sân bóng
export interface IFieldTimeSlot {
  startTime: string;
  endTime: string;
  price: number;
  isActive: boolean;
}

export interface IBooking {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  venueId: string;
  venueName?: string;
  venueAddress?: string;
  fieldId: string;
  fieldName?: string;
  fieldType?: FieldType;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // "17:30"
  endTime: string; // "19:00"
  durationHours: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'CASH' | 'VNPAY' | 'MOMO' | 'BANK_TRANSFER';
  note?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMatchParticipant {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userPhone?: string;
  skillLevel?: SkillLevel;
  team: 'A' | 'B' | 'UNASSIGNED';
  status: 'CONFIRMED' | 'PENDING' | 'LEFT';
  joinedAt: string;
}

export type CostSharingType = '50_50' | 'LOOSER_PAYS' | 'HOME_PAYS';

export interface IMatch {
  id: string;
  creatorId: string;
  creatorName?: string;
  creatorAvatar?: string;
  creatorPhone?: string;
  title: string;
  venueId: string;
  venueName?: string;
  venueAddress?: string;
  fieldId?: string;
  fieldName?: string;
  matchDate: string; // YYYY-MM-DD
  startTime: string; // "19:00"
  endTime: string; // "20:30"
  fieldType: FieldType;
  skillLevel: SkillLevel;
  maxPlayers: number;
  currentPlayers: number;
  description: string;
  status: MatchStatus;
  costPerPerson: number;
  totalFieldFee?: number;
  costSharing?: CostSharingType;
  teamAName: string;
  teamBName: string;
  teamACaptain?: string;
  teamBCaptain?: string;
  teamAPhone?: string;
  teamBPhone?: string;
  teamBJoined?: boolean;
  participants?: IMatchParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface IConversation {
  id: string;
  type: 'DIRECT' | 'MATCH' | 'VENUE';
  title?: string;
  matchId?: string;
  venueId?: string;
  participantIds: string[];
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  };
  updatedAt: string;
  createdAt: string;
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'TEXT' | 'SYSTEM' | 'MATCH_INVITE';
  readBy: string[];
  createdAt: string;
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface IReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  venueId: string;
  bookingId?: string;
  rating: number; // 1 to 5
  comment: string;
  images?: string[];
  ownerReply?: {
    content: string;
    createdAt: string;
  };
  createdAt: string;
}

export interface IPayment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  method: 'CASH' | 'VNPAY' | 'MOMO' | 'BANK_TRANSFER';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  transactionCode: string;
  createdAt: string;
}

export interface IReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'USER' | 'VENUE' | 'MATCH' | 'REVIEW';
  targetId: string;
  targetTitle: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  resolutionNote?: string;
  createdAt: string;
}

export interface ITimeSlot {
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  bookingId?: string;
  price: number;
}
