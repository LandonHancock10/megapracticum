const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    tenant: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    uvuId: { type: String, required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);
