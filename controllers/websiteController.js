import { getWebsites } from '../models/websiteModel.js';

export async function getWebsitesController(req, res) {
    try {
        const websites = await getWebsites();
        res.json(websites);
    } catch (err) {
        console.error("❌ Error fetching websites:", err);
        res.status(500).json({ error: err.toString() });
    }
}
