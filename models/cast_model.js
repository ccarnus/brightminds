const mongoose = require('mongoose');

const castSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: false },
    department: { type: String, required: true },
    brightmindid: { type: String, required: true },
    casturl: { type: String, required: true },
    castimageurl: { type: String, required: false },
    university: { type: String, required: true },
    category: { type: String, required: true },
    visibility: { type: String, required: true },
    link: { type: String, required: false },
    duration: { type: Number, required: false },
    dateadded: { type: Date, default: Date.now },
    rating: {
        value: { type: Number, min: 0, max: 10, default: 5 },
        count: { type: Number, default: 1 }
    },
    evaluation: {
        question: { type: String, required: false },
        responses: [{ type: String, required: false }],
        correct: { type: String, required: false }
    },
    topic: { type: String, required: true },
});

module.exports = mongoose.model('Cast', castSchema);
