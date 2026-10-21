import mongoose, { Schema, model } from 'mongoose';

/* =========================================================================
   1. NGUOI_DUNG MODEL (User)
   ========================================================================= */
export interface INguoiDung {
  ma_nguoi_dung: string;
  ho_ten: string;
  email: string;
  mat_khau: string;
  so_dien_thoai?: string;
  vai_tro: 'KHACH_HANG' | 'CHU_SAN' | 'ADMIN';
  anh_dai_dien?: string;
  gioi_thieu?: string;
  dia_chi?: {
    thanh_pho: string;
    quan_huyen: string;
    vi_do?: number;
    kinh_do?: number;
  };
  trinh_do?: string;
  loai_san_yeu_thich?: string;
  vi_tri_so_truong?: string;
  trang_thai: boolean;
  ten_doanh_nghiep?: string;
  ma_so_thue?: string;
}

const NguoiDungSchema = new Schema<INguoiDung>({
  ma_nguoi_dung: { type: String, required: true, unique: true, index: true },
  ho_ten: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  mat_khau: { type: String, required: true },
  so_dien_thoai: { type: String, trim: true },
  vai_tro: { type: String, enum: ['KHACH_HANG', 'CHU_SAN', 'ADMIN'], default: 'KHACH_HANG', index: true },
  anh_dai_dien: { type: String },
  gioi_thieu: { type: String },
  dia_chi: {
    thanh_pho: { type: String, default: 'Hà Nội' },
    quan_huyen: { type: String, default: 'Cầu Giấy' },
    vi_do: { type: Number },
    kinh_do: { type: Number }
  },
  trinh_do: { type: String, default: 'Trung bình' },
  loai_san_yeu_thich: { type: String, default: 'Sân 7 người' },
  vi_tri_so_truong: { type: String, default: 'Tiền vệ (CM)' },
  trang_thai: { type: Boolean, default: true, index: true },
  ten_doanh_nghiep: { type: String },
  ma_so_thue: { type: String }
}, {
  collection: 'nguoi_dung',
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

/* =========================================================================
   2. CUM_SAN_BONG MODEL (Venue)
   ========================================================================= */
export interface ICumSanBong {
  ma_cum_san: string;
  ma_chu_san: string;
  ten_chu_san: string;
  ten_cum_san: string;
  dia_chi: string;
  thanh_pho: string;
  quan_huyen: string;
  mo_ta: string;
  danh_sach_anh: string[];
  vi_do: number;
  kinh_do: number;
  tien_ich: string[];
  danh_gia_sao: number;
  so_luong_danh_gia: number;
  gia_tu: number;
  gia_den: number;
  gio_mo_cua: string;
  gio_dong_cua: string;
  trang_thai: 'DANG_HOAT_DONG' | 'CHO_DUYET' | 'BAO_TRI' | 'DONG_CUA';
}

const CumSanBongSchema = new Schema<ICumSanBong>({
  ma_cum_san: { type: String, required: true, unique: true, index: true },
  ma_chu_san: { type: String, required: true, index: true },
  ten_chu_san: { type: String, required: true },
  ten_cum_san: { type: String, required: true, trim: true, index: true },
  dia_chi: { type: String, required: true },
  thanh_pho: { type: String, required: true, index: true },
  quan_huyen: { type: String, required: true, index: true },
  mo_ta: { type: String, default: '' },
  danh_sach_anh: [{ type: String }],
  vi_do: { type: Number, required: true },
  kinh_do: { type: Number, required: true },
  tien_ich: [{ type: String }],
  danh_gia_sao: { type: Number, default: 5.0 },
  so_luong_danh_gia: { type: Number, default: 0 },
  gia_tu: { type: Number, default: 200000 },
  gia_den: { type: Number, default: 800000 },
  gio_mo_cua: { type: String, default: '06:00' },
  gio_dong_cua: { type: String, default: '23:00' },
  trang_thai: { type: String, enum: ['DANG_HOAT_DONG', 'CHO_DUYET', 'BAO_TRI', 'DONG_CUA'], default: 'CHO_DUYET', index: true }
}, {
  collection: 'cum_san_bong',
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

/* =========================================================================
   3. SAN_CHI_TIET MODEL (Field)
   ========================================================================= */
export interface ISanChiTiet {
  ma_san_con: string;
  ma_cum_san: string;
  ten_san: string;
  loai_san: 'SAN_5' | 'SAN_7' | 'SAN_11';
  suc_chua: number;
  gia_thue_gio: number;
  mat_co: string;
  trang_thai: 'DANG_HOAT_DONG' | 'BAO_TRI';
  khung_gio_thue?: Array<{
    startTime: string;
    endTime: string;
    price: number;
    isActive: boolean;
  }>;
}

const SanChiTietSchema = new Schema<ISanChiTiet>({
  ma_san_con: { type: String, required: true, unique: true, index: true },
  ma_cum_san: { type: String, required: true, index: true },
  ten_san: { type: String, required: true },
  loai_san: { type: String, enum: ['SAN_5', 'SAN_7', 'SAN_11'], required: true, index: true },
  suc_chua: { type: Number, default: 14 },
  gia_thue_gio: { type: Number, required: true },
  mat_co: { type: String, default: 'Cỏ nhân tạo' },
  trang_thai: { type: String, enum: ['DANG_HOAT_DONG', 'BAO_TRI'], default: 'DANG_HOAT_DONG' },
  khung_gio_thue: [{
    startTime: { type: String },
    endTime: { type: String },
    price: { type: Number },
    isActive: { type: Boolean, default: true }
  }]
}, {
  collection: 'san_chi_tiet',
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

/* =========================================================================
   4. DON_DAT_SAN MODEL (Booking)
   ========================================================================= */
export interface IDonDatSan {
  ma_don_dat: string;
  ma_khach_hang: string;
  ten_khach_hang: string;
  so_dien_thoai?: string;
  email?: string;
  ma_cum_san: string;
  ten_cum_san: string;
  dia_chi_san?: string;
  ma_san_con: string;
  ten_san_con: string;
  loai_san: string;
  ngay_dat: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  thoi_luong_gio: number;
  tong_tien: number;
  trang_thai_don: 'CHO_DUYET' | 'DA_XAC_NHAN' | 'DA_HUY' | 'HOAN_THANH';
  trang_thai_thanh_toan: 'CHUA_THANH_TOAN' | 'DA_THANH_TOAN' | 'HOAN_TIEN';
  phuong_thuc_thanh_toan: 'TIEN_MAT' | 'VNPAY' | 'MOMO' | 'BANK_TRANSFER';
  ghi_chu?: string;
  ly_do_huy?: string;
}

const DonDatSanSchema = new Schema<IDonDatSan>({
  ma_don_dat: { type: String, required: true, unique: true, index: true },
  ma_khach_hang: { type: String, required: true, index: true },
  ten_khach_hang: { type: String, required: true },
  so_dien_thoai: { type: String },
  email: { type: String },
  ma_cum_san: { type: String, required: true, index: true },
  ten_cum_san: { type: String, required: true },
  dia_chi_san: { type: String },
  ma_san_con: { type: String, required: true, index: true },
  ten_san_con: { type: String, required: true },
  loai_san: { type: String, required: true },
  ngay_dat: { type: String, required: true, index: true },
  gio_bat_dau: { type: String, required: true },
  gio_ket_thuc: { type: String, required: true },
  thoi_luong_gio: { type: Number, default: 1.5 },
  tong_tien: { type: Number, required: true },
  trang_thai_don: { type: String, enum: ['CHO_DUYET', 'DA_XAC_NHAN', 'DA_HUY', 'HOAN_THANH'], default: 'DA_XAC_NHAN', index: true },
  trang_thai_thanh_toan: { type: String, enum: ['CHUA_THANH_TOAN', 'DA_THANH_TOAN', 'HOAN_TIEN'], default: 'CHUA_THANH_TOAN', index: true },
  phuong_thuc_thanh_toan: { type: String, enum: ['TIEN_MAT', 'VNPAY', 'MOMO', 'CASH', 'BANK_TRANSFER'], default: 'TIEN_MAT' },
  ghi_chu: { type: String },
  ly_do_huy: { type: String }
}, {
  collection: 'don_dat_san',
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

/* =========================================================================
   5. KEO_GIAO_HUU MODEL (Match)
   ========================================================================= */
export interface IKeoGiaoHuu {
  ma_keo_dau: string;
  ma_nguoi_tao: string;
  ten_nguoi_tao: string;
  anh_nguoi_tao?: string;
  sdt_nguoi_tao?: string;
  tieu_de_keo: string;
  ma_cum_san: string;
  ten_cum_san: string;
  dia_chi_san?: string;
  ma_san_con?: string;
  ten_san_con?: string;
  ngay_thi_dau: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  loai_san: string;
  trinh_do: string;
  so_nguoi_toi_da: number;
  so_nguoi_hien_tai: number;
  mo_ta?: string;
  trang_thai_keo: 'CHO_DUYET' | 'DANG_TIM_DOI' | 'DA_DU_DOI' | 'HOAN_THANH' | 'DA_HUY';
  tien_san_moi_nguoi: number;
  tong_tien_san?: number;
  hinh_thuc_chia_tien: 'CHIA_DOI_50_50' | 'THUA_TRA' | 'BAO_SAN';
  ten_doi_a?: string;
  ten_doi_b?: string;
  doi_truong_doi_a?: string;
  doi_truong_doi_b?: string;
  sdt_doi_a?: string;
  sdt_doi_b?: string;
  doi_b_da_tham_gia?: boolean;
}

const KeoGiaoHuuSchema = new Schema<IKeoGiaoHuu>({
  ma_keo_dau: { type: String, required: true, unique: true, index: true },
  ma_nguoi_tao: { type: String, required: true, index: true },
  ten_nguoi_tao: { type: String, required: true },
  anh_nguoi_tao: { type: String },
  sdt_nguoi_tao: { type: String },
  tieu_de_keo: { type: String, required: true, trim: true },
  ma_cum_san: { type: String, required: true, index: true },
  ten_cum_san: { type: String, required: true },
  dia_chi_san: { type: String },
  ma_san_con: { type: String },
  ten_san_con: { type: String },
  ngay_thi_dau: { type: String, required: true, index: true },
  gio_bat_dau: { type: String, required: true },
  gio_ket_thuc: { type: String, required: true },
  loai_san: { type: String, required: true },
  trinh_do: { type: String, default: 'Trung bình' },
  so_nguoi_toi_da: { type: Number, default: 14 },
  so_nguoi_hien_tai: { type: Number, default: 1 },
  mo_ta: { type: String },
  trang_thai_keo: { type: String, enum: ['CHO_DUYET', 'DANG_TIM_DOI', 'DA_DU_DOI', 'HOAN_THANH', 'DA_HUY'], default: 'CHO_DUYET', index: true },
  tien_san_moi_nguoi: { type: Number, default: 0 },
  tong_tien_san: { type: Number },
  hinh_thuc_chia_tien: { type: String, enum: ['CHIA_DOI_50_50', 'THUA_TRA', 'BAO_SAN'], default: 'CHIA_DOI_50_50' },
  ten_doi_a: { type: String },
  ten_doi_b: { type: String },
  doi_truong_doi_a: { type: String },
  doi_truong_doi_b: { type: String },
  sdt_doi_a: { type: String },
  sdt_doi_b: { type: String },
  doi_b_da_tham_gia: { type: Boolean, default: false }
}, {
  collection: 'keo_giao_huu',
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

/* =========================================================================
   6. THANH_VIEN_KEO MODEL (Match Participant)
   ========================================================================= */
export interface IThanhVienKeo {
  ma_tham_gia: string;
  ma_keo_dau: string;
  ma_nguoi_dung: string;
  ten_nguoi_dung: string;
  anh_dai_dien?: string;
  so_dien_thoai?: string;
  trinh_do?: string;
  doi_thi_dau: 'DOI_A' | 'DOI_B' | 'CHUA_CHON';
  trang_thai: 'XAC_NHAN' | 'CHO_DUYET' | 'DA_ROI';
  ngay_tham_gia: string;
}

const ThanhVienKeoSchema = new Schema<IThanhVienKeo>({
  ma_tham_gia: { type: String, required: true, unique: true, index: true },
  ma_keo_dau: { type: String, required: true, index: true },
  ma_nguoi_dung: { type: String, required: true, index: true },
  ten_nguoi_dung: { type: String, required: true },
  anh_dai_dien: { type: String },
  so_dien_thoai: { type: String },
  trinh_do: { type: String },
  doi_thi_dau: { type: String, enum: ['DOI_A', 'DOI_B', 'CHUA_CHON'], default: 'CHUA_CHON' },
  trang_thai: { type: String, enum: ['XAC_NHAN', 'CHO_DUYET', 'DA_ROI'], default: 'XAC_NHAN' },
  ngay_tham_gia: { type: String, default: () => new Date().toISOString() }
}, {
  collection: 'thanh_vien_keo',
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

/* =========================================================================
   7. DANH_GIA MODEL (Review)
   ========================================================================= */
export interface IDanhGia {
  ma_danh_gia: string;
  ma_nguoi_dung: string;
  ten_nguoi_dung: string;
  anh_dai_dien?: string;
  ma_cum_san: string;
  ma_don_dat?: string;
  so_sao: number;
  nhan_xet: string;
  danh_sach_anh?: string[];
  phan_hoi_chu_san?: {
    noi_dung: string;
    ngay_tra_loi: string;
  };
}

const DanhGiaSchema = new Schema<IDanhGia>({
  ma_danh_gia: { type: String, required: true, unique: true, index: true },
  ma_nguoi_dung: { type: String, required: true, index: true },
  ten_nguoi_dung: { type: String, required: true },
  anh_dai_dien: { type: String },
  ma_cum_san: { type: String, required: true, index: true },
  ma_don_dat: { type: String },
  so_sao: { type: Number, required: true, min: 1, max: 5 },
  nhan_xet: { type: String, required: true },
  danh_sach_anh: [{ type: String }],
  phan_hoi_chu_san: {
    noi_dung: String,
    ngay_tra_loi: String
  }
}, {
  collection: 'danh_gia',
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

/* =========================================================================
   8. THANH_TOAN MODEL (Payment)
   ========================================================================= */
export interface IThanhToan {
  ma_thanh_toan: string;
  ma_don_dat: string;
  ma_nguoi_dung: string;
  so_tien: number;
  phuong_thuc: 'TIEN_MAT' | 'VNPAY' | 'MOMO';
  trang_thai: 'CHO_XU_LY' | 'THANH_CONG' | 'THAT_BAI';
  ma_giao_dich: string;
}

const ThanhToanSchema = new Schema<IThanhToan>({
  ma_thanh_toan: { type: String, required: true, unique: true, index: true },
  ma_don_dat: { type: String, required: true, index: true },
  ma_nguoi_dung: { type: String, required: true },
  so_tien: { type: Number, required: true },
  phuong_thuc: { type: String, enum: ['TIEN_MAT', 'VNPAY', 'MOMO'], default: 'TIEN_MAT' },
  trang_thai: { type: String, enum: ['CHO_XU_LY', 'THANH_CONG', 'THAT_BAI'], default: 'THANH_CONG' },
  ma_giao_dich: { type: String, required: true }
}, {
  collection: 'thanh_toan',
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

/* =========================================================================
   9. HOI_THOAI & TIN_NHAN MODELS (Chat)
   ========================================================================= */
export interface IHoiThoai {
  ma_hoi_thoai: string;
  loai_hoi_thoai: 'TRUC_TIEP' | 'KEO_DAU' | 'SAN_BONG';
  tieu_de?: string;
  ma_keo_dau?: string;
  ma_cum_san?: string;
  danh_sach_thanh_vien: string[];
  tin_nhan_cuoi?: {
    noi_dung: string;
    ma_nguoi_gui: string;
    ten_nguoi_gui: string;
    thoi_gian: string;
  };
}

const HoiThoaiSchema = new Schema<IHoiThoai>({
  ma_hoi_thoai: { type: String, required: true, unique: true, index: true },
  loai_hoi_thoai: { type: String, enum: ['TRUC_TIEP', 'KEO_DAU', 'SAN_BONG'], default: 'TRUC_TIEP' },
  tieu_de: { type: String },
  ma_keo_dau: { type: String },
  ma_cum_san: { type: String },
  danh_sach_thanh_vien: [{ type: String }],
  tin_nhan_cuoi: {
    noi_dung: String,
    ma_nguoi_gui: String,
    ten_nguoi_gui: String,
    thoi_gian: String
  }
}, {
  collection: 'hoi_thoai',
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

export interface ITinNhan {
  ma_tin_nhan: string;
  ma_hoi_thoai: string;
  ma_nguoi_gui: string;
  ten_nguoi_gui: string;
  anh_nguoi_gui?: string;
  noi_dung: string;
  loai_tin_nhan: 'VAN_BAN' | 'HE_THONG';
  tep_dinh_kem?: {
    url: string;
    ten_tep: string;
    loai_mime: string;
    kich_thuoc: number;
  };
  da_xem?: string[];
}

const TinNhanSchema = new Schema<ITinNhan>({
  ma_tin_nhan: { type: String, required: true, unique: true, index: true },
  ma_hoi_thoai: { type: String, required: true, index: true },
  ma_nguoi_gui: { type: String, required: true },
  ten_nguoi_gui: { type: String, required: true },
  anh_nguoi_gui: { type: String },
  noi_dung: { type: String, required: true },
  loai_tin_nhan: { type: String, enum: ['VAN_BAN', 'HE_THONG'], default: 'VAN_BAN' },
  tep_dinh_kem: {
    url: { type: String },
    ten_tep: { type: String },
    loai_mime: { type: String },
    kich_thuoc: { type: Number }
  },
  da_xem: [{ type: String }]
}, {
  collection: 'tin_nhan',
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

/* =========================================================================
   10. THONG_BAO & BAO_CAO MODELS
   ========================================================================= */
export interface IThongBao {
  ma_thong_bao: string;
  ma_nguoi_dung: string;
  tieu_de: string;
  noi_dung: string;
  loai_thong_bao: string;
  duong_dan?: string;
  da_doc: boolean;
}

const ThongBaoSchema = new Schema<IThongBao>({
  ma_thong_bao: { type: String, required: true, unique: true, index: true },
  ma_nguoi_dung: { type: String, required: true, index: true },
  tieu_de: { type: String, required: true },
  noi_dung: { type: String, required: true },
  loai_thong_bao: { type: String, required: true },
  duong_dan: { type: String },
  da_doc: { type: Boolean, default: false, index: true }
}, {
  collection: 'thong_bao',
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

export interface IBaoCao {
  ma_bao_cao: string;
  ma_nguoi_bao_cao: string;
  ten_nguoi_bao_cao?: string;
  loai_muc_tieu: string;
  ma_muc_tieu: string;
  tieu_de_muc_tieu: string;
  ly_do: string;
  trang_thai: string;
  ghi_chu_xu_ly?: string;
}

const BaoCaoSchema = new Schema<IBaoCao>({
  ma_bao_cao: { type: String, required: true, unique: true, index: true },
  ma_nguoi_bao_cao: { type: String, required: true },
  ten_nguoi_bao_cao: { type: String },
  loai_muc_tieu: { type: String, required: true },
  ma_muc_tieu: { type: String, required: true },
  tieu_de_muc_tieu: { type: String, required: true },
  ly_do: { type: String, required: true },
  trang_thai: { type: String, default: 'CHO_XU_LY' },
  ghi_chu_xu_ly: { type: String }
}, {
  collection: 'bao_cao',
  timestamps: { createdAt: 'ngay_tao', updatedAt: 'ngay_cap_nhat' }
});

// Export Compiled Mongoose Models (Tiếng Việt Không Dấu)
export const NguoiDungModel = mongoose.models.nguoi_dung || model<INguoiDung>('nguoi_dung', NguoiDungSchema);
export const CumSanBongModel = mongoose.models.cum_san_bong || model<ICumSanBong>('cum_san_bong', CumSanBongSchema);
export const SanChiTietModel = mongoose.models.san_chi_tiet || model<ISanChiTiet>('san_chi_tiet', SanChiTietSchema);
export const DonDatSanModel = mongoose.models.don_dat_san || model<IDonDatSan>('don_dat_san', DonDatSanSchema);
export const KeoGiaoHuuModel = mongoose.models.keo_giao_huu || model<IKeoGiaoHuu>('keo_giao_huu', KeoGiaoHuuSchema);
export const ThanhVienKeoModel = mongoose.models.thanh_vien_keo || model<IThanhVienKeo>('thanh_vien_keo', ThanhVienKeoSchema);
export const DanhGiaModel = mongoose.models.danh_gia || model<IDanhGia>('danh_gia', DanhGiaSchema);
export const ThanhToanModel = mongoose.models.thanh_toan || model<IThanhToan>('thanh_toan', ThanhToanSchema);
export const HoiThoaiModel = mongoose.models.hoi_thoai || model<IHoiThoai>('hoi_thoai', HoiThoaiSchema);
export const TinNhanModel = mongoose.models.tin_nhan || model<ITinNhan>('tin_nhan', TinNhanSchema);
export const ThongBaoModel = mongoose.models.thong_bao || model<IThongBao>('thong_bao', ThongBaoSchema);
export const BaoCaoModel = mongoose.models.bao_cao || model<IBaoCao>('bao_cao', BaoCaoSchema);

// Aliases for compatibility
export const UserModel = NguoiDungModel;
export const VenueModel = CumSanBongModel;
export const FieldModel = SanChiTietModel;
export const BookingModel = DonDatSanModel;
export const MatchModel = KeoGiaoHuuModel;
export const MatchParticipantModel = ThanhVienKeoModel;
export const ConversationModel = HoiThoaiModel;
export const MessageModel = TinNhanModel;
export const NotificationModel = ThongBaoModel;
export const ReviewModel = DanhGiaModel;
export const PaymentModel = ThanhToanModel;
export const ReportModel = BaoCaoModel;
