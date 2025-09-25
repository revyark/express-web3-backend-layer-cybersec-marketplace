import mongoose, { Schema } from 'mongoose';

const dismissedSchema = new Schema(
    {
        reportId: {
            type: Number,
            required: true,
            unique: true
        }
    },
    { timestamps: true }
);

export const Dismissed = mongoose.model('Dismissed', dismissedSchema);
