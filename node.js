import express from "express";
import fetch from "node-fetch"; // npm install node-fetch
import Web3 from "web3";
import dotenv from "dotenv";
import fs from "fs";
import cors from 'cors';
// Load ABI once
const contractABI = JSON.parse(fs.readFileSync("./contractABI.json", "utf8"));

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const web3 = new Web3(process.env.ALCHEMY_URL);
const contract = new web3.eth.Contract(contractABI, process.env.CONTRACT_ADDRESS);

const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

console.log("✅ Using blockchain account:", account.address);
console.log("✅ Connected to contract at:", process.env.CONTRACT_ADDRESS);

function safeJson(obj) {
  return JSON.parse(JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

// Submit report
app.post("/submitReport", async (req, res) => {
    try {
        const { url, accusedWallet } = req.body;

        console.log("🌐 Received report request for URL:", url);
        console.log("👤 Accused Wallet:", accusedWallet);

        // 1️⃣ Call Python ML service
        const response = await fetch("http://localhost:5000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });
        const result = await response.json();
        console.log("🤖 ML Service Prediction:", result.prediction);

        // 2️⃣ Encode a dummy evidenceHash (32 bytes)
        const evidenceHash = web3.utils.padRight(web3.utils.asciiToHex(url), 64);
        console.log("📝 Evidence Hash:", evidenceHash);

        // 3️⃣ Submit to blockchain
        console.log("⛓️  Submitting transaction to blockchain...");
        const tx = await contract.methods
            .submitReport(url, accusedWallet, evidenceHash)
            .send({ from: account.address, gas: 300000 });

        console.log("✅ Blockchain TX confirmed!");
        console.log("   Tx Hash:", tx.transactionHash);
        console.log("   Block Number:", tx.blockNumber);
        console.log("   Gas Used:", tx.gasUsed);

        res.json({
            message: "Report submitted successfully",
            txHash: tx.transactionHash,
            blockNumber: tx.blockNumber.toString(), // convert BigInt to string
            gasUsed: tx.gasUsed.toString(), 
            prediction: result.prediction
        });
    } catch (err) {
        console.error("❌ Error submitting report:", err);
        res.status(500).json({ error: err.toString() });
    }
});

// GET /reports - Fetch all reports from the blockchain
app.get("/reports", async (req, res) => {
    try {
        const total = await contract.methods.totalReports().call();

        const statusMap = ["Reported", "Verified", "Rejected"];
        const reports = [];

        for (let i = 0; i < total; i++) {
            const r = await contract.methods.getReport(i).call();

            reports.push({
                id: i,
                domain: r.domain,
                accusedWallet: r.accusedWallet,
                reporter: r.reporter,
                evidenceHash: r.evidenceHash,
                timestamp: r.timestamp, // leave as-is
                status: statusMap[Number(r.status)]
            });
        }

        // ✅ Serialize safely
        res.send(safeJson({ totalReports: total, reports }));
    } catch (err) {
        console.error("❌ Error fetching reports:", err);
        res.status(500).json({ error: err.toString() });
    }
});


// POST /verifyReport - Only owner can call
app.post("/verifyReport", async (req, res) => {
    try {
        const { reportId } = req.body;

        if (reportId === undefined) {
            return res.status(400).json({ error: "reportId is required" });
        }

        // 1️⃣ Call contract to set status = Verified (1)
        const tx = await contract.methods
            .setReportStatus(reportId, 1) // 1 = Verified
            .send({ from: account.address, gas: 100000 });

        res.json({
            message: `Report ${reportId} marked as Verified`,
            txHash: tx.transactionHash
        });

    } catch (err) {
        console.error("❌ Error verifying report:", err);
        res.status(500).json({ error: err.toString() });
    }
});

// Start server
app.listen(3000, () => {
    console.log("🚀 Backend running on http://localhost:3000");
});
