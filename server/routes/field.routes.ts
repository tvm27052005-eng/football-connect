import { Router } from 'express';
import { fieldController } from '../controllers/field.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', fieldController.getFieldsByVenue);
router.get('/:id', fieldController.getFieldById);
router.get('/:id/availability', fieldController.getFieldAvailability);

router.post('/', authenticateToken, requireRole('OWNER', 'ADMIN'), fieldController.createField);
router.put('/:id', authenticateToken, requireRole('OWNER', 'ADMIN'), fieldController.updateField);
router.delete('/:id', authenticateToken, requireRole('OWNER', 'ADMIN'), fieldController.deleteField);

export default router;
