const mongoose = require('mongoose');

const topicSchema = mongoose.Schema({
    name: { type: String, required: true },
    departmentName: { type: String, required: true },
    contentCount: { type: Number, default: 0 },
    content_ids: [{ type: String, required: false }],
});

module.exports = mongoose.model('Topic', topicSchema);
