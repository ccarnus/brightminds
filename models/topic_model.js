const mongoose = require('mongoose');

const topicSchema = mongoose.Schema({
  name: { type: String, required: true },
  departmentName: { type: String, required: true },
  articleCount: { type: Number, default: 0 },
  castCount: { type: Number, default: 0 },
  articleIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  castIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cast' }],
  openalexID: { type: String, required: false },
  activity: { type: Number, default: 0 },
  impact: { type: Number, default: 0 },
});

module.exports = mongoose.model('Topic', topicSchema);
