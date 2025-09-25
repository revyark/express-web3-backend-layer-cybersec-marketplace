import jwt from 'jsonwebtoken';
import { Marketplace } from '../models/marketplace.model.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getPinataFileUrl, deleteFromPinata } from '../utils/pinata.js';

export const createMarketplace = async (req, res, next) => {
    try {
        const { name, marketplaceUrl, category, tags = [], imageHash, description = '' } = req.body;

        if (!name || !marketplaceUrl || !category || !imageHash) {
            throw new ApiError(400, 'name, marketplaceUrl, category, and imageHash are required');
        }

        // Read access token from cookie
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

        const creator = await User.findById(walletHash);
        if (!creator) {
            throw new ApiError(404, 'User not found');
        }

        const marketplace = await Marketplace.create({
            name,
            marketplaceUrl,
            category,
            tags,
            imageHash,
            description,
            createdByWalletHash: walletHash
        });

        // Link to user
        creator.marketplaces.push(marketplace._id);
        await creator.save();

        return res.status(201).json(new ApiResponse(201, { marketplace }, 'Marketplace created'));
    } catch (error) {
        next(error);
    }
};

export const getAllMarketplaces = async (req, res, next) => {
    try {
        const marketplaces = await Marketplace.find({}).sort({ createdAt: -1 });
        
        // Add IPFS URLs to each marketplace
        const marketplacesWithUrls = await Promise.all(
            marketplaces.map(async (marketplace) => {
                try {
                    const ipfsUrl = await getPinataFileUrl(marketplace.imageHash);
                    return {
                        ...marketplace.toObject(),
                        imageUrl: ipfsUrl
                    };
                } catch (error) {
                    console.error(`Error getting IPFS URL for marketplace ${marketplace._id}:`, error);
                    return {
                        ...marketplace.toObject(),
                        imageUrl: null
                    };
                }
            })
        );
        
        return res.status(200).json(new ApiResponse(200, { marketplaces: marketplacesWithUrls }, 'All marketplaces fetched'));
    } catch (error) {
        next(error);
    }
};

export const getMyMarketplaces = async (req, res, next) => {
    try {
        // Auth from cookie or bearer
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

        const marketplaces = await Marketplace.find({ createdByWalletHash: walletHash }).sort({ createdAt: -1 });
        
        // Add IPFS URLs to each marketplace
        const marketplacesWithUrls = await Promise.all(
            marketplaces.map(async (marketplace) => {
                try {
                    const ipfsUrl = await getPinataFileUrl(marketplace.imageHash);
                    return {
                        ...marketplace.toObject(),
                        imageUrl: ipfsUrl
                    };
                } catch (error) {
                    console.error(`Error getting IPFS URL for marketplace ${marketplace._id}:`, error);
                    return {
                        ...marketplace.toObject(),
                        imageUrl: null
                    };
                }
            })
        );
        
        return res.status(200).json(new ApiResponse(200, { marketplaces: marketplacesWithUrls }, 'My marketplaces fetched'));
    } catch (error) {
        next(error);
    }
};

export const discardMarketplace = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new ApiError(400, 'Marketplace id is required');
        }

        // Auth from cookie or bearer
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

        const marketplace = await Marketplace.findById(id);
        if (!marketplace) {
            throw new ApiError(404, 'Marketplace not found');
        }

        if (marketplace.createdByWalletHash !== walletHash) {
            throw new ApiError(403, 'Not allowed to discard this marketplace');
        }

        // Delete image from Pinata before deleting marketplace
        let pinataDeleteSuccess = false;
        if (marketplace.imageHash) {
            try {
                console.log(`🗑️ Deleting image from Pinata for marketplace ${id}: ${marketplace.imageHash}`);
                pinataDeleteSuccess = await deleteFromPinata(marketplace.imageHash);
                if (pinataDeleteSuccess) {
                    console.log(`✅ Image successfully deleted from Pinata for marketplace ${id}`);
                } else {
                    console.log(`⚠️ Failed to delete image from Pinata for marketplace ${id}`);
                }
            } catch (error) {
                console.error(`❌ Error deleting image from Pinata for marketplace ${id}:`, error);
                // Continue with marketplace deletion even if Pinata deletion fails
            }
        }

        // Delete marketplace from database
        await Marketplace.deleteOne({ _id: id });

        // unlink from user
        await User.updateOne({ _id: walletHash }, { $pull: { marketplaces: id } });

        return res.status(200).json(new ApiResponse(200, { 
            id, 
            pinataImageDeleted: pinataDeleteSuccess,
            message: pinataDeleteSuccess ? 'Marketplace and image discarded' : 'Marketplace discarded (image deletion may have failed)'
        }, 'Marketplace discarded'));
    } catch (error) {
        next(error);
    }
};


