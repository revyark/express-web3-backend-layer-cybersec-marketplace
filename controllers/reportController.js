import { submitUserReport as submitUserReportModel, submitReport as submitReportModel, getReports as getReportsModel, verifyReport as verifyReportModel } from '../models/reportModel.js';
import safeJson from '../utils/safeJson.js';

export async function submitReport(req, res) {
    try {
        const { url, accusedWallet } = req.body;

        console.log("🌐 Received report request for URL:", url);
        console.log("👤 Accused Wallet:", accusedWallet);

        const result = await submitReportModel(url, accusedWallet);
        res.json(result);
    } catch (err) {
        console.error("❌ Error submitting report:", err);
        res.status(500).json({ error: err.toString() });
    }
}
export async function submitUserReport(req, res) {
    try{        
        const { url, userWallet } = req.body;
        console.log("🌐 Received user report request for URL:", url);
        console.log("👤 User Wallet:", userWallet);
        const result = await submitUserReportModel(url, userWallet);
        res.json(result);
    } catch (err) {
        console.error("❌ Error submitting user report:", err);
        res.status(500).json({ error: err.toString() });
    }
}

export async function getReports(req, res) {
    try {
        const data = await getReportsModel();
        res.send(safeJson(data));
    } catch (err) {
        console.error("❌ Error fetching reports:", err);
        res.status(500).json({ error: err.toString() });
    }
}

export async function verifyReport(req, res) {
    try {
        const { reportId } = req.body;

        if (reportId === undefined) {
            return res.status(400).json({ error: "reportId is required" });
        }

        const result = await verifyReportModel(reportId);
        res.json(result);
    } catch (err) {
        console.error("❌ Error verifying report:", err);
        res.status(500).json({ error: err.toString() });
    }
}
