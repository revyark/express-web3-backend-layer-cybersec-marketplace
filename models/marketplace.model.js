import mongoose,{Schema} from 'mongoose';
import jwt from 'jsonwebtoken';



// Subschema for a marketplace entry associated with a user
const marketplaceSchema = new Schema(
    {
        marketplaceUrl: {
            type: String,
            required: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            enum: ['NFTs', 'Defi', 'gaming', 'others'],
            required: true
        },
        tags: {
            type: [String],
            default: []
        },
        imageHash: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: ''
        },
        createdByWalletHash: {
            type: String,
            required: true,
            trim: true
        }
    },
    {timestamps: true }
);

export const Marketplace = mongoose.model('Marketplace', marketplaceSchema);




