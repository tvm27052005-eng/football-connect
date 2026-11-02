import { db } from '../models/db.js';
import { normalize } from './assistant.knowledge.js';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + 'đ';

const includesLocation = (query: string, city: string, district: string, name: string) =>
  query.includes(normalize(city)) || query.includes(normalize(district)) || query.includes(normalize(name));

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
