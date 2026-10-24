import { IUser, IMatch, IVenue } from '../types/index.js';

export interface IMatchRecommendation {
  match: IMatch;
  score: number; // 0 to 100
  percentage: string; // "94%"
  reasons: string[];
  scoreBreakdown: {
    location: number; // max 30
    time: number; // max 25
    skill: number; // max 20
    fieldType: number; // max 15
    other: number; // max 10
  };
}

export function calculateMatchScore(user: IUser, match: IMatch, venue?: IVenue): IMatchRecommendation {
  let locationScore = 15; // base
  let timeScore = 15;
  let skillScore = 10;
  let fieldScore = 10;
  let otherScore = 5;
  const reasons: string[] = [];

  // 1. Location Matching (30%)
  if (venue && user.location) {
    if (venue.city.toLowerCase() === user.location.city.toLowerCase()) {
      if (venue.district.toLowerCase() === user.location.district.toLowerCase()) {
        locationScore = 30;
        reasons.push(`Cùng khu vực ${user.location.district}`);
      } else {
        locationScore = 20;
        reasons.push(`Cùng thành phố ${user.location.city}`);
      }
    } else {
      locationScore = 5;
    }
  }

  // 2. Time Matching (25%)
  // Default favorable evening/prime football hours: 17:30 - 21:00
  const matchHour = parseInt(match.startTime.split(':')[0], 10);
  if (matchHour >= 17 && matchHour <= 21) {
    timeScore = 25;
    reasons.push('Khung giờ vàng bóng đá (17:30 - 21:00)');
  } else if (matchHour >= 6 && matchHour <= 9) {
    timeScore = 20;
    reasons.push('Khung giờ sáng thể thao năng động');
  } else {
    timeScore = 15;
  }

  // 3. Skill Level Matching (20%)
  const skillRank: Record<string, number> = {
    BEGINNER: 1,
    INTERMEDIATE: 2,
    ADVANCED: 3,
    PRO: 4
  };

  const userRank = skillRank[user.skillLevel || 'INTERMEDIATE'] || 2;
  const matchRank = skillRank[match.skillLevel] || 2;
  const diff = Math.abs(userRank - matchRank);

  if (diff === 0) {
    skillScore = 20;
    reasons.push(`Đúng trình độ ${match.skillLevel === 'INTERMEDIATE' ? 'Trung bình khá' : match.skillLevel}`);
  } else if (diff === 1) {
    skillScore = 14;
    reasons.push('Trình độ tương đồng');
  } else {
    skillScore = 6;
  }

  // 4. Field Type Matching (15%)
  if (user.preferredFieldType && user.preferredFieldType === match.fieldType) {
    fieldScore = 15;
    reasons.push(`Đúng thể thức sân yêu thích (${match.fieldType.replace('_vs_', ' vs ')})`);
  } else {
    fieldScore = 10;
  }

  // 5. Other factors (10%) - Opponent availability and venue rating
  if (match.status === 'OPEN' && !match.teamBJoined) {
    otherScore += 3;
    reasons.push('Đang tìm đội đối thủ');
  }
  if (venue && venue.rating >= 4.7) {
    otherScore += 2;
    reasons.push(`Sân đánh giá cao (${venue.rating}★)`);
  }
  otherScore = Math.min(10, otherScore);

  const totalScore = Math.min(100, Math.round(locationScore + timeScore + skillScore + fieldScore + otherScore));

  return {
    match,
    score: totalScore,
    percentage: `${totalScore}%`,
    reasons: reasons.slice(0, 3),
    scoreBreakdown: {
      location: locationScore,
      time: timeScore,
      skill: skillScore,
      fieldType: fieldScore,
      other: otherScore
    }
  };
}
