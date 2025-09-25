
import mongoose,{Schema} from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new Schema(
    {
        _id: {
            // Use wallet address as the primary key
            type: String,
            required: true,
            trim: true
        },
        walletAddress: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        marketplaces: [{
            type: Schema.Types.ObjectId,
            ref: 'Marketplace', 
          }],
        banned: {
            type: Boolean,
            default: false
        },
        points: {
            type: Number,
            default: 0,
            min: 0
        },
        refreshToken: {
            type: String,
            default: null
        },
        accessToken: {
            type: String,
            default: null
        }
    },
    { timestamps: true}
);

// Ensure walletAddress mirrors _id for convenience
UserSchema.pre('validate', function(next) {
    if (!this._id && this.walletAddress) {
        this._id = this.walletAddress;
    }
    if (!this.walletAddress && this._id) {
        this.walletAddress = this._id;
    }
    next();
});

export const User = mongoose.model('User', UserSchema);




