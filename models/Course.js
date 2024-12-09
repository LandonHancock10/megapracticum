const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    tenant: { type: String, required: true },
    display: { type: String, required: true }
});

module.exports = mongoose.model('Course', CourseSchema);
