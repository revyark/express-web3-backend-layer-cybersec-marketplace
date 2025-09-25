import { Router } from 'express';
import multer from 'multer';
import { uploadImage, getPresignedUrl, getImageUrl } from '../controllers/upload.controller.js';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed'), false);
        }
    }
});

// Routes
router.get('/ping', (req, res) => {
    res.status(200).json({ ok: true, route: 'upload', message: 'upload router mounted' });
});

// Upload image to Pinata
router.post('/image', upload.single('image'), uploadImage);

// Get presigned URL (for direct upload approach)
router.get('/presigned-url', getPresignedUrl);

// Get IPFS URL from CID
router.get('/url/:cid', getImageUrl);

export default router;
