import { Router } from 'express';
import { connectWallet } from '../controllers/auth.controller.js';

const router = Router();

router.get('/ping', (req, res) => {
    res.status(200).json({ ok: true, route: 'auth', message: 'auth router mounted' });
});

router.route('/connect-wallet').post(connectWallet);

export default router;


