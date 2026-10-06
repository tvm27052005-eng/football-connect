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
  HoiThoaiModel,
  TinNhanModel,
  ThongBaoModel,
  BaoCaoModel
} from '../models/mongoose.models.js';

export async function seedInitialData() {
  try {
    const userCount = await NguoiDungModel.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database MongoDB dang trong. Tien hanh nap du lieu mau tieng Viet khong dau...');

      // 1. Nguoi Dung
      const nguoiDungData = initialUsers.map(u => ({
        ma_nguoi_dung: u.id,
        ho_ten: u.name,
        email: u.email,
        mat_khau: u.password,
        so_dien_thoai: u.phone,
        vai_tro: (u.role === 'OWNER' ? 'CHU_SAN' : u.role === 'ADMIN' ? 'ADMIN' : 'KHACH_HANG') as any,
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
      }));
      await NguoiDungModel.insertMany(nguoiDungData);

      // 2. Cum San Bong
      const cumSanData = initialVenues.map(v => ({
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
        trang_thai: (v.status === 'ACTIVE' ? 'DANG_HOAT_DONG' : 'BAO_TRI') as any
      }));
      await CumSanBongModel.insertMany(cumSanData);

      // 3. San Chi Tiet
      const sanChiTietData = initialFields.map(f => ({
        ma_san_con: f.id,
        ma_cum_san: f.venueId,
        ten_san: f.name,
        loai_san: (f.fieldType === '5_vs_5' ? 'SAN_5' : f.fieldType === '7_vs_7' ? 'SAN_7' : 'SAN_11') as any,
        suc_chua: f.capacity,
        gia_thue_gio: f.pricePerHour,
        mat_co: f.surfaceType === 'ARTIFICIAL_GRASS' ? 'Cỏ nhân tạo' : f.surfaceType === 'NATURAL_GRASS' ? 'Cỏ tự nhiên' : 'Futsal trong nhà',
        trang_thai: (f.status === 'ACTIVE' ? 'DANG_HOAT_DONG' : 'BAO_TRI') as any
      }));
      await SanChiTietModel.insertMany(sanChiTietData);

      // 4. Don Dat San
      const donDatSanData = initialBookings.map(b => ({
        ma_don_dat: b.id,
        ma_khach_hang: b.userId,
        ten_khach_hang: b.userName,
        so_dien_thoai: b.userPhone,
        email: b.userEmail,
        ma_cum_san: b.venueId,
        ten_cum_san: b.venueName,
        dia_chi_san: b.venueAddress,
        ma_san_con: b.fieldId,
        ten_san_con: b.fieldName,
        loai_san: b.fieldType,
        ngay_dat: b.bookingDate,
        gio_bat_dau: b.startTime,
        gio_ket_thuc: b.endTime,
        thoi_luong_gio: b.durationHours,
        tong_tien: b.totalPrice,
        trang_thai_don: (b.status === 'CONFIRMED' ? 'DA_XAC_NHAN' : b.status === 'PENDING' ? 'CHO_DUYET' : b.status === 'CANCELLED' ? 'DA_HUY' : 'HOAN_THANH') as any,
        trang_thai_thanh_toan: (b.paymentStatus === 'PAID' ? 'DA_THANH_TOAN' : b.paymentStatus === 'REFUNDED' ? 'HOAN_TIEN' : 'CHUA_THANH_TOAN') as any,
        phuong_thuc_thanh_toan: (b.paymentMethod || 'TIEN_MAT') as any,
        ghi_chu: b.note,
        ly_do_huy: b.cancellationReason
      }));
      await DonDatSanModel.insertMany(donDatSanData);

      // 5. Keo Giao Huu
      const keoGiaoHuuData = initialMatches.map(m => ({
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
        trang_thai_keo: (m.status === 'OPEN' ? 'DANG_TIM_DOI' : m.status === 'FULL' ? 'DA_DU_DOI' : 'HOAN_THANH') as any,
        tien_san_moi_nguoi: m.costPerPerson,
        tong_tien_san: m.totalFieldFee,
        hinh_thuc_chia_tien: (m.costSharing === '50_50' ? 'CHIA_DOI_50_50' : m.costSharing === 'LOOSER_PAYS' ? 'THUA_TRA' : 'BAO_SAN') as any,
        ten_doi_a: m.teamAName,
        ten_doi_b: m.teamBName,
        doi_truong_doi_a: m.teamACaptain,
        doi_truong_doi_b: m.teamBCaptain,
        sdt_doi_a: m.teamAPhone,
        sdt_doi_b: m.teamBPhone,
        doi_b_da_tham_gia: m.teamBJoined
      }));
      await KeoGiaoHuuModel.insertMany(keoGiaoHuuData);

      // 6. Thanh Vien Keo
      const thanhVienData = initialMatchParticipants.map(p => ({
        ma_tham_gia: p.id,
        ma_keo_dau: p.matchId,
        ma_nguoi_dung: p.userId,
        ten_nguoi_dung: p.userName,
        anh_dai_dien: p.userAvatar,
        so_dien_thoai: p.userPhone,
        trinh_do: p.skillLevel,
        doi_thi_dau: (p.team === 'A' ? 'DOI_A' : p.team === 'B' ? 'DOI_B' : 'CHUA_CHON') as any,
        trang_thai: (p.status === 'CONFIRMED' ? 'XAC_NHAN' : 'CHO_DUYET') as any,
        ngay_tham_gia: p.joinedAt
      }));
      await ThanhVienKeoModel.insertMany(thanhVienData);

      // 7. Danh Gia
      const danhGiaData = initialReviews.map(r => ({
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
      }));
      await DanhGiaModel.insertMany(danhGiaData);

      // 8. Hoi Thoai & Tin Nhan
      const hoiThoaiData = initialConversations.map(c => ({
        ma_hoi_thoai: c.id,
        loai_hoi_thoai: (c.type === 'DIRECT' ? 'TRUC_TIEP' : c.type === 'MATCH' ? 'KEO_DAU' : 'SAN_BONG') as any,
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
      }));
      await HoiThoaiModel.insertMany(hoiThoaiData);

      const tinNhanData = initialMessages.map(msg => ({
        ma_tin_nhan: msg.id,
        ma_hoi_thoai: msg.conversationId,
        ma_nguoi_gui: msg.senderId,
        ten_nguoi_gui: msg.senderName,
        anh_nguoi_gui: msg.senderAvatar,
        noi_dung: msg.content,
        loai_tin_nhan: (msg.type === 'TEXT' ? 'VAN_BAN' : 'HE_THONG') as any,
        da_xem: msg.readBy
      }));
      await TinNhanModel.insertMany(tinNhanData);

      // 9. Thong Bao
      const thongBaoData = initialNotifications.map(n => ({
        ma_thong_bao: n.id,
        ma_nguoi_dung: n.userId,
        tieu_de: n.title,
        noi_dung: n.message,
        loai_thong_bao: n.type,
        duong_dan: n.link,
        da_doc: n.isRead
      }));
      await ThongBaoModel.insertMany(thongBaoData);

      // 10. Bao Cao
      const baoCaoData = initialReports.map(rp => ({
        ma_bao_cao: rp.id,
        ma_nguoi_bao_cao: rp.reporterId,
        ten_nguoi_bao_cao: rp.reporterName,
        loai_muc_tieu: rp.targetType,
        ma_muc_tieu: rp.targetId,
        tieu_de_muc_tieu: rp.targetTitle,
        ly_do: rp.reason,
        trang_thai: rp.status === 'PENDING' ? 'CHO_XU_LY' : 'DA_XU_LY'
      }));
      await BaoCaoModel.insertMany(baoCaoData);

      console.log('✨ Da nap du lieu mau tieng Viet khong dau vao MongoDB thanh cong!');
    } else {
      console.log(`ℹ️ MongoDB da co san ${userCount} nguoi dung trong collection 'nguoi_dung'.`);
    }
  } catch (error) {
    console.error('⚠️ Loi khi nap du lieu tieng Viet vao MongoDB:', error);
  }
}
