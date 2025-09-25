import express from 'express';
import { getWebsitesController } from '../controllers/websiteController.js';

const router = express.Router();

router.get('/websites', getWebsitesController);

export default router;
