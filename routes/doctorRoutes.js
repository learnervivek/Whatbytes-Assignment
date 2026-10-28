import express from 'express';
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} from '../controllers/doctorController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all doctor routes with JWT authentication middleware
router.use(authenticateToken);

// 1. Create a doctor & 2. List doctors
router.post(['/', ''], createDoctor);
router.get(['/', ''], getDoctors);

// 3. Get one, 4. Update, 5. Delete by ID
router.get(['/:id', '/:id/'], getDoctorById);
router.put(['/:id', '/:id/'], updateDoctor);
router.delete(['/:id', '/:id/'], deleteDoctor);

export default router;
