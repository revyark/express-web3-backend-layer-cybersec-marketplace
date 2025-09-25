import { Router } from 'express';
import { createDismissed } from '../controllers/dismissed.controller.js';

const router = Router();

router.get('/ping', (req, res) => {
    res.status(200).json({ ok: true, route: 'dismissed', message: 'dismissed router mounted' });
});

router.route('/').post(createDismissed);

export default router;
