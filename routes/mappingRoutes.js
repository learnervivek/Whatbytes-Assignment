import express from 'express';
import {
  createMapping,
  getMappings,
  getDoctorsByPatient,
  deleteMapping
} from '../controllers/mappingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all mapping routes with JWT authentication middleware
router.use(authenticateToken);

// 1. Assign doctor & 2. List all mappings
router.post(['/', ''], createMapping);
router.get(['/', ''], getMappings);

// 3. Get all doctors assigned to a specific patient
router.get(['/:patient_id', '/:patient_id/'], getDoctorsByPatient);

// 4. Remove an assignment by mapping ID
router.delete(['/:id', '/:id/'], deleteMapping);

export default router;
