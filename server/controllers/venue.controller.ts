import { Request, Response } from 'express';
import { db } from '../models/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { IVenue, IField } from '../types/index.js';

export const venueController = {
  // GET /api/venues
  getAllVenues: async (req: Request, res: Response): Promise<void> => {
    try {
      const { search, city, district, fieldType, minPrice, maxPrice, rating, sort, status } = req.query;

      let results = [...db.venues];

      // Status filter
      if (status && typeof status === 'string') {
        results = results.filter(v => v.status === status);
      } else {
        // Public list only shows ACTIVE
        results = results.filter(v => v.status === 'ACTIVE');
      }

      // City filter
      if (city && typeof city === 'string' && city !== 'ALL') {
        results = results.filter(v => v.city.toLowerCase() === city.toLowerCase());
      }

      // District filter
      if (district && typeof district === 'string' && district !== 'ALL') {
        results = results.filter(v => v.district.toLowerCase() === district.toLowerCase());
      }

      // FieldType filter (via venue's associated fields)
      if (fieldType && typeof fieldType === 'string' && fieldType !== 'ALL') {
        const venueIdsWithFieldType = new Set(
          db.fields.filter(f => f.fieldType === fieldType && f.status === 'ACTIVE').map(f => f.venueId)
        );
        results = results.filter(v => venueIdsWithFieldType.has(v.id));
      }

      // Price filter
      if (minPrice && typeof minPrice === 'string') {
        results = results.filter(v => v.priceRange.max >= Number(minPrice));
      }
      if (maxPrice && typeof maxPrice === 'string') {
        results = results.filter(v => v.priceRange.min <= Number(maxPrice));
      }

      // Rating filter
      if (rating && typeof rating === 'string') {
        results = results.filter(v => v.rating >= Number(rating));
      }

      // Text search
      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        results = results.filter(v =>
          v.name.toLowerCase().includes(q) ||
          v.address.toLowerCase().includes(q) ||
          v.district.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.amenities.some(a => a.toLowerCase().includes(q))
        );
      }

      // Sorting
      if (sort === 'rating_desc') {
        results.sort((a, b) => b.rating - a.rating);
      } else if (sort === 'price_asc') {
        results.sort((a, b) => a.priceRange.min - b.priceRange.min);
      } else if (sort === 'price_desc') {
        results.sort((a, b) => b.priceRange.max - a.priceRange.max);
      } else if (sort === 'reviews_desc') {
        results.sort((a, b) => b.reviewCount - a.reviewCount);
      } else {
        // Default latest
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      // Attach fields summary to each venue card
      const enrichedVenues = results.map(v => {
        const fields = db.fields.filter(f => f.venueId === v.id && f.status === 'ACTIVE');
        const fieldTypes = Array.from(new Set(fields.map(f => f.fieldType)));
        return {
          ...v,
          totalFields: fields.length,
          availableFieldTypes: fieldTypes
        };
      });

      res.json({
        success: true,
        count: enrichedVenues.length,
        data: enrichedVenues
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server khi tải danh sách sân' });
    }
  },

  // GET /api/venues/owner/my-venues
  getMyVenues: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      let venues: IVenue[] = [];
      if (req.user.role === 'ADMIN') {
        venues = db.venues;
      } else {
        venues = db.venues.filter(v => v.ownerId === req.user?.id);
      }

      const enriched = venues.map(v => {
        const fields = db.fields.filter(f => f.venueId === v.id);
        const venueBookings = db.bookings.filter(b => b.venueId === v.id);
        const venueReviews = db.reviews.filter(r => r.venueId === v.id);
        return {
          ...v,
          fields,
          totalBookings: venueBookings.length,
          recentReviews: venueReviews.slice(0, 3)
        };
      });

      res.json({ success: true, data: enriched });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // GET /api/venues/:id
  getVenueById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const venue = db.venues.find(v => v.id === id);
      if (!venue) {
        res.status(404).json({ success: false, message: 'Không tìm thấy sân bóng' });
        return;
      }

      const fields = db.fields.filter(f => f.venueId === venue.id && f.status === 'ACTIVE');
      const reviews = db.reviews.filter(r => r.venueId === venue.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const owner = db.users.find(u => u.id === venue.ownerId);

      res.json({
        success: true,
        data: {
          ...venue,
          ownerName: owner?.name || 'Chủ sân',
          ownerPhone: owner?.phone || '0900000000',
          fields,
          reviews
        }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // POST /api/venues
  createVenue: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const {
        name,
        address,
        city,
        district,
        description,
        images,
        latitude,
        longitude,
        amenities,
        openTime,
        closeTime,
        priceMin,
        priceMax
      } = req.body;

      if (!name || !address || !city || !district) {
        res.status(400).json({ success: false, message: 'Vui lòng điền đủ tên sân, địa chỉ, thành phố và quận' });
        return;
      }

      const newVenue: IVenue = {
        id: db.generateId('venue'),
        name: name.trim(),
        ownerId: req.user.id,
        ownerName: req.user.name,
        address: address.trim(),
        city: city.trim(),
        district: district.trim(),
        description: description || '',
        images: images && images.length > 0 ? images : [
          'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800'
        ],
        latitude: Number(latitude) || 21.0285,
        longitude: Number(longitude) || 105.7854,
        amenities: amenities || ['Bãi đỗ xe', 'Đèn LED', 'Nước uống'],
        rating: 5.0,
        reviewCount: 0,
        priceRange: {
          min: Number(priceMin) || 300000,
          max: Number(priceMax) || 700000
        },
        openTime: openTime || '06:00',
        closeTime: closeTime || '23:00',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.venues.push(newVenue);

      // Create a default field 7-vs-7 for this venue
      const defaultField: IField = {
        id: db.generateId('field'),
        venueId: newVenue.id,
        name: 'Sân 1 (Sân 7 người)',
        fieldType: '7_vs_7',
        capacity: 14,
        pricePerHour: newVenue.priceRange.min,
        surfaceType: 'ARTIFICIAL_GRASS',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.fields.push(defaultField);

      res.status(201).json({
        success: true,
        message: 'Thêm sân bóng thành công',
        data: newVenue
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server khi tạo sân' });
    }
  },

  // PUT /api/venues/:id
  updateVenue: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const venueIndex = db.venues.findIndex(v => v.id === id);
      if (venueIndex === -1) {
        res.status(404).json({ success: false, message: 'Sân không tồn tại' });
        return;
      }

      const venue = db.venues[venueIndex];

      // Check ownership
      if (req.user?.role !== 'ADMIN' && venue.ownerId !== req.user?.id) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền sửa sân của chủ khác' });
        return;
      }

      const updatedVenue: IVenue = {
        ...venue,
        ...req.body,
        id: venue.id,
        ownerId: venue.ownerId, // preserve owner
        updatedAt: new Date().toISOString()
      };

      db.venues[venueIndex] = updatedVenue;

      res.json({
        success: true,
        message: 'Cập nhật thông tin sân thành công',
        data: updatedVenue
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // DELETE /api/venues/:id
  deleteVenue: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const venue = db.venues.find(v => v.id === id);
      if (!venue) {
        res.status(404).json({ success: false, message: 'Sân không tồn tại' });
        return;
      }

      if (req.user?.role !== 'ADMIN' && venue.ownerId !== req.user?.id) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền xóa sân này' });
        return;
      }

      db.venues = db.venues.filter(v => v.id !== id);
      // Clean up fields associated
      db.fields = db.fields.filter(f => f.venueId !== id);

      res.json({ success: true, message: 'Đã xóa sân bóng thành công' });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};
