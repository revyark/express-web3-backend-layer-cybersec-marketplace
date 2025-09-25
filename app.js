import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import reportRoutes from './routes/reportRoutes.js';
import websiteRoutes from './routes/websiteRoutes.js';
import './config/web3Config.js'; // Initialize web3 config

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Register routes
app.use('/', reportRoutes);
app.use('/api', websiteRoutes);

export default app;
