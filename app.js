import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import reportRoutes from './routes/reportRoutes.js';
import websiteRoutes from './routes/websiteRoutes.js';
import './config/web3Config.js'; // Initialize web3 config
import authRoutes from './routes/auth.routes.js';
import marketplaceRoutes from './routes/marketplace.routes.js';
import dismissedRoutes from './routes/dismissed.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import cookieParser from 'cookie-parser';



dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({extended: true, limit: '16kb'}));
app.use(express.static('public'))
app.use(cookieParser())


// Register routes
app.use('/', reportRoutes);
app.use('/api', websiteRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/marketplaces', marketplaceRoutes);
app.use('/api/v1/dismissed', dismissedRoutes);
app.use('/api/v1/upload', uploadRoutes);
export default app;
