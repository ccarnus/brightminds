const mongoose = require('mongoose');

const topicSchema = mongoose.Schema({
  name: { type: String, required: true },
  departmentName: { type: String, required: true },
  articleCount: { type: Number, default: 0 },
  castCount: { type: Number, default: 0 },
  articleIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  castIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cast' }],
});

module.exports = mongoose.model('Topic', topicSchema);
