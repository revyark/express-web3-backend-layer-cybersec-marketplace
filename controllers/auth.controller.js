import jwt from 'jsonwebtoken';
import {User} from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const signTokens = (payload) => {
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

export const connectWallet = async (req, res, next) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress || typeof walletAddress !== 'string') {
            throw new ApiError(400, 'walletAddress is required');
        }

        const normalized = walletAddress.trim();

        let user = await User.findById(normalized);
        if (user) {
            if (user.banned) {
                throw new ApiError(403, 'This wallet is banned');
            }
        } else {
            user = await User.create({ _id: normalized, walletAddress: normalized });
        }

        const { accessToken, refreshToken } = signTokens({ sub: user._id });

        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();

        res
            .cookie('accessToken', accessToken, {
                httpOnly: true,
                sameSite: 'lax',
                secure: false,
                maxAge: 15 * 60 * 1000
            })
            .cookie('refreshToken', refreshToken, {
                httpOnly: true,
                sameSite: 'lax',
                secure: false,
                maxAge: 7 * 24 * 60 * 60 * 1000
            })
            .status(200)
            .json(new ApiResponse(200, { user }, 'Wallet connected'));
    } catch (error) {
        next(error);
    }
};


