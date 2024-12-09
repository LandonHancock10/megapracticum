require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { User, Course, Log } = require('./models');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI, { retryWrites: true, w: 'majority' })
    .then(async () => {
        console.log('Connected to MongoDB');
        await seedAdmins();
    })
    .catch(err => console.error('MongoDB connection error:', err));

async function seedAdmins() {
    let rootUVU = await User.findOne({ username: 'root_uvu' });
    if (!rootUVU) {
        const hash = await bcrypt.hash('willy', 10);
        await User.create({
            username: 'root_uvu',
            password: hash,
            role: 'admin',
            tenant: 'UVU',
            numericId: '00000000'
        });
        console.log('Created root_uvu admin user');
    }

    let rootUofU = await User.findOne({ username: 'root_uofu' });
    if (!rootUofU) {
        const hash = await bcrypt.hash('swoopy', 10);
        await User.create({
            username: 'root_uofu',
            password: hash,
            role: 'admin',
            tenant: 'UofU',
            numericId: '00000001'
        });
        console.log('Created root_uofu admin user');
    }
}

// Utility functions
function ensureAuth(req, res, next) {
    if (!req.session.user) return res.redirect('/auth/login');
    next();
}

function ensureTenant(tenant) {
    return (req, res, next) => {
        if (!req.session.user || req.session.user.tenant.toLowerCase() !== tenant) {
            return res.status(403).send('Forbidden');
        }
        next();
    };
}

function ensureRole(role) {
    return (req, res, next) => {
        if (!req.session.user || req.session.user.role !== role) return res.status(403).send('Forbidden');
        next();
    };
}

function sameTenant(t1, t2) {
    return t1 && t2 && t1.toLowerCase() === t2.toLowerCase();
}

function canCreateRole(currentRole, targetRole) {
    if (currentRole === 'admin') return ['teacher', 'TA', 'student'].includes(targetRole);
    if (currentRole === 'teacher') return ['TA', 'student'].includes(targetRole);
    if (currentRole === 'TA') return ['student'].includes(targetRole);
    return false;
}

// Auth Routes
app.get('/auth/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send('Invalid credentials');
        }
        req.session.user = user;
        return res.redirect(`/${user.tenant.toLowerCase()}/${user.role}`);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal server error');
    }
});

app.get('/auth/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.post('/auth/signup', async (req, res) => {
    const { username, password, role, tenant, numericId } = req.body;
    if (role !== 'student') {
        return res.status(403).send('You can only sign up as a student here.');
    }
    if (!/^\d{8}$/.test(numericId)) {
        return res.status(400).send('Invalid student ID. Must be 8 digits.');
    }

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash, role, tenant, numericId });
    await user.save();
    req.session.user = user;
    return res.redirect(`/${tenant.toLowerCase()}/${role}`);
});

app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
});

// /api/me route
app.get('/api/me', (req, res) => {
    if (!req.session.user) return res.status(401).send('Unauthorized');
    res.json(req.session.user);
});

// New route: All courses for the tenant
app.get('/api/all-courses', ensureAuth, async (req, res) => {
    const { tenant } = req.session.user;
    try {
        const allCourses = await Course.find({ tenant });
        res.json(allCourses);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching all courses');
    }
});

// Tenant/Role Pages
app.get('/uvu/admin', ensureAuth, ensureTenant('uvu'), ensureRole('admin'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});
app.get('/uofu/admin', ensureAuth, ensureTenant('uofu'), ensureRole('admin'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/uvu/teacher', ensureAuth, ensureTenant('uvu'), ensureRole('teacher'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'teacher.html'));
});
app.get('/uofu/teacher', ensureAuth, ensureTenant('uofu'), ensureRole('teacher'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'teacher.html'));
});

app.get('/uvu/ta', ensureAuth, ensureTenant('uvu'), ensureRole('TA'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'ta.html'));
});
app.get('/uofu/ta', ensureAuth, ensureTenant('uofu'), ensureRole('TA'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'ta.html'));
});

app.get('/uvu/student', ensureAuth, ensureTenant('uvu'), ensureRole('student'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'student.html'));
});
app.get('/uofu/student', ensureAuth, ensureTenant('uofu'), ensureRole('student'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'student.html'));
});

// Create user route
app.post('/create-user', ensureAuth, async (req, res) => {
    const { username, password, role, numericId } = req.body;
    const currentUser = req.session.user;
    const allowed = canCreateRole(currentUser.role, role);
    if (!allowed) return res.status(403).send('Forbidden');

    if (role === 'student') {
        if (!/^\d{8}$/.test(numericId)) {
            return res.status(400).send('Invalid student ID. Must be 8 digits.');
        }
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({
        username,
        password: hash,
        role,
        tenant: currentUser.tenant,
        numericId: numericId || '00000000'
    });

    await newUser.save();
    res.send('User created successfully');
});

// Courses and logs
app.get('/api/courses', ensureAuth, async (req, res) => {
    const { tenant, role, _id, numericId } = req.session.user;
    try {
        let query = { tenant };
        if (role === 'student') {
            query.students = numericId;
        }
        if (role === 'TA') query.TAs = _id;
        if (role === 'teacher') query.teachers = _id;

        const courses = await Course.find(query);
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching courses');
    }
});

app.post('/api/courses', ensureAuth, async (req, res) => {
    const { tenant, role, _id } = req.session.user;
    const { display } = req.body;
    if (!['admin', 'teacher'].includes(role)) return res.status(403).send('Forbidden');

    try {
        const course = new Course({
            tenant,
            display,
            teachers: role === 'teacher' ? [_id] : []
        });
        await course.save();
        res.status(201).send('Course added');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding course');
    }
});

app.post('/api/courses/:courseId/add-student', ensureAuth, async (req, res) => {
    const { role, tenant, numericId, _id } = req.session.user;
    const { studentId } = req.body; 
    const { courseId } = req.params;

    try {
        const course = await Course.findById(courseId);
        if (!course || !sameTenant(course.tenant, tenant)) return res.status(404).send('Course not found');

        let canAdd = false;
        if (role === 'admin') canAdd = true;
        if (role === 'teacher' && course.teachers.includes(_id)) canAdd = true;
        if (role === 'TA' && course.TAs.includes(_id)) canAdd = true;
        if (role === 'student' && (!studentId || studentId === numericId)) canAdd = true;

        if (!canAdd) return res.status(403).send('Forbidden');

        if (!/^\d{8}$/.test(studentId) && role !== 'student') {
            return res.status(400).send('Invalid student ID. Must be 8 digits.');
        }

        if (!course.students.includes(studentId)) {
            course.students.push(studentId);
            await course.save();
        }

        res.send('Student added to course');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding student to course');
    }
});

app.get('/api/logs', ensureAuth, async (req, res) => {
    const { tenant, role, _id, numericId } = req.session.user;
    const { courseId } = req.query;

    try {
        const course = await Course.findById(courseId);
        if (!course || !sameTenant(course.tenant, tenant)) return res.status(404).send('Course not found');

        if (role === 'teacher' && !course.teachers.includes(_id)) return res.status(403).send('Forbidden');
        if (role === 'TA' && !course.TAs.includes(_id)) return res.status(403).send('Forbidden');
        if (role === 'student' && !course.students.includes(numericId)) return res.status(403).send('Forbidden');
        // admin allowed

        const logs = await Log.find({ tenant, courseId });
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching logs');
    }
});

app.post('/api/logs', ensureAuth, async (req, res) => {
    const { tenant, role, numericId, _id } = req.session.user;
    const { courseId, text, uvuId } = req.body;

    try {
        const course = await Course.findById(courseId);
        if (!course || !sameTenant(course.tenant, tenant)) return res.status(404).send('Course not found');

        if (!/^\d{8}$/.test(uvuId)) {
            return res.status(400).send('uvuId must be an 8-digit student ID');
        }

        let canAddLog = false;
        if (role === 'admin') {
            canAddLog = course.students.includes(uvuId);
        }
        if (role === 'teacher' && course.teachers.includes(_id)) {
            canAddLog = course.students.includes(uvuId);
        }
        if (role === 'TA' && course.TAs.includes(_id)) {
            canAddLog = course.students.includes(uvuId);
        }
        if (role === 'student' && uvuId === numericId && course.students.includes(numericId)) {
            canAddLog = true;
        }

        if (!canAddLog) return res.status(403).send('Forbidden');

        const newLog = new Log({ tenant, courseId, uvuId, text, date: new Date() });
        await newLog.save();
        res.status(201).send('Log added');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding log');
    }
});

app.get('/', (req, res) => res.redirect('/auth/login'));

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
