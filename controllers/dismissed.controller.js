import { Dismissed } from '../models/dismissed.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const createDismissed = async (req, res, next) => {
    try {
        const { reportId } = req.body;

        if (reportId === undefined || reportId === null || typeof reportId !== 'number') {
            throw new ApiError(400, 'reportId is required and must be a number');
        }

        if (!Number.isInteger(reportId) || reportId <= 0) {
            throw new ApiError(400, 'reportId must be a positive integer');
        }

        // Check if already dismissed
        const existingDismissed = await Dismissed.findOne({ reportId });
        if (existingDismissed) {
            throw new ApiError(409, 'Report already dismissed');
        }

        const dismissed = await Dismissed.create({ reportId });

        return res.status(201).json(new ApiResponse(201, { dismissed }, 'Report dismissed successfully'));
    } catch (error) {
        next(error);
    }
};
