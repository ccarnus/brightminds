const mongoose = require('mongoose');

const articleSchema = mongoose.Schema({
    title: { type: String, required: true },
    department: { type: String, required: true },
    brightmindid: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    articleDescription: { type: String, required: true },
    articleimageurl: { type: String, required: true },
    university: { type: String, required: true },
    category: { type: String, required: true },
    visibility: { type: String, required: true },
    link: { type: String, required: false },
    duration: { type: Number, required: true },
    verificationStatus: {
        status: { type: String, required: false },
        approvals: { type: Number, required: false },
        approvers_id: [
            { type: String, required: false }
        ],
        disapprovers_id: [
            { type: String, required: false }
        ]
    },
    dateAdded: { type: Date, default: Date.now },
    grade: {
        value: { type: Number, min: 0, max: 10, default: 5 },
        count: { type: Number, default: 1 }
    },
    likes: {
        count: { type: Number, default: 0 },
        user: [
            { type: String, default: "" }
        ]
    },
    comments: {
        count: { type: Number, default: 0 },
        comment: [
            {
                author: { type: String, default: "" },
                content: { type: String, default: "" }
            }
        ]
    },
    evaluation: {
        question: { type: String, required: false },
        responses: [
            {
                type: String, required: false
            }
        ],
        correct: { type: String, required: false }
    }
});

module.exports = mongoose.model('Article', articleSchema);
