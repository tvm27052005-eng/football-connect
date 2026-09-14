import { Request, Response } from 'express';
import { db } from '../models/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { IField, ITimeSlot } from '../types/index.js';

export const standardTimeSlots = [
  { startTime: '06:00', endTime: '07:30', durationHours: 1.5 },
  { startTime: '07:30', endTime: '09:00', durationHours: 1.5 },
  { startTime: '09:00', endTime: '10:30', durationHours: 1.5 },
  { startTime: '14:30', endTime: '16:00', durationHours: 1.5 },
  { startTime: '16:00', endTime: '17:30', durationHours: 1.5 },
  { startTime: '17:30', endTime: '19:00', durationHours: 1.5 }, // Peak
  { startTime: '19:00', endTime: '20:30', durationHours: 1.5 }, // Peak
  { startTime: '20:30', endTime: '22:00', durationHours: 1.5 }, // Peak
  { startTime: '22:00', endTime: '23:30', durationHours: 1.5 }
];

export const fieldController = {
  // GET /api/fields?venueId=...
  getFieldsByVenue: async (req: Request, res: Response): Promise<void> => {
    try {
      const { venueId } = req.query;
      if (!venueId || typeof venueId !== 'string') {
        res.status(400).json({ success: false, message: 'Thiếu tham số venueId' });
        return;
      }

      const fields = db.fields.filter(f => f.venueId === venueId);
      res.json({ success: true, data: fields });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // GET /api/fields/:id
  getFieldById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const field = db.fields.find(f => f.id === id);
      if (!field) {
        res.status(404).json({ success: false, message: 'Không tìm thấy sân con' });
        return;
      }

      const venue = db.venues.find(v => v.id === field.venueId);
      res.json({
        success: true,
        data: {
          ...field,
          venueName: venue?.name,
          venueAddress: venue?.address
        }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // GET /api/fields/:id/availability?date=YYYY-MM-DD
  getFieldAvailability: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { date } = req.query;

      if (!date || typeof date !== 'string') {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp ngày cần kiểm tra (YYYY-MM-DD)' });
        return;
      }

      const field = db.fields.find(f => f.id === id);
      if (!field) {
        res.status(404).json({ success: false, message: 'Sân không tồn tại' });
        return;
      }

      // Check if field itself is inactive/maintenance
      const isFieldActive = field.status === 'ACTIVE';

      // Find all active bookings on this date for this field
      const dateBookings = db.bookings.filter(b =>
        b.fieldId === id &&
        b.bookingDate === date &&
        (b.status === 'CONFIRMED' || b.status === 'PENDING')
      );

      const slots: ITimeSlot[] = standardTimeSlots.map(slot => {
        if (!isFieldActive) {
          return {
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: 'BLOCKED',
            price: Math.round(field.pricePerHour * slot.durationHours)
          };
        }

        // Check if any booking overlaps with this slot
        const conflictingBooking = dateBookings.find(b =>
          (slot.startTime < b.endTime && slot.endTime > b.startTime)
        );

        let slotPrice = Math.round(field.pricePerHour * slot.durationHours);
        // Prime time surcharge (17:30 - 20:30)
        if (slot.startTime === '17:30' || slot.startTime === '19:00' || slot.startTime === '20:30') {
          slotPrice = Math.round(slotPrice * 1.15);
        }

        return {
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: conflictingBooking ? 'BOOKED' : 'AVAILABLE',
          bookingId: conflictingBooking ? conflictingBooking.id : undefined,
          price: slotPrice
        };
      });

      res.json({
        success: true,
        data: {
          fieldId: field.id,
          fieldName: field.name,
          date,
          slots
        }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi kiểm tra lịch sân' });
    }
  },

  // POST /api/fields (Owner / Admin)
  createField: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { venueId, name, fieldType, capacity, pricePerHour, surfaceType } = req.body;

      if (!venueId || !name || !fieldType || !pricePerHour) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin sân con' });
        return;
      }

      const venue = db.venues.find(v => v.id === venueId);
      if (!venue) {
        res.status(404).json({ success: false, message: 'Sân bóng mẹ không tồn tại' });
        return;
      }

      if (req.user?.role !== 'ADMIN' && venue.ownerId !== req.user?.id) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền quản lý sân bóng này' });
        return;
      }

      const newField: IField = {
        id: db.generateId('field'),
        venueId,
        name: name.trim(),
        fieldType,
        capacity: Number(capacity) || (fieldType === '5_vs_5' ? 10 : fieldType === '7_vs_7' ? 14 : 22),
        pricePerHour: Number(pricePerHour),
        surfaceType: surfaceType || 'ARTIFICIAL_GRASS',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.fields.push(newField);

      res.status(201).json({
        success: true,
        message: 'Tạo sân con thành công',
        data: newField
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // PUT /api/fields/:id (Owner / Admin)
  updateField: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const fieldIndex = db.fields.findIndex(f => f.id === id);
      if (fieldIndex === -1) {
        res.status(404).json({ success: false, message: 'Sân con không tồn tại' });
        return;
      }

      const field = db.fields[fieldIndex];
      const venue = db.venues.find(v => v.id === field.venueId);

      if (req.user?.role !== 'ADMIN' && venue?.ownerId !== req.user?.id) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền sửa sân con này' });
        return;
      }

      const updatedField: IField = {
        ...field,
        ...req.body,
        id: field.id,
        venueId: field.venueId,
        updatedAt: new Date().toISOString()
      };

      db.fields[fieldIndex] = updatedField;

      res.json({
        success: true,
        message: 'Cập nhật sân con thành công',
        data: updatedField
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // DELETE /api/fields/:id (Owner / Admin)
  deleteField: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const field = db.fields.find(f => f.id === id);
      if (!field) {
        res.status(404).json({ success: false, message: 'Sân con không tồn tại' });
        return;
      }

      const venue = db.venues.find(v => v.id === field.venueId);
      if (req.user?.role !== 'ADMIN' && venue?.ownerId !== req.user?.id) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền xóa sân con này' });
        return;
      }

      db.fields = db.fields.filter(f => f.id !== id);

      res.json({ success: true, message: 'Đã xóa sân con thành công' });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};
