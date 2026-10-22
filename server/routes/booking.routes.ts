import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/owner/all', authenticateToken, bookingController.getBookings);
router.get('/admin/all', authenticateToken, bookingController.getBookings);
router.get('/', authenticateToken, bookingController.getBookings);
router.get('/:id', authenticateToken, bookingController.getBookingById);
router.post('/', authenticateToken, bookingController.createBooking);
router.post('/:id/payment', authenticateToken, bookingController.createPayment);
router.get('/:id/payment', authenticateToken, bookingController.checkPayment);
router.post('/:id/refund', authenticateToken, bookingController.confirmRefund);
router.put('/:id/cancel', authenticateToken, bookingController.cancelBooking);
router.put('/:id/status', authenticateToken, bookingController.updateBookingStatus);

export default router;
