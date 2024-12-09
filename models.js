const mongoose = require('mongoose');

// USER MODEL
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'TA', 'student'], required: true },
    tenant: { type: String, enum: ['UVU', 'UofU'], required: true },
    numericId: { type: String } // 8-digit numeric ID for students (and possibly others)
});
const User = mongoose.model('User', userSchema);

// COURSE MODEL
// Teachers and TAs remain references. Students are stored as numericIds (strings).
const courseSchema = new mongoose.Schema({
    tenant: { type: String, required: true },
    display: { type: String, required: true },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    TAs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    students: [{ type: String }] // store numeric IDs as strings
});
const Course = mongoose.model('Course', courseSchema);

// LOG MODEL
// uvuId is now always a numeric ID string (for both tenants).
const logSchema = new mongoose.Schema({
    tenant: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    uvuId: { type: String, required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
});
const Log = mongoose.model('Log', logSchema);

module.exports = { User, Course, Log };
