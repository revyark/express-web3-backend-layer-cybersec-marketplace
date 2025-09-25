import Web3 from "web3";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();


const MarketplaceABI = JSON.parse(fs.readFileSync("./abis/MarketplaceThreatIntelV3.json", "utf8"));
const RewardsABI = JSON.parse(fs.readFileSync("./abis/ThreatRewardsV3.json", "utf8"));

const web3 = new Web3(process.env.ALCHEMY_URL);

const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

const marketplace = new web3.eth.Contract(MarketplaceABI, process.env.MARKETPLACE_ADDRESS);
const rewards = new web3.eth.Contract(RewardsABI, process.env.REWARDS_ADDRESS);

console.log("✅ Using blockchain account:", account.address);
console.log("✅ Connected to contract at:", process.env.MARKETPLACE_ADDRESS);
console.log("✅ Connected to contract at:", process.env.REWARDS_ADDRESS);

export { web3, marketplace,rewards,account };
