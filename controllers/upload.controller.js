import jwt from 'jsonwebtoken';
import { uploadToPinata, getPinataFileUrl, deleteFromPinata } from '../utils/pinata.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Upload image to Pinata IPFS
 * POST /api/upload/image
 */
export const uploadImage = async (req, res, next) => {
    try {
        // Check authentication
        const token = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
        if (!token) {
            throw new ApiError(401, 'Unauthorized');
        }

        let walletHash;
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            walletHash = decoded.sub;
        } catch (err) {
            throw new ApiError(401, 'Invalid or expired token');
        }

        // Check if file is provided
        if (!req.file) {
            throw new ApiError(400, 'No image file provided');
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            throw new ApiError(400, 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed');
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
            throw new ApiError(400, 'File size too large. Maximum size is 5MB');
        }

        // Prepare metadata
        const metadata = {
            name: req.file.originalname,
            description: `Image uploaded by user ${walletHash}`,
            keyvalues: {
                uploadedBy: walletHash,
                uploadDate: new Date().toISOString(),
                originalName: req.file.originalname
            }
        };

        // Upload to Pinata
        const uploadResult = await uploadToPinata(req.file, metadata);

        return res.status(200).json(new ApiResponse(200, {
            cid: uploadResult.cid,
            ipfsUrl: uploadResult.ipfsUrl,
            size: uploadResult.size,
            originalName: req.file.originalname
        }, 'Image uploaded successfully to IPFS'));

    } catch (error) {
        next(error);
    }
};

/**
 * Get presigned URL for direct upload (alternative approach)
 * GET /api/upload/presigned-url
 */
export const getPresignedUrl = async (req, res, next) => {
    try {
        // Check authentication
        const token = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
        if (!token) {
            throw new ApiError(401, 'Unauthorized');
        }

        let walletHash;
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            walletHash = decoded.sub;
        } catch (err) {
            throw new ApiError(401, 'Invalid or expired token');
        }

        // For now, return a simple response indicating the endpoint is ready
        // In a real implementation, you might want to generate a presigned URL
        // or return upload instructions
        return res.status(200).json(new ApiResponse(200, {
            message: 'Upload endpoint ready',
            uploadUrl: '/api/upload/image',
            maxFileSize: '5MB',
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        }, 'Presigned URL generated'));

    } catch (error) {
        next(error);
    }
};

/**
 * Get IPFS URL from CID
 * GET /api/upload/url/:cid
 */
export const getImageUrl = async (req, res, next) => {
    try {
        const { cid } = req.params;

        if (!cid) {
            throw new ApiError(400, 'CID is required');
        }

        const ipfsUrl = await getPinataFileUrl(cid);

        return res.status(200).json(new ApiResponse(200, {
            cid,
            ipfsUrl
        }, 'IPFS URL generated'));

    } catch (error) {
        next(error);
    }
};



