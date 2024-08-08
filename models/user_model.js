const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    role: { 
        type: String, 
        required: true,
        enum: ['College Student', 'Professor', 'Researcher', 'Learning Enthusiast', 'PhD Student']
    },
    department: { type: String, required: false },
    university: { type: String, required: false },
    score: { type: Number, required: true, default: 0 },
    profilePictureUrl: { type: String, required: true },
    evaluation_list: [{
        contentid: { type: String, required: false },
        type: { type: String, required: false },
        watched: { type: Boolean, required: false },
        answered: { type: Boolean, required: false }
    }],
    bookmarked_elements: [{
        castId: { type: String, required: false }
    }],
    preferences: [{
        category: { type: String, required: true },
        weight: { type: Number, required: true },
        count: { type: Number, required: true, default: 0 }
    }],
    tracking: {
        objective: { type: String, default: "Explorer" },
        progress: { type: Number, default: 0 },
        target: { type: Number, default: 10 },
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
    },
    castPublications: [{ 
        type: mongoose.Schema.Types.ObjectId, ref: 'Cast' 
        }],
    articlePublications: [{ 
        type: mongoose.Schema.Types.ObjectId, ref: 'Article' 
    }]
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
