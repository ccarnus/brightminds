const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    score: { type: Number, required: true },
    profilePictureUrl: { type: String, required: true },
    evaluation_list: [{
        contentid: { type: String, required: false },
        type: {type: String, required: false},
        watched: { type: Boolean, required: false },
        answered: { type: Boolean, required: false }
    }],
    bookmarked_elements: [{
        castId: { type: String, required: false }
    }],
    preferences: [{
        category: { type: String, required: true },
        weight: { type: Number, required: true }
    }],
    tracking: {
        objective: { type: String, default: "Explorer" },
        progress: { type: Number, default: 0 },
        history: [{
            category: { type: String, required: true },
            count: { type: Number, default: 0 }
        }]
    },
    virtual_labs: {
        member: [{
            labId: { type: String, required: false }
        }],
        follower: [{
            labId: { type: String, required: false }
        }]
    }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('user', userSchema);