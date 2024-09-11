const mongoose = require('mongoose');

const topicSchema = mongoose.Schema({
    name: { type: String, required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    castsCount: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
});

module.exports = mongoose.model('Topic', topicSchema);
