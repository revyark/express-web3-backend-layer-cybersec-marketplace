import fetch from "node-fetch";
import { web3, marketplace,rewards, account } from "../config/web3Config.js";

export async function submitReport(url, accusedWallet) {
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
        return {
            message: "Report classified as benign - no blockchain submission required",
            prediction: result.prediction,
            blockchainSubmission: false
        };
    }

    // 3️⃣ Encode a dummy evidenceHash (32 bytes)
    const evidenceHash = web3.utils.soliditySha3(url); 
    console.log("📝 Evidence Hash:", evidenceHash);

    // 4️⃣ Submit to blockchain only for non-benign predictions
    console.log("⛓️  Submitting transaction to blockchain...");
    const tx = await marketplace.methods
        .submitReport(url, accusedWallet, evidenceHash,true)
        .send({ from: account.address });
    console.log("✅ Blockchain TX confirmed!");
    console.log("   Tx Hash:", tx.transactionHash);
    console.log("   Block Number:", tx.blockNumber);
    console.log("   Gas Used:", tx.gasUsed);

    const tx2 =await marketplace.methods
        .isWalletBanned(accusedWallet).call();
    const tx3=await marketplace.methods
        .isUrlBanned(url).call();
    
    console.log("🚫 Is Accused Wallet Banned?:", tx2);
    console.log("🚫 Is Accused Url Banned?:", tx3);
    return {
        message: "Report submitted successfully",
        txHash: tx.transactionHash,
        blockNumber: tx.blockNumber.toString(),
        gasUsed: tx.gasUsed.toString(),
        prediction: result.prediction,
        blockchainSubmission: true
    };
    
}


export async function submitUserReport(url, userWallet) {
    const evidenceHash = web3.utils.padRight(web3.utils.asciiToHex(url), 64);
    console.log("📝 Evidence Hash:", evidenceHash);

    // 4️⃣ Submit to blockchain only for non-benign predictions
    console.log("⛓️  Submitting transaction to blockchain...");
    const accusedWallet="0x0000000000000000000000000000000000000000"
    const tx = await marketplace.methods
        .submitReport(url,accusedWallet, evidenceHash,false)
        .send({ from: account.address, gas: 300000 });

    const tx2= await rewards.methods
        .registerReport(userWallet,evidenceHash)
        .send({ from: account.address, gas: 300000 });
    console.log("✅ User report confirmed!");
    console.log("   Tx Hash:", tx.transactionHash);
    console.log("   Block Number:", tx.blockNumber);
    console.log("   Gas Used:", tx.gasUsed);

    console.log("✅ Rewards TX confirmed!");
    console.log("   Tx Hash:", tx2.transactionHash);
    console.log("   Block Number:", tx2.blockNumber);
    console.log("   Gas Used:", tx2.gasUsed);
    return {
        message: "Report submitted successfully",
        txHash: tx.transactionHash,
        blockNumber: tx.blockNumber.toString(),
        gasUsed: tx.gasUsed.toString(),
        blockchainSubmission: true
    };
}
export async function getReports() {
    const total = await marketplace.methods.totalReports().call();

    const statusMap = ["Reported", "Verified", "Rejected"];
    const reports = [];

    for (let i = 0; i < total; i++) {
        const r = await marketplace.methods.getReport(i).call();
        reports.push({
            id: i,
            domain: r.domain,
            accusedWallet: r.accusedWallet,
            reporter: r.reporter,
            evidenceHash: r.evidenceHash,
            timestamp: r.timestamp,
            status: statusMap[Number(r.status)]
        });
    }

    return { totalReports: total, reports };
}

export async function verifyReport(reportId) {
    const tx = await contract.methods
        .setReportStatus(reportId, 1) // 1 = Verified
        .send({ from: account.address, gas: 100000 });

    return {
        message: `Report ${reportId} marked as Verified`,
        txHash: tx.transactionHash
    };
}
