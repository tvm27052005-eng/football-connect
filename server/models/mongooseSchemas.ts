/**
 * FOOTBALL CONNECT - MONGOOSE SCHEMAS & MODELS SPECIFICATION
 * Complete Type-safe Mongoose Definitions conforming to Prompt 02
 */

export const MongooseSchemasCode = `
import { Schema, model, Document, Types } from 'mongoose';

/* =========================================================================
   1. USER SCHEMA
   ========================================================================= */
export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'USER' | 'OWNER' | 'ADMIN';
  avatar?: string;
  bio?: string;
  location?: {
    city: string;
    district: string;
    latitude?: number;
    longitude?: number;
  };
  skillLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO';
  preferredFieldType?: '5_vs_5' | '7_vs_7' | '11_vs_11';
  preferredPosition?: string;
  isActive: boolean;
  businessName?: string;
  businessTaxId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<IUserDocument>({
  name: { type: String, required: [true, 'Tên người dùng là bắt buộc'], trim: true, minlength: 2, maxlength: 60 },
  email: { type: String, required: [true, 'Email là bắt buộc'], unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: [true, 'Mật khẩu là bắt buộc'], minlength: 6, select: false },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['USER', 'OWNER', 'ADMIN'], default: 'USER', index: true },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  bio: { type: String, maxlength: 300 },
  location: {
    city: { type: String, default: 'Hà Nội' },
    district: { type: String, default: 'Cầu Giấy' },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  skillLevel: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO'], default: 'INTERMEDIATE' },
  preferredFieldType: { type: String, enum: ['5_vs_5', '7_vs_7', '11_vs_11'], default: '7_vs_7' },
  preferredPosition: { type: String, default: 'Tiền vệ (CM)' },
  isActive: { type: Boolean, default: true, index: true },
  businessName: { type: String },
  businessTaxId: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ 'location.city': 1, 'location.district': 1 });

/* =========================================================================
   2. VENUE SCHEMA
   ========================================================================= */
export interface IVenueDocument extends Document {
  name: string;
  ownerId: Types.ObjectId;
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
  priceRange: { min: number; max: number };
  openTime: string;
  closeTime: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'CLOSED' | 'PENDING_APPROVAL';
  createdAt: Date;
  updatedAt: Date;
}

export const VenueSchema = new Schema<IVenueDocument>({
  name: { type: String, required: true, trim: true, index: 'text' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  address: { type: String, required: true },
  city: { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  description: { type: String, default: '' },
  images: [{ type: String }],
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  amenities: [{ type: String }],
  rating: { type: Number, default: 5.0, min: 1, max: 5, index: -1 },
  reviewCount: { type: Number, default: 0 },
  priceRange: {
    min: { type: Number, default: 200000 },
    max: { type: Number, default: 800000 }
  },
  openTime: { type: String, default: '06:00' },
  closeTime: { type: String, default: '23:00' },
  status: { type: String, enum: ['ACTIVE', 'MAINTENANCE', 'CLOSED', 'PENDING_APPROVAL'], default: 'ACTIVE', index: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

VenueSchema.index({ city: 1, district: 1, rating: -1, status: 1 });
VenueSchema.index({ name: 'text', description: 'text', address: 'text' });

/* =========================================================================
   3. FIELD SCHEMA
   ========================================================================= */
export interface IFieldDocument extends Document {
  venueId: Types.ObjectId;
  name: string;
  fieldType: '5_vs_5' | '7_vs_7' | '11_vs_11';
  capacity: number;
  pricePerHour: number;
  surfaceType: 'ARTIFICIAL_GRASS' | 'NATURAL_GRASS' | 'INDOOR_FUTSAL';
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

export const FieldSchema = new Schema<IFieldDocument>({
  venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
  name: { type: String, required: true },
  fieldType: { type: String, enum: ['5_vs_5', '7_vs_7', '11_vs_11'], required: true, index: true },
  capacity: { type: Number, default: 14 },
  pricePerHour: { type: Number, required: true, min: 0 },
  surfaceType: { type: String, enum: ['ARTIFICIAL_GRASS', 'NATURAL_GRASS', 'INDOOR_FUTSAL'], default: 'ARTIFICIAL_GRASS' },
  status: { type: String, enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'], default: 'ACTIVE' }
}, {
  timestamps: true
});

FieldSchema.index({ venueId: 1, fieldType: 1, status: 1 });

/* =========================================================================
   4. BOOKING SCHEMA
   ========================================================================= */
export interface IBookingDocument extends Document {
  userId: Types.ObjectId;
  venueId: Types.ObjectId;
  fieldId: Types.ObjectId;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  paymentMethod?: 'CASH' | 'VNPAY' | 'MOMO' | 'BANK_TRANSFER';
  note?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const BookingSchema = new Schema<IBookingDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
  fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true, index: true },
  bookingDate: { type: String, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  durationHours: { type: Number, default: 1.5 },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], default: 'CONFIRMED', index: true },
  paymentStatus: { type: String, enum: ['UNPAID', 'PAID', 'REFUNDED'], default: 'UNPAID', index: true },
  paymentMethod: { type: String, enum: ['CASH', 'VNPAY', 'MOMO', 'BANK_TRANSFER'], default: 'CASH' },
  note: { type: String },
  cancellationReason: { type: String }
}, {
  timestamps: true
});

// CRITICAL UNIQUE COMPOUND INDEX FOR DOUBLE-BOOKING PREVENTION
BookingSchema.index(
  { fieldId: 1, bookingDate: 1, startTime: 1, endTime: 1, status: 1 },
  { partialFilterExpression: { status: { $in: ['CONFIRMED', 'PENDING'] } } }
);

/* =========================================================================
   5. MATCH SCHEMA
   ========================================================================= */
export interface IMatchDocument extends Document {
  creatorId: Types.ObjectId;
  title: string;
  venueId: Types.ObjectId;
  fieldId?: Types.ObjectId;
  matchDate: string;
  startTime: string;
  endTime: string;
  fieldType: '5_vs_5' | '7_vs_7' | '11_vs_11';
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO';
  maxPlayers: number;
  currentPlayers: number;
  description: string;
  status: 'OPEN' | 'FULL' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  costPerPerson: number;
  teamAName?: string;
  teamBName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const MatchSchema = new Schema<IMatchDocument>({
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
  fieldId: { type: Schema.Types.ObjectId, ref: 'Field' },
  matchDate: { type: String, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  fieldType: { type: String, enum: ['5_vs_5', '7_vs_7', '11_vs_11'], required: true },
  skillLevel: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO'], default: 'INTERMEDIATE' },
  maxPlayers: { type: Number, default: 14 },
  currentPlayers: { type: Number, default: 1 },
  description: { type: String },
  status: { type: String, enum: ['OPEN', 'FULL', 'STARTED', 'COMPLETED', 'CANCELLED'], default: 'OPEN', index: true },
  costPerPerson: { type: Number, default: 50000 },
  teamAName: { type: String, default: 'Đội Nhà (Team A)' },
  teamBName: { type: String, default: 'Đội Khách (Team B)' }
}, {
  timestamps: true
});

MatchSchema.index({ matchDate: 1, status: 1, fieldType: 1, skillLevel: 1 });

/* =========================================================================
   6. MATCH PARTICIPANT SCHEMA
   ========================================================================= */
export const MatchParticipantSchema = new Schema({
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  team: { type: String, enum: ['A', 'B', 'UNASSIGNED'], default: 'UNASSIGNED' },
  status: { type: String, enum: ['CONFIRMED', 'PENDING', 'LEFT'], default: 'CONFIRMED' },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

MatchParticipantSchema.index({ matchId: 1, userId: 1 }, { unique: true });

/* =========================================================================
   7. CONVERSATION & MESSAGE SCHEMAS
   ========================================================================= */
export const ConversationSchema = new Schema({
  type: { type: String, enum: ['DIRECT', 'MATCH', 'VENUE'], default: 'DIRECT' },
  title: { type: String },
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', index: true },
  venueId: { type: Schema.Types.ObjectId, ref: 'Venue', index: true },
  participantIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
  lastMessage: {
    content: String,
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    senderName: String,
    createdAt: Date
  }
}, { timestamps: true });

export const MessageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderAvatar: { type: String },
  content: { type: String, required: true },
  type: { type: String, enum: ['TEXT', 'SYSTEM', 'MATCH_INVITE'], default: 'TEXT' },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

MessageSchema.index({ conversationId: 1, createdAt: 1 });

/* =========================================================================
   8. NOTIFICATION SCHEMA
   ========================================================================= */
export const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'MATCH_JOINED', 'MATCH_FULL', 'MATCH_REMINDER', 'NEW_MESSAGE', 'NEW_REVIEW', 'SYSTEM'],
    required: true
  },
  link: { type: String },
  isRead: { type: Boolean, default: false, index: true },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

/* =========================================================================
   9. REVIEW SCHEMA
   ========================================================================= */
export const ReviewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 1000 },
  images: [{ type: String }],
  ownerReply: {
    content: String,
    createdAt: Date
  }
}, { timestamps: true });

ReviewSchema.index({ venueId: 1, createdAt: -1 });
ReviewSchema.index({ bookingId: 1, userId: 1 }, { unique: true, sparse: true });

/* =========================================================================
   10. PAYMENT & REPORT SCHEMAS
   ========================================================================= */
export const PaymentSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['CASH', 'VNPAY', 'MOMO', 'BANK_TRANSFER'], default: 'CASH' },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'SUCCESS' },
  transactionCode: { type: String, required: true, unique: true }
}, { timestamps: true });

export const ReportSchema = new Schema({
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['USER', 'VENUE', 'MATCH', 'REVIEW'], required: true },
  targetId: { type: String, required: true },
  targetTitle: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'RESOLVED', 'DISMISSED'], default: 'PENDING' },
  resolutionNote: { type: String }
}, { timestamps: true });
`;
