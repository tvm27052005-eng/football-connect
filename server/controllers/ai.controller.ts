import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { db } from '../models/db.js';

// Helper to build comprehensive database stats & facts for system context
function buildSystemContext(): string {
  // Sort venues by min price
  const sortedByPrice = [...db.venues].sort((a, b) => a.priceRange.min - b.priceRange.min);
  const cheapestVenue = sortedByPrice[0];
  const mostExpensiveVenue = [...db.venues].sort((a, b) => b.priceRange.max - a.priceRange.max)[0];
  const topRatedVenue = [...db.venues].sort((a, b) => b.rating - a.rating)[0];

  const venuesSummary = db.venues.map(v => {
    const fields = db.fields.filter(f => f.venueId === v.id);
    const fieldDetails = fields.map(f => `${f.name} (${f.fieldType}, ${f.pricePerHour.toLocaleString('vi-VN')}đ/h, ${f.surfaceType})`).join('; ');
    return `- **${v.name}** (ID: ${v.id}):
  • Địa chỉ: ${v.address}, ${v.district}, ${v.city}
  • Khoảng giá: ${v.priceRange.min.toLocaleString('vi-VN')}đ - ${v.priceRange.max.toLocaleString('vi-VN')}đ/giờ
  • Đánh giá: ${v.rating}/5.0⭐ (${v.reviewCount} đánh giá)
  • Giờ mở cửa: ${v.openTime} - ${v.closeTime}
  • Tiện ích: ${v.amenities.join(', ')}
  • Mô tả: ${v.description}
  • Các sân trực thuộc: ${fieldDetails}`;
  }).join('\n\n');

  const matchesSummary = db.matches.filter(m => m.status === 'OPEN').map(m => {
    return `- **${m.title}** (ID: ${m.id}): Tại ${m.venueName}, Ngày ${m.matchDate} lúc ${m.startTime}-${m.endTime}. Loại sân: ${m.fieldType}. Trình độ: ${m.skillLevel}. Chi phí: ${m.costPerPerson ? m.costPerPerson.toLocaleString('vi-VN') + 'đ/người' : 'Miễn phí (Chủ kèo bao sân)'}. Hình thức: ${m.costSharing === '50_50' ? 'Chia đôi 50-50' : m.costSharing === 'LOOSER_PAYS' ? 'Đội thua trả tiền sân' : 'Đội A tài trợ 100%'}.`;
  }).join('\n');

  return `
Bạn là "Ngọc Mai" - Chuyên viên Chăm sóc Khách hàng & Tư vấn trực tuyến thân thiện, chuyên nghiệp của hệ thống đặt sân bóng và cáp kèo Football Connect Việt Nam.

VAI TRÒ & PHONG THÁI TƯ VẤN:
- Xưng hô: "Em" (hoặc "Football Connect") và gọi khách hàng là "anh/chị" hoặc "anh em" một cách lịch sự, ấm áp, tận tâm như một nhân viên hỗ trợ khách hàng thực sự.
- Luôn lắng nghe, phân tích kỹ yêu cầu của khách hàng (ví dụ: khách tìm sân rẻ nhất, tìm sân ở quận nào, cần sân 7 người hay 11 người, tìm kèo giao hữu...) để đưa ra câu trả lời ĐÚNG TRỌNG TÂM, CHI TIẾT và CHÍNH XÁC dựa vào dữ liệu thực tế dưới đây.
- Tuyệt đối không trả lời tự động chung chung rập khuôn. Nếu khách hỏi "sân rẻ nhất", hãy chỉ rõ sân nào rẻ nhất và giá bao nhiêu.

DỮ LIỆU SÂN BÓNG THỰC TẾ TRÊN HỆ THỐNG:
- **Sân có giá tiết kiệm nhất**: ${cheapestVenue ? `${cheapestVenue.name} (${cheapestVenue.district}, ${cheapestVenue.city}) với giá chỉ từ ${cheapestVenue.priceRange.min.toLocaleString('vi-VN')} VNĐ/giờ.` : 'N/A'}
- **Sân cao cấp / Đánh giá cao nhất**: ${topRatedVenue ? `${topRatedVenue.name} (${topRatedVenue.rating}⭐, ${topRatedVenue.district})` : 'N/A'}
- **Sân đắt nhất / Thi đấu lớn**: ${mostExpensiveVenue ? `${mostExpensiveVenue.name} (Tối đa ${mostExpensiveVenue.priceRange.max.toLocaleString('vi-VN')} VNĐ/giờ)` : 'N/A'}

DANH SÁCH TOÀN BỘ CỤM SÂN BÓNG:
${venuesSummary}

DANH SÁCH KÈO GIAO HỮU ĐANG TÌM ĐỐI THỦ:
${matchesSummary || 'Hiện chưa có kèo nào đang mở.'}

QUY TRÌNH & CHÍNH SÁCH ĐẶT SÂN:
1. Đặt sân: Chọn sân -> Chọn ngày & giờ trống -> Xác nhận -> Thanh toán (VNPAY, MoMo hoặc Tiền mặt tại sân).
2. Cáp kèo giao hữu: Đội A tạo kèo (chọn hình thức 50-50, Đội thua trả tiền hoặc Chủ kèo bao), Đội B nhận kèo và hai bên chat trao đổi trước trận đấu.
3. Hỗ trợ khách hàng: Nếu khách hàng cần hỗ trợ đặc biệt, sẵn sàng tư vấn các bước thực hiện trên ứng dụng.

Hãy trả lời một cách tự nhiên, trực tiếp vào thắc mắc của khách hàng với phong thái tư vấn viên chăm sóc khách hàng hàng đầu!
`;
}

// Advanced Smart Intent Analysis Engine for local fallback when Gemini API is offline/not configured
function processCustomerSupportQuery(userMessage: string): string {
  const msg = userMessage.toLowerCase().trim();

  // 1. CHEAPEST / LOWEST PRICE INTENT
  if (msg.includes('rẻ nhất') || msg.includes('giá rẻ') || msg.includes('tiết kiệm') || msg.includes('rẻ') || msg.includes('giá thấp')) {
    // Sort venues by min price
    const sorted = [...db.venues].sort((a, b) => a.priceRange.min - b.priceRange.min);
    const cheapest = sorted[0];

    let result = `Dạ em chào anh/chị! 👋\n\nNếu anh/chị đang tìm sân bóng có **mức giá thuê tiết kiệm nhất** trên hệ thống Football Connect thì hiện tại sân có giá ưu đãi nhất là:\n\n`;
    result += `🏆 **${cheapest.name}**\n`;
    result += `📍 **Địa chỉ**: ${cheapest.address}, ${cheapest.district}, ${cheapest.city}\n`;
    result += `💵 **Mức giá**: Chỉ từ **${cheapest.priceRange.min.toLocaleString('vi-VN')} VNĐ/giờ** (khoảng giá: ${cheapest.priceRange.min.toLocaleString('vi-VN')}đ - ${cheapest.priceRange.max.toLocaleString('vi-VN')}đ/h)\n`;
    result += `⭐ **Đánh giá**: ${cheapest.rating}/5.0⭐\n\n`;

    if (sorted.length > 1) {
      const second = sorted[1];
      result += `Lựa chọn tiết kiệm tiếp theo là **${second.name}** (${second.district}) với giá từ **${second.priceRange.min.toLocaleString('vi-VN')} VNĐ/giờ** ạ.\n\n`;
    }

    result += `Anh/chị có muốn em hướng dẫn đặt sân hoặc xem các khung giờ trống của sân này không ạ? 😊`;
    return result;
  }

  // 2. HIGHEST RATED / QUALITY / VIP INTENT
  if (msg.includes('tốt nhất') || msg.includes('xịn nhất') || msg.includes('vip') || msg.includes('cao cấp') || msg.includes('đánh giá cao') || msg.includes('đắt nhất') || msg.includes('fifa')) {
    const topRated = [...db.venues].sort((a, b) => b.rating - a.rating)[0];
    const fifaField = db.fields.find(f => f.name.toLowerCase().includes('fifa') || f.fieldType === '11_vs_11');
    const fifaVenue = fifaField ? db.venues.find(v => v.id === fifaField.venueId) : null;

    let result = `Dạ em chào anh/chị! ⚽\n\nNếu anh/chị muốn chọn **sân bóng chất lượng cao hàng đầu** để thi đấu hoặc giao hữu quan trọng thì Football Connect xin gợi ý:\n\n`;

    if (topRated) {
      result += `🌟 **${topRated.name}** (Đánh giá cao nhất hệ thống: **${topRated.rating}/5.0⭐**)\n`;
      result += `📍 **Địa chỉ**: ${topRated.address}, ${topRated.district}\n`;
      result += `✨ **Điểm nổi bật**: ${topRated.description}\n`;
      result += `💵 **Giá thuê**: ${topRated.priceRange.min.toLocaleString('vi-VN')}đ - ${topRated.priceRange.max.toLocaleString('vi-VN')}đ/h\n\n`;
    }

    if (fifaVenue) {
      result += `🏟️ Đặc biệt, nếu anh/chị cần sân 11 người đạt chuẩn FIFA thi đấu, anh/chị có thể tham khảo **${fifaVenue.name}** ạ!\n\n`;
    }

    result += `Em có thể hỗ trợ anh/chị kiểm tra lịch trống hoặc đặt sân ngay bây giờ ạ!`;
    return result;
  }

  // 3. LOCATION FILTER INTENT (Cầu Giấy, Mỹ Đình, Nam Từ Liêm, Thanh Xuân, Bình Thạnh, Hà Nội, TP.HCM)
  const locationKeywords = [
    { key: 'cầu giấy', district: 'Cầu Giấy' },
    { key: 'mỹ đình', district: 'Nam Từ Liêm' },
    { key: 'nam từ liêm', district: 'Nam Từ Liêm' },
    { key: 'thanh xuân', district: 'Thanh Xuân' },
    { key: 'bình thạnh', district: 'Bình Thạnh' },
    { key: 'hà nội', city: 'Hà Nội' },
    { key: 'hồ chí minh', city: 'TP. Hồ Chí Minh' },
    { key: 'sài gòn', city: 'TP. Hồ Chí Minh' },
    { key: 'sg', city: 'TP. Hồ Chí Minh' }
  ];

  const matchedLoc = locationKeywords.find(l => msg.includes(l.key));

  if (matchedLoc) {
    const matchedVenues = db.venues.filter(v => {
      if (matchedLoc.district) return v.district.toLowerCase().includes(matchedLoc.district.toLowerCase());
      if (matchedLoc.city) return v.city.toLowerCase().includes(matchedLoc.city.toLowerCase());
      return false;
    });

    if (matchedVenues.length > 0) {
      let result = `Dạ em chào anh/chị! 📍\n\nTại khu vực **${matchedLoc.district || matchedLoc.city}**, hệ thống Football Connect hiện có các cụm sân bóng sau ạ:\n\n`;
      matchedVenues.forEach((v, idx) => {
        result += `${idx + 1}. **${v.name}**\n`;
        result += `   • Địa chỉ: ${v.address}, ${v.district}\n`;
        result += `   • Mức giá: ${v.priceRange.min.toLocaleString('vi-VN')}đ - ${v.priceRange.max.toLocaleString('vi-VN')}đ/h\n`;
        result += `   • Đánh giá: ${v.rating}⭐ | Giờ mở cửa: ${v.openTime} - ${v.closeTime}\n\n`;
      });
      result += `Anh/chị thích cụm sân nào trong các sân trên để em hỗ trợ tư vấn chi tiết hơn ạ?`;
      return result;
    }
  }

  // 4. FIELD TYPE INTENT (Sân 5, Sân 7, Sân 11)
  if (msg.includes('sân 5') || msg.includes('5 người') || msg.includes('futsal')) {
    const fields5 = db.fields.filter(f => f.fieldType === '5_vs_5');
    const venueIds = Array.from(new Set(fields5.map(f => f.venueId)));
    const venues = db.venues.filter(v => venueIds.includes(v.id));

    let result = `Dạ em chào anh/chị! ⚽\n\nĐối với nhu cầu tìm **Sân bóng 5 người**, Football Connect có các sân phù hợp sau đây ạ:\n\n`;
    venues.forEach(v => {
      const fieldList = fields5.filter(f => f.venueId === v.id).map(f => `${f.name} (${f.pricePerHour.toLocaleString('vi-VN')}đ/h)`).join(', ');
      result += `• **${v.name}** (${v.district}): ${fieldList}\n`;
    });
    result += `\nAnh/chị chọn sân nào để em hỗ trợ đặt lịch ạ?`;
    return result;
  }

  if (msg.includes('sân 7') || msg.includes('7 người')) {
    const fields7 = db.fields.filter(f => f.fieldType === '7_vs_7');
    const venueIds = Array.from(new Set(fields7.map(f => f.venueId)));
    const venues = db.venues.filter(v => venueIds.includes(v.id));

    let result = `Dạ em chào anh/chị! ⚽\n\nCác cụm sân có **Sân bóng 7 người (Sân phủi tiêu chuẩn)** dành cho anh/chị gồm có:\n\n`;
    venues.forEach(v => {
      result += `• **${v.name}** (${v.district}): Giá từ ${v.priceRange.min.toLocaleString('vi-VN')}đ - ${v.priceRange.max.toLocaleString('vi-VN')}đ/h (${v.rating}⭐)\n`;
    });
    result += `\nAnh/chị cần đặt sân 7 ở khu vực nào ạ?`;
    return result;
  }

  if (msg.includes('sân 11') || msg.includes('11 người')) {
    const fields11 = db.fields.filter(f => f.fieldType === '11_vs_11');
    const venueIds = Array.from(new Set(fields11.map(f => f.venueId)));
    const venues = db.venues.filter(v => venueIds.includes(v.id));

    let result = `Dạ em chào anh/chị! 🏟️\n\nĐối với **Sân 11 người thi đấu lớn**, hiện tại hệ thống có:\n\n`;
    venues.forEach(v => {
      const f11 = fields11.find(f => f.venueId === v.id);
      result += `• **${v.name}** (${v.district}): ${f11?.name} - Giá: ${f11?.pricePerHour.toLocaleString('vi-VN')}đ/h\n`;
    });
    result += `\nSân 11 người rất phù hợp cho các giải đấu công ty hoặc trận thi đấu chính thức ạ. Anh/chị có cần em giữ chỗ không ạ?`;
    return result;
  }

  // 5. MATCHMAKING INTENT (Kèo giao hữu, bắt đối)
  if (msg.includes('kèo') || msg.includes('giao hữu') || msg.includes('tìm đối') || msg.includes('cáp kèo') || msg.includes('bắt đối')) {
    const openMatches = db.matches.filter(m => m.status === 'OPEN');
    let result = `Dạ em chào anh/chị! 🔥\n\nEm xin gửi anh/chị danh sách các **Kèo bóng giao hữu đang mở tìm đối thủ** trên Football Connect:\n\n`;

    if (openMatches.length > 0) {
      openMatches.forEach((m, i) => {
        result += `${i + 1}. **${m.title}**\n`;
        result += `   • Địa điểm: ${m.venueName}\n`;
        result += `   • Thời gian: ${m.matchDate} (${m.startTime} - ${m.endTime})\n`;
        result += `   • Loại sân: Sân ${m.fieldType} | Trình độ: ${m.skillLevel}\n`;
        result += `   • Chi phí: ${m.costPerPerson ? m.costPerPerson.toLocaleString('vi-VN') + 'đ/người' : 'Miễn phí (Chủ kèo bao sân)'}\n\n`;
      });
      result += `Anh/chị có thể truy cập mục **"Cáp kèo giao hữu"** trên menu để bấm **Tham gia trận** hoặc tạo kèo mới cho đội của mình ạ!`;
    } else {
      result += `Hiện tại các trận giao hữu đều đã có đủ đội nhận kèo. Anh/chị có thể bấm vào trang **"Cáp kèo giao hữu"** để đăng kèo mới và tìm đối thủ giao lưu nhé!`;
    }
    return result;
  }

  // 6. HOW TO BOOK / PAYMENT / POLICY INTENT
  if (msg.includes('đặt') || msg.includes('thanh toán') || msg.includes('hướng dẫn') || msg.includes('hủy') || msg.includes('chuyển khoản')) {
    return `Dạ em chào anh/chị! Em xin hướng dẫn quy trình **Đặt sân & Thanh toán** trên Football Connect ạ:\n\n1️⃣ **Bước 1**: Nhấp vào mục **Sân bóng** trên thanh menu và chọn cụm sân mong muốn.\n2️⃣ **Bước 2**: Bấm vào nút **Đặt sân ngay**, chọn ngày và chọn khung giờ trống còn hiệu lực.\n3️⃣ **Bước 3**: Nhập ghi chú (nếu có) và lựa chọn hình thức thanh toán (VNPAY, MoMo hoặc Tiền mặt tại sân).\n4️⃣ **Bước 4**: Xác nhận đặt sân. Ngay lập tức hệ thống sẽ gửi thông báo xác nhận và thông tin cho chủ sân!\n\nAnh/chị cần em hỗ trợ thao tác bước nào không ạ?`;
  }

  // 7. GREETING / GENERAL INQUIRY INTENT
  if (msg.includes('chào') || msg.includes('hi') || msg.includes('hello') || msg.includes('ơi') || msg.includes('tư vấn') || msg.includes('dạ') || msg.includes('tôi muốn hỏi')) {
    return `Dạ em chào anh/chị! Em là **Ngọc Mai** - Chuyên viên Chăm sóc Khách hàng của Football Connect ⚽.\n\nEm có thể giúp gì cho anh/chị hôm nay ạ?\n• Tìm sân bóng theo khu vực (Cầu Giấy, Mỹ Đình, Bình Thạnh...)\n• Tìm sân có giá rẻ nhất hoặc chất lượng cao nhất\n• Đăng ký hoặc tìm kèo đá giao hữu\n• Hướng dẫn đặt lịch và thanh toán\n\nAnh/chị cứ nhắn yêu cầu cho em nhé!`;
  }

  // DEFAULT INTENT ANSWER (Conversational CS Response)
  const defaultVenues = db.venues.slice(0, 2).map(v => `• **${v.name}** (${v.district}): từ ${v.priceRange.min.toLocaleString('vi-VN')}đ/h - ${v.rating}⭐`).join('\n');

  return `Dạ em đã nhận được câu hỏi của anh/chị rồi ạ! 😊\n\nVề yêu cầu "${userMessage}", em xin hỗ trợ như sau:\nHệ thống Football Connect hiện cung cấp đầy đủ thông tin và tính năng đặt sân trực tuyến cho các cụm sân chất lượng như:\n\n${defaultVenues}\n\nAnh/chị có thể cho em biết thêm chi tiết về **khu vực**, **khung giờ** hoặc **mức giá** anh/chị mong muốn để em tư vấn chính xác nhất cho anh/chị nhé! ⚽`;
}

export async function chatWithAI(req: Request, res: Response) {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Nội dung tin nhắn không hợp lệ.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini API Key exists, use official @google/genai SDK with enhanced CS Persona Prompt
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemContext = buildSystemContext();

        const formattedContents: any[] = [
          { role: 'user', parts: [{ text: systemContext }] },
          { role: 'model', parts: [{ text: 'Dạ em đã nắm rõ thông tin hệ thống và quy tắc tư vấn khách hàng. Em là Ngọc Mai - Chuyên viên CSKH Football Connect sẵn sàng hỗ trợ ạ!' }] }
        ];

        if (Array.isArray(history)) {
          for (const item of history.slice(-6)) {
            if (item.sender === 'user') {
              formattedContents.push({ role: 'user', parts: [{ text: item.text }] });
            } else if (item.sender === 'ai') {
              formattedContents.push({ role: 'model', parts: [{ text: item.text }] });
            }
          }
        }

        formattedContents.push({ role: 'user', parts: [{ text: message }] });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: formattedContents,
          config: {
            temperature: 0.7,
            maxOutputTokens: 800,
          }
        });

        const replyText = response.text || processCustomerSupportQuery(message);

        res.json({
          success: true,
          reply: replyText,
          source: 'gemini'
        });
        return;
      } catch (geminiError) {
        console.warn('Gemini API call failed, using CS intent engine:', geminiError);
      }
    }

    // Advanced Customer Support Intent Processing Engine
    const csReply = processCustomerSupportQuery(message);
    res.json({
      success: true,
      reply: csReply,
      source: 'cs-intent-engine'
    });

  } catch (error: any) {
    console.error('Error in chatWithAI:', error);
    res.status(500).json({ error: 'Có lỗi xảy ra khi xử lý phản hồi từ AI.' });
  }
}
