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
  status?: 'ACTIVE' | 'LOCKED' | 'SUSPENDED';
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
  ownerPhone?: string;
  address: string;
  city: string;
  district: string;
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
  amenities: string[];
  rating: number;
  reviewCount: number;
  totalReviews?: number;
  priceRange: {
    min: number;
    max: number;
  };
  openTime: string;
  closeTime: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'CLOSED' | 'PENDING_APPROVAL' | 'APPROVED' | 'PENDING' | 'REJECTED';
  totalFields?: number;
  availableFieldTypes?: FieldType[];
  fields?: IField[];
  reviews?: IReview[];
  createdAt: string;
  updatedAt: string;
}

export interface IField {
  id: string;
  venueId: string;
  name: string;
  fieldType: FieldType;
  capacity?: number;
  pricePerHour: number;
  surfaceType?: string;
  hasLighting?: boolean;
  hasRoof?: boolean;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  venueName?: string;
  venueAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITimeSlot {
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  bookingId?: string;
  price: number;
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
  bookingDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'CASH' | 'VNPAY' | 'MOMO' | 'BANK_TRANSFER';
  note?: string;
  cancellationReason?: string;
  hasReviewed?: boolean;
  review?: IReview;
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
  matchDate: string;
  startTime: string;
  endTime: string;
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
  teamA?: IMatchParticipant[];
  teamB?: IMatchParticipant[];
  unassigned?: IMatchParticipant[];
  venue?: IVenue;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMatchRecommendation {
  match: IMatch;
  score: number;
  percentage: string;
  reasons: string[];
  scoreBreakdown: {
    location: number;
    time: number;
    skill: number;
    fieldType: number;
    other: number;
  };
}

export interface IConversation {
  id: string;
  type: 'DIRECT' | 'MATCH' | 'VENUE';
  title?: string;
  displayTitle?: string;
  displayAvatar?: string;
  matchId?: string;
  venueId?: string;
  participantIds: string[];
  otherUsers?: IUser[];
  unreadCount?: number;
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
  createdAt: string;
}

export interface IReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  venueId: string;
  bookingId?: string;
  rating: number;
  comment: string;
  images?: string[];
  ownerReply?: {
    content: string;
    createdAt: string;
  };
  ownerResponse?: string;
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
