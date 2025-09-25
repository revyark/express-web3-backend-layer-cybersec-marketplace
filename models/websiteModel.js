import { MongoClient } from 'mongodb';

export async function getWebsites() {
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

        return transformedWebsites;

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

        return fallbackWebsites;
    } finally {
        if (client) {
            await client.close();
            console.log("🔌 MongoDB connection closed");
        }
    }
}
