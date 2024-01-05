const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const virtualLabSchema = mongoose.Schema({
    name: { type: String, required: true, unique: true },
    followers: [{
        userID: { type: String, required: true }
    }],
    members: [{
        brightmindsID: { type: String, required: true }
    }],
    topics: [{
        name: { type: String, required: true},
        gage: { type: Number, required: true, default: 0 },
        followers: [{
            userID: { type: String, required: true }
        }],
        members: [{
            brightmindsID: { type: String, required: true }
        }],
        threads: [{
            content: { type: String, required: true }
        }],
    }]
});

virtualLabSchema.plugin(uniqueValidator);

module.exports = mongoose.model('user', virtualLabSchema);