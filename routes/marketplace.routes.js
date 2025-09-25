import { Router } from 'express';
import { createMarketplace, getAllMarketplaces, getMyMarketplaces, discardMarketplace } from '../controllers/marketplace.controller.js';

const router = Router();

router.get('/ping', (req, res) => {
    res.status(200).json({ ok: true, route: 'marketplaces', message: 'marketplace router mounted' });
});

router.route('/').get(getAllMarketplaces).post(createMarketplace);
router.route('/my').get(getMyMarketplaces);
router.route('/:id').delete(discardMarketplace);

export default router;


