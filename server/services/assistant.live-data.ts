import { db } from '../models/db.js';
import { getFieldTimeSlots } from '../controllers/field.controller.js';
import { normalize } from './assistant.knowledge.js';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + 'đ';

const includesLocation = (query: string, city: string, district: string, name: string) =>
  query.includes(normalize(city)) || query.includes(normalize(district)) || query.includes(normalize(name));

const parseRequestedDate = (message: string): string | null => {
  const iso = message.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];
  const short = message.match(/\b(\d{1,2})[\/-](\d{1,2})\b/);
  if (!short) return null;
  const year = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }).format(new Date());
  return `${year}-${short[2].padStart(2, '0')}-${short[1].padStart(2, '0')}`;
};

const parseRequestedTime = (message: string): string | null => {
  const match = normalize(message).match(/(?:luc|vao|ca|at)?\s*\b([01]?\d|2[0-3])(?:h|:)([0-5]\d)?\b/);
  if (!match) return null;
  return `${match[1].padStart(2, '0')}:${match[2] || '00'}`;
};

function getAvailabilitySnapshot(message: string, activeVenues = db.venues.filter(venue => venue.status === 'ACTIVE')): string | null {
  const query = normalize(message);
  if (!/(con trong|gio trong|lich trong|lich san|trong khung gio|available|availability)/.test(query)) return null;
  const venue = [...activeVenues].sort((a, b) => b.name.length - a.name.length).find(item => query.includes(normalize(item.name)));
  const date = parseRequestedDate(message);
  const time = parseRequestedTime(message);
  if (!venue || !date || !time) return null;

  const fields = db.fields.filter(field => field.venueId === venue.id && field.status === 'ACTIVE');
  if (!fields.length) return `TRA CỨU LỊCH THỰC TẾ: ${venue.name}, ngày ${date}, lúc ${time}.\nChưa có sân con đang hoạt động để kiểm tra lịch. Vui lòng mở chi tiết sân để xác nhận.`;
  const available: string[] = [], booked: string[] = [], missingSlot: string[] = [];
  for (const field of fields) {
    const slot = getFieldTimeSlots(field).find(item => item.startTime <= time && item.endTime > time);
    if (!slot) { missingSlot.push(field.name); continue; }
    const isPast = Date.parse(`${date}T${slot.startTime}:00+07:00`) <= Date.now();
    const isBooked = db.bookings.some(booking => booking.fieldId === field.id && booking.bookingDate === date && booking.status !== 'CANCELLED' && slot.startTime < booking.endTime && slot.endTime > booking.startTime);
    if (!isPast && !isBooked) available.push(`${field.name} (${slot.startTime}–${slot.endTime}, ${money(slot.price)})`);
    else booked.push(field.name);
  }
  const result = [
    `TRA CỨU LỊCH THỰC TẾ: ${venue.name}, ngày ${date}, lúc ${time}.`,
    available.length ? `Còn trống: ${available.join('; ')}.` : 'Không có sân con còn trống ở khung giờ này.',
    booked.length ? `Đã đặt/đã qua giờ: ${booked.join(', ')}.` : '',
    missingSlot.length ? `Không có ca hoạt động bao phủ thời điểm này: ${missingSlot.join(', ')}.` : '',
    'Kết quả chỉ để tham khảo tại thời điểm trả lời; cần mở Đặt lịch sân để xác nhận trước khi thanh toán.'
  ].filter(Boolean).join('\n');
  return result;
}

/** Public, read-only snapshot. Credentials, contact details and user records never leave the server. */
export function getLiveAssistantData(message: string): string | null {
  const query = normalize(message);
  const asksVenue = /san|gia|khu vuc|quan|huyen|venue|price|field|dat san/.test(query);
  const asksMatch = /keo|giao huu|doi thu|friendly|match/.test(query);
  const sections: string[] = [];

  if (asksVenue) {
    let venues = db.venues.filter(venue => venue.status === 'ACTIVE');
    const hasLocation = venues.some(venue => includesLocation(query, venue.city, venue.district, venue.name));
    if (hasLocation) venues = venues.filter(venue => includesLocation(query, venue.city, venue.district, venue.name));
    if (/re nhat|gia re|thap nhat|cheap|lowest/.test(query)) venues.sort((a, b) => a.priceRange.min - b.priceRange.min);
    else if (/tot nhat|danh gia|rating|review/.test(query)) venues.sort((a, b) => b.rating - a.rating);
    else venues.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    const summary = venues.slice(0, 6).map(venue => {
      const fields = db.fields.filter(field => field.venueId === venue.id && field.status === 'ACTIVE');
      const types = [...new Set(fields.map(field => field.fieldType.replace('_vs_', ' người')))].join(', ') || 'Chưa có sân con hoạt động';
      return `- ${venue.name} | ${venue.district}, ${venue.city} | ${money(venue.priceRange.min)}–${money(venue.priceRange.max)}/giờ | ${types} | ${venue.rating.toFixed(1)}/5 (${venue.reviewCount} đánh giá) | ${venue.openTime}–${venue.closeTime} | ${venue.amenities.slice(0, 4).join(', ') || 'Chưa cập nhật tiện ích'}`;
    });
    sections.push(`DỮ LIỆU SÂN CÔNG KHAI HIỆN THỜI (${venues.length} kết quả, chỉ hiển thị tối đa 6):\n${summary.join('\n') || 'Không tìm thấy sân phù hợp.'}`);
    const availability = getAvailabilitySnapshot(message);
    if (availability) sections.push(availability);
  }

  if (asksMatch) {
    let matches = db.matches.filter(match => match.status === 'OPEN' || match.status === 'FULL');
    const hasLocation = matches.some(match => {
      const venue = db.venues.find(item => item.id === match.venueId);
      return venue ? includesLocation(query, venue.city, venue.district, `${match.title} ${match.venueName || ''}`) : false;
    });
    if (hasLocation) matches = matches.filter(match => {
      const venue = db.venues.find(item => item.id === match.venueId);
      return venue ? includesLocation(query, venue.city, venue.district, `${match.title} ${match.venueName || ''}`) : false;
    });
    matches.sort((a, b) => `${a.matchDate}T${a.startTime}`.localeCompare(`${b.matchDate}T${b.startTime}`));
    const summary = matches.slice(0, 6).map(match => {
      const players = db.matchParticipants.filter(participant => participant.matchId === match.id && participant.status === 'CONFIRMED').length;
      return `- ${match.title} | ${match.venueName || 'Chưa cập nhật sân'} | ${match.matchDate} ${match.startTime}–${match.endTime} | sân ${match.fieldType.replace('_vs_', ' người')} | trình độ ${match.skillLevel} | ${players}/${match.maxPlayers} người | trạng thái ${match.status}`;
    });
    sections.push(`DỮ LIỆU KÈO CÔNG KHAI HIỆN THỜI (${matches.length} kết quả, chỉ hiển thị tối đa 6):\n${summary.join('\n') || 'Không có kèo đang mở phù hợp.'}`);
  }

  return sections.length ? sections.join('\n\n') : null;
}
