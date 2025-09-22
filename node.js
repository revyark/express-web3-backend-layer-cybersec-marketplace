import express from "express";
import fetch from "node-fetch"; // npm install node-fetch
import Web3 from "web3";
import dotenv from "dotenv";
import fs from "fs";
import cors from 'cors';
import { MongoClient } from 'mongodb'; // npm install mongodb
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

        // 2️⃣ Check if prediction is not benign before submitting to blockchain
        if (result.prediction === "benign") {
            console.log("🛡️ Report classified as benign - skipping blockchain submission");
            return res.json({
                message: "Report classified as benign - no blockchain submission required",
                prediction: result.prediction,
                blockchainSubmission: false
            });
        }

        // 3️⃣ Encode a dummy evidenceHash (32 bytes)
        const evidenceHash = web3.utils.padRight(web3.utils.asciiToHex(url), 64);
        console.log("📝 Evidence Hash:", evidenceHash);

        // 4️⃣ Submit to blockchain only for non-benign predictions
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
            prediction: result.prediction,
            blockchainSubmission: true
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



// GET /api/websites - Fetch websites data from MongoDB
app.get("/api/websites", async (req, res) => {
    let client;

    try {
        // MongoDB connection details
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/threatai';
        const DB_NAME = process.env.DB_NAME || 'threatai';
        const COLLECTION_NAME = process.env.COLLECTION_NAME || 'reports';

        console.log("🔗 Connecting to MongoDB...");
        client = new MongoClient(MONGODB_URI);
        await client.connect();

        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        console.log("📊 Fetching data from MongoDB...");
        const websites = await collection.find({}).toArray();

        console.log(`✅ Found ${websites.length} websites in database`);

        // Transform MongoDB data to match frontend structure
        const transformedWebsites = websites.map((item, index) => ({
            id: item.id || item._id?.toString() || index + 1,
            url: item.url || item.domain || 'Unknown',
            imageUrl: item.imageUrl || `https://placehold.co/600x400/1f2937/9ca3af?text=${encodeURIComponent(item.url || 'Unknown')}`,
            ownerWallet: item.ownerWallet || item.accusedWallet || '0x0000...0000',
            totalProducts: item.totalProducts || Math.floor(Math.random() * 1000),
            interactions: item.interactions || Math.floor(Math.random() * 10000),
            joined: item.joined || item.timestamp || new Date().toISOString().split('T')[0],
            status: item.status || 'Unknown',
            prediction: item.prediction || item.predictionLabel || 'unknown'
        }));

        res.json(transformedWebsites);

    } catch (err) {
        console.error("❌ Error fetching websites data from MongoDB:", err);

        // Fallback to mock data if MongoDB fails
        console.log("🔄 Falling back to mock data...");
        const fallbackWebsites = [
            {
                id: 1,
                url: "malicious-site-one.com",
                imageUrl: "https://placehold.co/600x400/1f2937/9ca3af?text=Threat+Vector+1",
                ownerWallet: "0xAbCd...EfGh",
                totalProducts: 150,
                interactions: 1234,
                joined: "2024-08-15",
                status: "Active - High Threat",
                prediction: "malicious"
            },
            {
                id: 2,
                url: "phishing-example-two.net",
                imageUrl: "https://placehold.co/600x400/1f2937/9ca3af?text=Threat+Vector+2",
                ownerWallet: "0x1234...5678",
                totalProducts: 75,
                interactions: 850,
                joined: "2024-07-22",
                status: "Active - Medium Threat",
                prediction: "malicious"
            },
            {
                id: 3,
                url: "safe-looking-scam.org",
                imageUrl: "https://placehold.co/600x400/1f2937/9ca3af?text=Threat+Vector+3",
                ownerWallet: "0x9aBc...DeF0",
                totalProducts: 20,
                interactions: 300,
                joined: "2024-09-01",
                status: "Under Review",
                prediction: "benign"
            },
            {
                id: 4,
                url: "malware-distributor.io",
                imageUrl: "https://placehold.co/600x400/1f2937/9ca3af?text=Threat+Vector+4",
                ownerWallet: "0xFeDc...Ba98",
                totalProducts: 500,
                interactions: 5400,
                joined: "2024-06-10",
                status: "Active - Critical Threat",
                prediction: "malicious"
            },
            {
                id: 5,
                url: "crypto-drainer-link.xyz",
                imageUrl: "https://placehold.co/600x400/1f2937/9ca3af?text=Threat+Vector+5",
                ownerWallet: "0x7654...3210",
                totalProducts: 5,
                interactions: 980,
                joined: "2024-09-18",
                status: "New - High Threat",
                prediction: "malicious"
            }
        ];

        res.json(fallbackWebsites);
    } finally {
        if (client) {
            await client.close();
            console.log("🔌 MongoDB connection closed");
        }
    }
});

// Start server
app.listen(3000, () => {
    console.log("🚀 Backend running on http://localhost:3000");
});
