const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        unique: true,
        sparse: true, // This allows null/undefined values and maintains uniqueness for non-null values
    },
    username: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'courier'],
        default: 'customer',
    },
    avatar: {
        type: String,
        default: null,
    },
    address: {
        city: {
            type: String,
            default: null,
        },
        country: {
            type: String,
            default: null,
        },
        state: {
            type: String,
            default: null,
        },
        zipcode: {
            type: String,
            default: null,
        },
    },
    phone: {
        type: String,
        default: null,
    },

    // Courier information nested in a single object
    courier: {
        applicationStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: null,
        },
        applicationDate: {
            type: Date,
            default: null,
        },
        approvalDate: {
            type: Date,
            default: null,
        },
        isAvailable: {
            type: Boolean,
            default: false,
        },
        vehicleInfo: {
            type: String,
            default: null,
        },
        serviceArea: {
            country: {
                type: String,
                default: null,
            },
            city: {
                type: String,
                default: null,
            },
        },
        validId: {
            type: String,
            default: null,
        },
    }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare passwords during login
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
