import { Request, Response } from 'express';
import { db } from '../models/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { calculateMatchScore } from '../utils/recommendation.js';
import { IMatch, IMatchParticipant } from '../types/index.js';

export const matchController = {
  // GET /api/matches
  getAllMatches: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        search,
        city,
        district,
        date,
        fieldType,
        skillLevel,
        status,
        venueId
      } = req.query;

      let matches = [...db.matches];

      // Status filter
      if (status && typeof status === 'string' && status !== 'ALL') {
        matches = matches.filter(m => m.status === status);
      } else {
        // By default show OPEN and FULL matches
        matches = matches.filter(m => m.status === 'OPEN' || m.status === 'FULL');
      }

      if (fieldType && typeof fieldType === 'string' && fieldType !== 'ALL') {
        matches = matches.filter(m => m.fieldType === fieldType);
      }

      if (skillLevel && typeof skillLevel === 'string' && skillLevel !== 'ALL') {
        matches = matches.filter(m => m.skillLevel === skillLevel);
      }

      if (date && typeof date === 'string') {
        matches = matches.filter(m => m.matchDate === date);
      }

      if (venueId && typeof venueId === 'string') {
        matches = matches.filter(m => m.venueId === venueId);
      }

      // City / District filter via Venue
      if ((city && city !== 'ALL') || (district && district !== 'ALL')) {
        const matchingVenueIds = new Set(
          db.venues.filter(v => {
            if (city && city !== 'ALL' && v.city.toLowerCase() !== String(city).toLowerCase()) return false;
            if (district && district !== 'ALL' && v.district.toLowerCase() !== String(district).toLowerCase()) return false;
            return true;
          }).map(v => v.id)
        );
        matches = matches.filter(m => matchingVenueIds.has(m.venueId));
      }

      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        matches = matches.filter(m =>
          m.title.toLowerCase().includes(q) ||
          (m.venueName && m.venueName.toLowerCase().includes(q)) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.creatorName && m.creatorName.toLowerCase().includes(q))
        );
      }

      // Sort by date and startTime
      matches.sort((a, b) => {
        const timeA = new Date(`${a.matchDate}T${a.startTime}`).getTime();
        const timeB = new Date(`${b.matchDate}T${b.startTime}`).getTime();
        return timeA - timeB;
      });

      // Enrich with participants
      const enriched = matches.map(m => {
        const parts = db.matchParticipants.filter(p => p.matchId === m.id && p.status === 'CONFIRMED');
        return {
          ...m,
          currentPlayers: parts.length,
          participants: parts
        };
      });

      res.json({ success: true, count: enriched.length, data: enriched });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // GET /api/matches/recommendations (Smart Match AI Recommendation algorithm)
  getMatchRecommendations: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = db.users.find(u => u.id === req.user?.id) || db.users[0];
      const openMatches = db.matches.filter(m => m.status === 'OPEN');

      const recommendations = openMatches.map(m => {
        const venue = db.venues.find(v => v.id === m.venueId);
        const parts = db.matchParticipants.filter(p => p.matchId === m.id && p.status === 'CONFIRMED');
        const enrichedMatch = { ...m, currentPlayers: parts.length, participants: parts };
        return calculateMatchScore(user, enrichedMatch, venue);
      });

      // Sort by highest score first
      recommendations.sort((a, b) => b.score - a.score);

      res.json({
        success: true,
        data: recommendations.slice(0, 10)
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server khi đề xuất trận' });
    }
  },

  // GET /api/matches/:id
  getMatchById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const match = db.matches.find(m => m.id === id);
      if (!match) {
        res.status(404).json({ success: false, message: 'Trận đấu không tồn tại' });
        return;
      }

      const participants = db.matchParticipants.filter(p => p.matchId === match.id && p.status === 'CONFIRMED');
      const venue = db.venues.find(v => v.id === match.venueId);
      const conversation = db.conversations.find(c => c.matchId === match.id);

      const teamA = participants.filter(p => p.team === 'A');
      const teamB = participants.filter(p => p.team === 'B');
      const unassigned = participants.filter(p => p.team === 'UNASSIGNED');

      res.json({
        success: true,
        data: {
          ...match,
          currentPlayers: participants.length,
          participants,
          teamA,
          teamB,
          unassigned,
          venue,
          conversationId: conversation?.id
        }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // POST /api/matches
  createMatch: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const {
        title,
        venueId,
        fieldId,
        matchDate,
        startTime,
        endTime,
        fieldType = '7_vs_7',
        skillLevel = 'INTERMEDIATE',
        totalFieldFee = 600000,
        costSharing = '50_50',
        description,
        teamAName,
        teamAPhone
      } = req.body;

      if (!title || !venueId || !matchDate || !startTime || !endTime) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin tạo kèo' });
        return;
      }

      const venue = db.venues.find(v => v.id === venueId);
      if (!venue) {
        res.status(404).json({ success: false, message: 'Sân bóng không tồn tại' });
        return;
      }

      const field = fieldId ? db.fields.find(f => f.id === fieldId) : undefined;
      const user = db.users.find(u => u.id === req.user?.id);

      const fee = Number(totalFieldFee) || 600000;
      let costPerPerson = fee / 2;
      if (costSharing === 'LOOSER_PAYS') costPerPerson = fee;
      if (costSharing === 'HOME_PAYS') costPerPerson = 0;

      const newMatch: IMatch = {
        id: db.generateId('match'),
        creatorId: req.user.id,
        creatorName: req.user.name,
        creatorAvatar: user?.avatar,
        creatorPhone: user?.phone,
        title: title.trim(),
        venueId: venue.id,
        venueName: venue.name,
        venueAddress: venue.address,
        fieldId: field?.id,
        fieldName: field?.name || 'Sân tiêu chuẩn',
        matchDate,
        startTime,
        endTime,
        fieldType,
        skillLevel,
        maxPlayers: fieldType === '5_vs_5' ? 10 : fieldType === '7_vs_7' ? 14 : 22,
        currentPlayers: 7,
        description: description || '',
        status: 'OPEN',
        costPerPerson,
        totalFieldFee: fee,
        costSharing,
        teamAName: teamAName || `FC ${req.user.name}`,
        teamBName: 'Đang tìm Đội B đối thủ...',
        teamACaptain: `${req.user.name} (Đội trưởng A)`,
        teamAPhone: teamAPhone || user?.phone || '',
        teamBJoined: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.syncMatch(newMatch);

      // Add creator as Team A Captain participant
      const creatorParticipant: IMatchParticipant = {
        id: db.generateId('part'),
        matchId: newMatch.id,
        userId: req.user.id,
        userName: req.user.name,
        userAvatar: user?.avatar,
        userPhone: user?.phone,
        skillLevel: user?.skillLevel || skillLevel,
        team: 'A',
        status: 'CONFIRMED',
        joinedAt: new Date().toISOString()
      };
      await db.syncMatchParticipant(creatorParticipant);

      // Create match conversation
      const matchConversation = {
        id: db.generateId('conv'),
        type: 'MATCH' as const,
        title: `Phòng Kèo: ${newMatch.teamAName} vs Đối Thủ`,
        matchId: newMatch.id,
        venueId: newMatch.venueId,
        participantIds: [req.user.id],
        lastMessage: {
          content: `${req.user.name} (Đội trưởng A) đã đăng kèo tìm đối thủ cho ${newMatch.teamAName}.`,
          senderId: req.user.id,
          senderName: req.user.name,
          createdAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.syncConversation(matchConversation);

      res.status(201).json({
        success: true,
        message: 'Đã tạo kèo tìm đối thủ cho đội bóng thành công!',
        data: {
          ...newMatch,
          conversationId: matchConversation.id
        }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server khi tạo kèo' });
    }
  },

  // POST /api/matches/:id/join (Bắt Kèo Đội B)
  joinMatch: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const { id } = req.params;
      const { teamBName, teamBPhone, teamBCaptain } = req.body;
      const match = db.matches.find(m => m.id === id);

      if (!match) {
        res.status(404).json({ success: false, message: 'Trận đấu không tồn tại' });
        return;
      }

      if (match.status === 'FULL' || match.teamBJoined) {
        res.status(400).json({ success: false, message: 'Trận đấu này đã có Đội B nhận kèo bắt cặp' });
        return;
      }

      if (match.creatorId === req.user.id) {
        res.status(400).json({ success: false, message: 'Bạn là đội trưởng Đội A tạo kèo này' });
        return;
      }

      const user = db.users.find(u => u.id === req.user?.id);

      match.teamBName = teamBName || `FC ${req.user.name}`;
      match.teamBCaptain = teamBCaptain || `${req.user.name} (Đội trưởng B)`;
      match.teamBPhone = teamBPhone || user?.phone || '';
      match.teamBJoined = true;
      match.status = 'FULL';
      match.updatedAt = new Date().toISOString();
      await db.syncMatch(match);

      const newParticipant: IMatchParticipant = {
        id: db.generateId('part'),
        matchId: match.id,
        userId: req.user.id,
        userName: req.user.name,
        userAvatar: user?.avatar,
        userPhone: user?.phone,
        skillLevel: user?.skillLevel || 'INTERMEDIATE',
        team: 'B',
        status: 'CONFIRMED',
        joinedAt: new Date().toISOString()
      };
      await db.syncMatchParticipant(newParticipant);

      // Add to conversation
      const conversation = db.conversations.find(c => c.matchId === match.id);
      if (conversation) {
        if (!conversation.participantIds.includes(req.user.id)) {
          conversation.participantIds.push(req.user.id);
        }
        await db.syncConversation(conversation);
        await db.syncMessage({
          id: db.generateId('msg'),
          conversationId: conversation.id,
          senderId: req.user.id,
          senderName: req.user.name,
          senderAvatar: user?.avatar,
          content: `🎉 ${req.user.name} (Đội trưởng ${match.teamBName}) đã nhận bắt kèo với ${match.teamAName}! Hai đội trưởng trao đổi trang phục và thời gian tại đây nhé!`,
          type: 'SYSTEM',
          readBy: [req.user.id],
          createdAt: new Date().toISOString()
        });
      }

      // Notify match creator (Team A)
      await db.syncNotification({
        id: db.generateId('notif'),
        userId: match.creatorId,
        title: '🎉 Đã có Đội B nhận bắt kèo của bạn!',
        message: `${match.teamBName} (Đội trưởng ${req.user.name}) vừa nhận kèo thi đấu với ${match.teamAName}!`,
        type: 'MATCH_JOINED',
        link: `/matches/${match.id}`,
        isRead: false,
        createdAt: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Nhận kèo bắt đối thành công! Chúc 2 đội thi đấu cống hiến.',
        data: {
          match,
          participant: newParticipant
        }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server khi nhận bắt kèo' });
    }
  },

  // DELETE /api/matches/:id/leave
  leaveMatch: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const { id } = req.params;
      const match = db.matches.find(m => m.id === id);

      if (!match) {
        res.status(404).json({ success: false, message: 'Trận đấu không tồn tại' });
        return;
      }

      if (match.creatorId === req.user.id) {
        res.status(400).json({ success: false, message: 'Người tạo trận không thể rời khỏi trận. Hãy chọn Hủy trận nếu muốn dừng.' });
        return;
      }

      const part = db.matchParticipants.find(p => p.matchId === id && p.userId === req.user?.id && p.status === 'CONFIRMED');
      if (!part) {
        res.status(400).json({ success: false, message: 'Bạn chưa tham gia trận đấu này' });
        return;
      }

      await db.deleteMatchParticipant(part.id);

      const activeParticipants = db.matchParticipants.filter(p => p.matchId === match.id && p.status === 'CONFIRMED');
      match.currentPlayers = activeParticipants.length;
      if (match.status === 'FULL' && match.currentPlayers < match.maxPlayers) {
        match.status = 'OPEN';
      }
      match.updatedAt = new Date().toISOString();
      await db.syncMatch(match);

      res.json({
        success: true,
        message: 'Bạn đã rời khỏi trận đấu'
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // PUT /api/matches/:id/cancel
  cancelMatch: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const match = db.matches.find(m => m.id === id);

      if (!match) {
        res.status(404).json({ success: false, message: 'Trận đấu không tồn tại' });
        return;
      }

      if (req.user?.role !== 'ADMIN' && match.creatorId !== req.user?.id) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền hủy trận này' });
        return;
      }

      match.status = 'CANCELLED';
      match.updatedAt = new Date().toISOString();
      await db.syncMatch(match);

      // Notify all participants
      const participants = db.matchParticipants.filter(p => p.matchId === id && p.status === 'CONFIRMED');
      for (const p of participants) {
        if (p.userId !== req.user?.id) {
          await db.syncNotification({
            id: db.generateId('notif'),
            userId: p.userId,
            title: 'Trận đấu đã bị hủy',
            message: `Trận đấu "${match.title}" vào ngày ${match.matchDate} đã bị hủy bởi người tạo.`,
            type: 'SYSTEM',
            link: '/matches',
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      }

      res.json({
        success: true,
        message: 'Đã hủy trận đấu thành công',
        data: match
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};
