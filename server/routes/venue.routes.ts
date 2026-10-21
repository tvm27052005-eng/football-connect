import { Router } from 'express';
import { venueController } from '../controllers/venue.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Admin & Public routes
router.get('/admin/all', authenticateToken, requireRole('ADMIN'), (req, res) => {
  req.query.status = 'ALL';
  venueController.getAllVenues(req, res);
});
router.put('/admin/:id/status', authenticateToken, requireRole('ADMIN'), venueController.updateVenue);

router.get('/', venueController.getAllVenues);
router.get('/owner/my-venues', authenticateToken, requireRole('OWNER', 'ADMIN'), venueController.getMyVenues);
router.get('/geocode', authenticateToken, requireRole('OWNER', 'ADMIN'), venueController.geocodeVenueAddress);
router.get('/:id', venueController.getVenueById);

// Owner / Admin operations
router.post('/', authenticateToken, requireRole('OWNER', 'ADMIN'), venueController.createVenue);
router.put('/:id', authenticateToken, requireRole('OWNER', 'ADMIN'), venueController.updateVenue);
router.delete('/:id', authenticateToken, requireRole('OWNER', 'ADMIN'), venueController.deleteVenue);

export default router;
