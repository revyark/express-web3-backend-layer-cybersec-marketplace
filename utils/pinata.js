import { PinataSDK } from 'pinata';
import { ApiError } from './ApiError.js';

// Initialize Pinata SDK
const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud'
});

/**
 * Upload file to Pinata IPFS
 * @param {File} file - The file to upload
 * @param {Object} metadata - Optional metadata for the file
 * @returns {Promise<Object>} - Upload result with CID and IPFS URL
 */
export const uploadToPinata = async (file, metadata = {}) => {
    try {
        if (!file) {
            throw new ApiError(400, 'No file provided for upload');
        }

        if (!process.env.PINATA_JWT) {
            throw new ApiError(500, 'Pinata JWT not configured');
        }

        // Upload file to Pinata
        const uploadResult = await pinata.upload.public.file(file);

        if (!uploadResult.cid) {
            throw new ApiError(500, 'Failed to upload file to Pinata');
        }

        // Generate IPFS URL
        const ipfsUrl = await pinata.gateways.public.convert(uploadResult.cid);

        return {
            cid: uploadResult.cid,
            ipfsUrl: ipfsUrl,
            size: uploadResult.size,
            timestamp: uploadResult.timestamp
        };
    } catch (error) {
        console.error('Pinata upload error:', error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, `Failed to upload to Pinata: ${error.message}`);
    }
};

/**
 * Get file from Pinata IPFS using CID
 * @param {string} cid - The content identifier
 * @returns {Promise<string>} - IPFS URL for the file
 */
export const getPinataFileUrl = async (cid) => {
    try {
        if (!cid) {
            throw new ApiError(400, 'CID is required');
        }

        const ipfsUrl = await pinata.gateways.public.convert(cid);
        return ipfsUrl;
    } catch (error) {
        console.error('Pinata URL generation error:', error);
        throw new ApiError(500, `Failed to generate IPFS URL: ${error.message}`);
    }
};

/**
 * Delete (unpin) file from Pinata
 * @param {string} cid - The content identifier to unpin
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFromPinata = async (cid) => {
    try {
        if (!cid) {
            throw new ApiError(400, 'CID is required');
        }

        if (!process.env.PINATA_JWT) {
            throw new ApiError(500, 'Pinata JWT not configured');
        }

        console.log(`🗑️ Attempting to unpin CID from Pinata: ${cid}`);

        // Use Pinata's unpin API endpoint
        const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${process.env.PINATA_JWT}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.text();
            console.log(`✅ Successfully unpinned CID from Pinata: ${cid}`);
            console.log(`📄 Response: ${result}`);
            return true;
        } else {
            const errorText = await response.text();
            console.error(`❌ Failed to unpin CID from Pinata: ${cid}`);
            console.error(`📄 Error response: ${errorText}`);
            console.error(`📊 Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('Pinata unpin error:', error);
        // Don't throw error - just log it, as the marketplace should still be deleted
        console.log(`⚠️ Failed to unpin CID from Pinata: ${cid} - Error: ${error.message}`);
        return false;
    }
};

export { pinata };
