import express from 'express';
import { submitReport, submitUserReport, getReports, verifyReport } from '../controllers/reportController.js';

const router = express.Router();

router.post('/submitReport', submitReport);
router.post('/submitUserReport', submitUserReport);
router.get('/reports', getReports);
router.post('/verifyReport', verifyReport);

export default router;
