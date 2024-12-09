const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'TA', 'student'], required: true },
    tenant: { type: String, enum: ['UVU', 'UofU'], required: true }
});

module.exports = mongoose.model('User', userSchema);
