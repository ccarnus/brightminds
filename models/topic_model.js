const mongoose = require('mongoose');

const topicSchema = mongoose.Schema({
    name: { type: String, required: true },
    departmentName: { type: String, required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, required: false },
});

module.exports = mongoose.model('Topic', topicSchema);
