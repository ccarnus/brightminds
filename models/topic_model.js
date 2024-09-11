const mongoose = require('mongoose');

const topicSchema = mongoose.Schema({
    name: { type: String, required: true },
    departmentName: { type: String, required: true },
    castsCount: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
});

module.exports = mongoose.model('Topic', topicSchema);
