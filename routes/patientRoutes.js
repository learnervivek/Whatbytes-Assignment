import express from 'express';
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient
} from '../controllers/patientController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all patient routes with JWT authentication middleware
router.use(authenticateToken);

// 1. Create a patient & 2. List patients
router.post(['/', ''], createPatient);
router.get(['/', ''], getPatients);

// 3. Get one, 4. Update, 5. Delete by ID
router.get(['/:id', '/:id/'], getPatientById);
router.put(['/:id', '/:id/'], updatePatient);
router.delete(['/:id', '/:id/'], deletePatient);

export default router;
