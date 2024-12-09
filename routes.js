const express = require('express');
const router = express.Router();
const Course = require('./models/Course');
const Log = require('./models/Log');

// Fetch courses for the tenant
router.get('/courses', async (req, res) => {
    if (!req.session.user) return res.status(401).send('Unauthorized');
    const tenant = req.session.user.tenant;
    try {
        const courses = await Course.find({ tenant });
        res.json(courses);
    } catch (error) {
        res.status(500).send('Error fetching courses');
    }
});

// Add a new course
router.post('/courses', async (req, res) => {
    if (!req.session.user) return res.status(401).send('Unauthorized');
    const tenant = req.session.user.tenant;
    const { display } = req.body;
    try {
        const newCourse = new Course({ tenant, display });
        await newCourse.save();
        res.status(201).send('Course added');
    } catch (error) {
        res.status(500).send('Error adding course');
    }
});

// Fetch logs for the tenant
router.get('/logs', async (req, res) => {
    if (!req.session.user) return res.status(401).send('Unauthorized');
    const tenant = req.session.user.tenant;
    const { courseId, uvuId } = req.query;
    try {
        const logs = await Log.find({ tenant, courseId, uvuId });
        res.json(logs);
    } catch (error) {
        res.status(500).send('Error fetching logs');
    }
});

// Add a new log
router.post('/logs', async (req, res) => {
    if (!req.session.user) return res.status(401).send('Unauthorized');
    const tenant = req.session.user.tenant;
    const { courseId, uvuId, text } = req.body;
    try {
        const newLog = new Log({ tenant, courseId, uvuId, text, date: new Date() });
        await newLog.save();
        res.status(201).send('Log added');
    } catch (error) {
        res.status(500).send('Error adding log');
    }
});

module.exports = router;
