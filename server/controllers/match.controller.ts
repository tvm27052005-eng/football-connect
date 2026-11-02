import { Request, Response } from 'express';
import { db } from '../models/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { calculateMatchScore } from '../utils/recommendation.js';
import { IMatch, IMatchParticipant } from '../types/index.js';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

const getMatchStartTime = (match: IMatch): number =>
  Date.parse(`${match.matchDate}T${match.startTime}:00+07:00`);

const getTimeUntilMatch = (match: IMatch): number => getMatchStartTime(match) - Date.now();

const removeUserFromMatchConversation = async (matchId: string, userId: string): Promise<void> => {
  const conversation = db.conversations.find(item => item.matchId === matchId);
  if (!conversation) return;
  conversation.participantIds = conversation.participantIds.filter(id => id !== userId);
  conversation.updatedAt = new Date().toISOString();
  await db.syncConversation(conversation);
};

const resetTeamB = (match: IMatch): void => {
  match.teamBName = 'Đang tìm Đội B đối thủ...';
  match.teamBCaptain = undefined;
  match.teamBPhone = undefined;
  match.teamBJoined = false;
  match.cancelRequest = undefined;
};

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
      const authenticatedReq = req as AuthenticatedRequest;
      if (authenticatedReq.user?.role === 'ADMIN') {
        if (status && typeof status === 'string' && status !== 'ALL') {
          matches = matches.filter(m => m.status === status);
        }
      } else {
        // By default show OPEN and FULL matches
        matches = matches.filter(m => m.status === 'OPEN' || m.status === 'FULL');
        if (status && typeof status === 'string' && status !== 'ALL') {
          matches = matches.filter(m => m.status === status);
        }
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

  // GET /api/matches/mine
  getMyMatches: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const matches = db.matches
        .filter(match => match.creatorId === req.user?.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(match => ({
          ...match,
          currentPlayers: db.matchParticipants.filter(
            participant => participant.matchId === match.id && participant.status === 'CONFIRMED'
          ).length,
          participants: db.matchParticipants.filter(
            participant => participant.matchId === match.id && participant.status === 'CONFIRMED'
          )
        }));

      res.json({ success: true, count: matches.length, data: matches });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server khi tải kèo của bạn' });
    }
  },

  // GET /api/matches/joined - Kèo người dùng đã nhận với vai trò Đội B
  getJoinedMatches: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const joinedMatchIds = new Set(
        db.matchParticipants
          .filter(participant => (
            participant.userId === req.user?.id &&
            participant.team === 'B' &&
            participant.status === 'CONFIRMED'
          ))
          .map(participant => participant.matchId)
      );

      const matches = db.matches
        .filter(match => joinedMatchIds.has(match.id))
        .sort((a, b) => {
          const timeA = new Date(`${a.matchDate}T${a.startTime}`).getTime();
          const timeB = new Date(`${b.matchDate}T${b.startTime}`).getTime();
          return timeA - timeB;
        })
        .map(match => {
          const participants = db.matchParticipants.filter(
            participant => participant.matchId === match.id && participant.status === 'CONFIRMED'
          );

          return {
            ...match,
            currentPlayers: participants.length,
            participants
          };
        });

      res.json({ success: true, count: matches.length, data: matches });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server khi tải kèo đã bắt' });
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

      if (venue.status !== 'ACTIVE') {
        res.status(400).json({ success: false, message: 'Cụm sân này chưa được quản trị viên phê duyệt để hoạt động' });
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
        status: 'PENDING_APPROVAL',
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
        message: 'Đã tạo kèo thành công và đang chờ Admin duyệt!',
        data: {
          ...newMatch,
          conversationId: matchConversation.id
        }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server khi tạo kèo' });
    }
  },

  // PUT /api/matches/:id/approve (Admin duyệt kèo)
  approveMatch: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const match = db.matches.find(m => m.id === req.params.id);
      if (!match) {
        res.status(404).json({ success: false, message: 'Trận đấu không tồn tại' });
        return;
      }

      if (match.status !== 'PENDING_APPROVAL') {
        res.status(400).json({ success: false, message: 'Kèo này không ở trạng thái chờ duyệt' });
        return;
      }

      match.status = 'OPEN';
      match.updatedAt = new Date().toISOString();
      await db.syncMatch(match);
      await db.syncNotification({
        id: db.generateId('notif'),
        userId: match.creatorId,
        title: 'Kèo đã được Admin duyệt',
        message: `Kèo "${match.title}" đã được duyệt và hiện đã hoạt động.`,
        type: 'SYSTEM',
        link: `/matches/${match.id}`,
        isRead: false,
        createdAt: new Date().toISOString()
      });

      res.json({ success: true, message: 'Đã duyệt kèo và đưa vào hoạt động', data: match });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server khi duyệt kèo' });
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

      if (match.status === 'PENDING_APPROVAL') {
        res.status(400).json({ success: false, message: 'Kèo đang chờ Admin duyệt, chưa thể nhận bắt kèo' });
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

  // DELETE /api/matches/:id/leave - Đội B hủy nhận kèo khi còn ít nhất 6 giờ
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

      const part = db.matchParticipants.find(p => p.matchId === id && p.userId === req.user?.id && p.team === 'B' && p.status === 'CONFIRMED');
      if (!part) {
        res.status(400).json({ success: false, message: 'Bạn không phải Đội B đang nhận kèo này' });
        return;
      }

      const timeUntilMatch = getTimeUntilMatch(match);
      if (timeUntilMatch <= 0) {
        res.status(400).json({ success: false, message: 'Trận đấu đã bắt đầu, bạn không thể hủy bắt kèo' });
        return;
      }
      if (timeUntilMatch < SIX_HOURS_MS) {
        res.status(409).json({
          success: false,
          code: 'CANCEL_REQUEST_REQUIRED',
          message: 'Trận đấu còn dưới 6 giờ. Vui lòng nhập lý do và gửi yêu cầu hủy cho người đăng kèo xác nhận.'
        });
        return;
      }

      await db.deleteMatchParticipant(part.id);
      await removeUserFromMatchConversation(match.id, req.user.id);

      const activeParticipants = db.matchParticipants.filter(p => p.matchId === match.id && p.status === 'CONFIRMED');
      match.currentPlayers = activeParticipants.length;
      match.status = 'OPEN';
      resetTeamB(match);
      match.updatedAt = new Date().toISOString();
      await db.syncMatch(match);

      await db.syncNotification({
        id: db.generateId('notif'),
        userId: match.creatorId,
        title: 'Đội B đã hủy bắt kèo',
        message: `${req.user.name} đã hủy nhận kèo "${match.title}". Bài đăng đã được mở lại để tìm đối thủ mới.`,
        type: 'SYSTEM',
        link: `/matches/${match.id}`,
        isRead: false,
        createdAt: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Đã hủy bắt kèo. Bài đăng được mở lại để tìm đối thủ mới.',
        data: match
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // POST /api/matches/:id/cancel-request - Đội B gửi yêu cầu hủy khi còn dưới 6 giờ
  requestCancelMatch: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }
      const match = db.matches.find(m => m.id === req.params.id);
      if (!match) {
        res.status(404).json({ success: false, message: 'Trận đấu không tồn tại' });
        return;
      }
      const participant = db.matchParticipants.find(p => p.matchId === match.id && p.userId === req.user?.id && p.team === 'B' && p.status === 'CONFIRMED');
      if (!participant) {
        res.status(403).json({ success: false, message: 'Chỉ Đội B đang nhận kèo mới được gửi yêu cầu hủy' });
        return;
      }
      if (match.status !== 'FULL' || !match.teamBJoined) {
        res.status(400).json({ success: false, message: 'Kèo này hiện không ở trạng thái đã ghép đội' });
        return;
      }
      const timeUntilMatch = getTimeUntilMatch(match);
      if (timeUntilMatch <= 0) {
        res.status(400).json({ success: false, message: 'Trận đấu đã bắt đầu, không thể gửi yêu cầu hủy' });
        return;
      }
      if (timeUntilMatch >= SIX_HOURS_MS) {
        res.status(400).json({ success: false, message: 'Trận đấu còn từ 6 giờ trở lên. Bạn có thể dùng chức năng Hủy bắt kèo trực tiếp.' });
        return;
      }
      const reason = String(req.body.reason || '').trim();
      if (reason.length < 5) {
        res.status(400).json({ success: false, message: 'Vui lòng nhập lý do hủy ít nhất 5 ký tự' });
        return;
      }
      if (match.cancelRequest?.status === 'PENDING') {
        res.status(409).json({ success: false, message: 'Yêu cầu hủy đang chờ người đăng kèo xử lý' });
        return;
      }

      match.cancelRequest = {
        requestedBy: req.user.id,
        requestedByName: req.user.name,
        reason,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      match.updatedAt = new Date().toISOString();
      await db.syncMatch(match);
      await db.syncNotification({
        id: db.generateId('notif'),
        userId: match.creatorId,
        title: 'Yêu cầu hủy bắt kèo cần xác nhận',
        message: `${req.user.name} xin hủy kèo "${match.title}" vì: ${reason}`,
        type: 'SYSTEM',
        link: `/matches/${match.id}`,
        isRead: false,
        createdAt: new Date().toISOString()
      });
      res.json({ success: true, message: 'Đã gửi yêu cầu hủy cho người đăng kèo xác nhận', data: match });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server khi gửi yêu cầu hủy' });
    }
  },

  // PUT /api/matches/:id/cancel-request/respond - Người đăng duyệt hoặc từ chối yêu cầu
  respondCancelRequest: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }
      const match = db.matches.find(m => m.id === req.params.id);
      if (!match) {
        res.status(404).json({ success: false, message: 'Trận đấu không tồn tại' });
        return;
      }
      if (match.creatorId !== req.user.id) {
        res.status(403).json({ success: false, message: 'Chỉ người đăng kèo mới được xử lý yêu cầu này' });
        return;
      }
      if (!match.cancelRequest || match.cancelRequest.status !== 'PENDING') {
        res.status(400).json({ success: false, message: 'Kèo không có yêu cầu hủy đang chờ xử lý' });
        return;
      }
      const action = String(req.body.action || '').toUpperCase();
      if (action !== 'APPROVE' && action !== 'REJECT') {
        res.status(400).json({ success: false, message: 'Thao tác xử lý không hợp lệ' });
        return;
      }

      const requesterId = match.cancelRequest.requestedBy;
      if (action === 'REJECT') {
        match.cancelRequest.status = 'REJECTED';
        match.cancelRequest.resolvedAt = new Date().toISOString();
        match.cancelRequest.resolvedBy = req.user.id;
        match.updatedAt = new Date().toISOString();
        await db.syncMatch(match);
        await db.syncNotification({
          id: db.generateId('notif'),
          userId: requesterId,
          title: 'Yêu cầu hủy kèo bị từ chối',
          message: `Người đăng đã từ chối yêu cầu hủy kèo "${match.title}".`,
          type: 'SYSTEM',
          link: `/matches/${match.id}`,
          isRead: false,
          createdAt: new Date().toISOString()
        });
        res.json({ success: true, message: 'Đã từ chối yêu cầu hủy', data: match });
        return;
      }

      const reason = match.cancelRequest.reason;
      const participant = db.matchParticipants.find(p => p.matchId === match.id && p.userId === requesterId && p.team === 'B' && p.status === 'CONFIRMED');
      if (participant) await db.deleteMatchParticipant(participant.id);
      await removeUserFromMatchConversation(match.id, requesterId);
      match.status = 'CANCELLED';
      match.cancellationReason = reason;
      match.cancelledBy = requesterId;
      match.cancelledAt = new Date().toISOString();
      match.currentPlayers = db.matchParticipants.filter(p => p.matchId === match.id && p.status === 'CONFIRMED').length;
      resetTeamB(match);
      match.updatedAt = new Date().toISOString();
      await db.syncMatch(match);
      await db.syncNotification({
        id: db.generateId('notif'),
        userId: requesterId,
        title: 'Yêu cầu hủy kèo đã được chấp nhận',
        message: `Kèo "${match.title}" đã được hủy theo yêu cầu của bạn.`,
        type: 'SYSTEM',
        link: `/matches/${match.id}`,
        isRead: false,
        createdAt: new Date().toISOString()
      });
      res.json({ success: true, message: 'Đã chấp nhận yêu cầu và hủy kèo', data: match });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server khi xử lý yêu cầu hủy' });
    }
  },

  // DELETE /api/matches/:id - Người đăng xóa kèo khi chưa có đối thủ
  deleteMatch: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }
      const match = db.matches.find(m => m.id === req.params.id);
      if (!match) {
        res.status(404).json({ success: false, message: 'Trận đấu không tồn tại' });
        return;
      }
      if (match.creatorId !== req.user.id) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền xóa kèo này' });
        return;
      }
      if (match.teamBJoined || match.status === 'FULL') {
        res.status(400).json({ success: false, message: 'Kèo đã có đối thủ nên không thể xóa. Vui lòng dùng chức năng Hủy kèo.' });
        return;
      }
      if (['STARTED', 'COMPLETED', 'CANCELLED'].includes(match.status)) {
        res.status(400).json({ success: false, message: 'Trạng thái hiện tại không cho phép xóa kèo' });
        return;
      }
      await db.deleteMatch(match.id);
      res.json({ success: true, message: 'Đã xóa kèo thành công' });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server khi xóa kèo' });
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

      if (match.status === 'CANCELLED') {
        res.status(400).json({ success: false, message: 'Kèo này đã được hủy trước đó' });
        return;
      }
      if (req.user?.role !== 'ADMIN' && !match.teamBJoined && match.status !== 'FULL') {
        res.status(400).json({ success: false, message: 'Kèo chưa có đối thủ. Vui lòng dùng chức năng Xóa kèo.' });
        return;
      }
      const reason = String(req.body.reason || '').trim();
      if (req.user?.role !== 'ADMIN' && reason.length < 5) {
        res.status(400).json({ success: false, message: 'Vui lòng nhập lý do hủy ít nhất 5 ký tự' });
        return;
      }

      match.status = 'CANCELLED';
      match.cancellationReason = reason || 'Quản trị viên hủy kèo';
      match.cancelledBy = req.user?.id;
      match.cancelledAt = new Date().toISOString();
      match.cancelRequest = undefined;
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
            message: `Trận đấu "${match.title}" vào ngày ${match.matchDate} đã bị hủy. Lý do: ${match.cancellationReason}.`,
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
