import mongoose from 'mongoose';
import { connectDB } from '../config/db.config.js';
import {
  initialUsers,
  initialVenues,
  initialFields,
  initialBookings,
  initialMatches,
  initialMatchParticipants,
  initialConversations,
  initialMessages,
  initialNotifications,
  initialReviews,
  initialReports
} from '../models/db.js';

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
} from '../models/mongoose.models.js';
import { toBookingDoc } from '../services/bookingStore.js';

async function runSeed() {
  console.log('🚀 Dang khoi tao va luu database co dinh vao MongoDB...');
  await connectDB();

  // Clear and re-populate all collections to ensure full data persistence
  await NguoiDungModel.deleteMany({});
  await CumSanBongModel.deleteMany({});
  await SanChiTietModel.deleteMany({});
  await DonDatSanModel.deleteMany({});
  await KeoGiaoHuuModel.deleteMany({});
  await ThanhVienKeoModel.deleteMany({});
  await DanhGiaModel.deleteMany({});
  await ThanhToanModel.deleteMany({});
  await HoiThoaiModel.deleteMany({});
  await TinNhanModel.deleteMany({});
  await ThongBaoModel.deleteMany({});
  await BaoCaoModel.deleteMany({});

  // 1. Nguoi Dung
  await NguoiDungModel.insertMany(initialUsers.map(u => ({
    ma_nguoi_dung: u.id,
    ho_ten: u.name,
    email: u.email,
    mat_khau: u.password,
    so_dien_thoai: u.phone,
    vai_tro: u.role === 'OWNER' ? 'CHU_SAN' : u.role === 'ADMIN' ? 'ADMIN' : 'KHACH_HANG',
    anh_dai_dien: u.avatar,
    gioi_thieu: u.bio,
    dia_chi: {
      thanh_pho: u.location.city,
      quan_huyen: u.location.district,
      vi_do: u.location.latitude,
      kinh_do: u.location.longitude
    },
    trinh_do: u.skillLevel,
    loai_san_yeu_thich: u.preferredFieldType,
    vi_tri_so_truong: u.preferredPosition,
    trang_thai: u.isActive,
    ten_doanh_nghiep: u.businessName,
    ma_so_thue: u.businessTaxId
  })));

  // 2. Cum San Bong
  await CumSanBongModel.insertMany(initialVenues.map(v => ({
    ma_cum_san: v.id,
    ma_chu_san: v.ownerId,
    ten_chu_san: v.ownerName,
    ten_cum_san: v.name,
    dia_chi: v.address,
    thanh_pho: v.city,
    quan_huyen: v.district,
    mo_ta: v.description,
    danh_sach_anh: v.images,
    vi_do: v.latitude,
    kinh_do: v.longitude,
    tien_ich: v.amenities,
    danh_gia_sao: v.rating,
    so_luong_danh_gia: v.reviewCount,
    gia_tu: v.priceRange.min,
    gia_den: v.priceRange.max,
    gio_mo_cua: v.openTime,
    gio_dong_cua: v.closeTime,
    trang_thai: v.status === 'ACTIVE' ? 'DANG_HOAT_DONG' : 'BAO_TRI'
  })));

  // 3. San Chi Tiet
  await SanChiTietModel.insertMany(initialFields.map(f => ({
    ma_san_con: f.id,
    ma_cum_san: f.venueId,
    ten_san: f.name,
    loai_san: f.fieldType === '5_vs_5' ? 'SAN_5' : f.fieldType === '7_vs_7' ? 'SAN_7' : 'SAN_11',
    suc_chua: f.capacity,
    gia_thue_gio: f.pricePerHour,
    mat_co: f.surfaceType === 'ARTIFICIAL_GRASS' ? 'Cỏ nhân tạo' : f.surfaceType === 'NATURAL_GRASS' ? 'Cỏ tự nhiên' : 'Futsal trong nhà',
    trang_thai: f.status === 'ACTIVE' ? 'DANG_HOAT_DONG' : 'BAO_TRI'
  })));

  // 4. Don Dat San
  await DonDatSanModel.insertMany(initialBookings.map(toBookingDoc));

  // 5. Keo Giao Huu
  await KeoGiaoHuuModel.insertMany(initialMatches.map(m => ({
    ma_keo_dau: m.id,
    ma_nguoi_tao: m.creatorId,
    ten_nguoi_tao: m.creatorName,
    anh_nguoi_tao: m.creatorAvatar,
    sdt_nguoi_tao: m.creatorPhone,
    tieu_de_keo: m.title,
    ma_cum_san: m.venueId,
    ten_cum_san: m.venueName,
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
    trang_thai_keo: m.status === 'OPEN' ? 'DANG_TIM_DOI' : m.status === 'FULL' ? 'DA_DU_DOI' : 'HOAN_THANH',
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
  })));

  // 6. Thanh Vien Keo
  await ThanhVienKeoModel.insertMany(initialMatchParticipants.map(p => ({
    ma_tham_gia: p.id,
    ma_keo_dau: p.matchId,
    ma_nguoi_dung: p.userId,
    ten_nguoi_dung: p.userName,
    anh_dai_dien: p.userAvatar,
    so_dien_thoai: p.userPhone,
    trinh_do: p.skillLevel,
    doi_thi_dau: p.team === 'A' ? 'DOI_A' : p.team === 'B' ? 'DOI_B' : 'CHUA_CHON',
    trang_thai: p.status === 'CONFIRMED' ? 'XAC_NHAN' : 'CHO_DUYET',
    ngay_tham_gia: p.joinedAt
  })));

  // 7. Danh Gia
  await DanhGiaModel.insertMany(initialReviews.map(r => ({
    ma_danh_gia: r.id,
    ma_nguoi_dung: r.userId,
    ten_nguoi_dung: r.userName,
    anh_dai_dien: r.userAvatar,
    ma_cum_san: r.venueId,
    ma_don_dat: r.bookingId,
    so_sao: r.rating,
    nhan_xet: r.comment,
    danh_sach_anh: r.images,
    phan_hoi_chu_san: r.ownerReply ? {
      noi_dung: r.ownerReply.content,
      ngay_tra_loi: r.ownerReply.createdAt
    } : undefined
  })));

  // 8. Thanh Toan
  await ThanhToanModel.insertMany([
    {
      ma_thanh_toan: 'pay_1',
      ma_don_dat: 'book_1',
      ma_nguoi_dung: 'user_1',
      so_tien: 600000,
      phuong_thuc: 'VNPAY',
      trang_thai: 'THANH_CONG',
      ma_giao_dich: 'VNP_202502011000'
    },
    {
      ma_thanh_toan: 'pay_2',
      ma_don_dat: 'book_2',
      ma_nguoi_dung: 'user_2',
      so_tien: 675000,
      phuong_thuc: 'MOMO',
      trang_thai: 'THANH_CONG',
      ma_giao_dich: 'MM_202502021100'
    }
  ]);

  // 9. Hoi Thoai & Tin Nhan
  await HoiThoaiModel.insertMany(initialConversations.map(c => ({
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
  })));

  await TinNhanModel.insertMany(initialMessages.map(msg => ({
    ma_tin_nhan: msg.id,
    ma_hoi_thoai: msg.conversationId,
    ma_nguoi_gui: msg.senderId,
    ten_nguoi_gui: msg.senderName,
    anh_nguoi_gui: msg.senderAvatar,
    noi_dung: msg.content,
    loai_tin_nhan: msg.type === 'TEXT' ? 'VAN_BAN' : 'HE_THONG',
    da_xem: msg.readBy
  })));

  // 10. Thong Bao
  await ThongBaoModel.insertMany(initialNotifications.map(n => ({
    ma_thong_bao: n.id,
    ma_nguoi_dung: n.userId,
    tieu_de: n.title,
    noi_dung: n.message,
    loai_thong_bao: n.type,
    duong_dan: n.link,
    da_doc: n.isRead
  })));

  // 11. Bao Cao
  await BaoCaoModel.insertMany(initialReports.map(rp => ({
    ma_bao_cao: rp.id,
    ma_nguoi_bao_cao: rp.reporterId,
    ten_nguoi_bao_cao: rp.reporterName,
    loai_muc_tieu: rp.targetType,
    ma_muc_tieu: rp.targetId,
    tieu_de_muc_tieu: rp.targetTitle,
    ly_do: rp.reason,
    trang_thai: rp.status === 'PENDING' ? 'CHO_XU_LY' : 'DA_XU_LY'
  })));

  console.log('🎉 DA LUU CO DINH TOAN BO DU LIEU VAO MONGODB THANH CONG!');
  await mongoose.disconnect();
  process.exit(0);
}

runSeed().catch(err => {
  console.error('❌ Loi khi seed:', err);
  process.exit(1);
});
