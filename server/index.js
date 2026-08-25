require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

async function startServer() {
  try {
    await client.connect();
    db = client.db('election_db');
    console.log("Connected to MongoDB");
    
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (err) {
    console.error("Could not connect to MongoDB", err);
    process.exit(1);
  }
}

startServer();

// API Routes
app.get('/api/applications/stats', async (req, res) => {
  try {
    const total = await db.collection('applications').countDocuments();
    const approved = await db.collection('applications').countDocuments({ status: 'approved' });
    const pending = await db.collection('applications').countDocuments({ status: 'pending' });
    const rejected = await db.collection('applications').countDocuments({ status: 'rejected' });

    res.json({
      total,
      approved,
      pending,
      rejected
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    const { name, phone, department, graduationYear, dob, gender, previousRole, email, password } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required for registration.' });
    }

    // Check if the user is a registered alumni
    const alumniMember = await db.collection('members').findOne({
      $or: [
        { 'basic.email_id': email },
        { 'basic.alternate_email_id': email }
      ]
    });

    if (!alumniMember) {
      return res.status(403).json({ error: 'You are not a registered alumni. Registration denied.' });
    }

    // Verify Date of Birth
    const dbDob = alumniMember.basic?.dateofbirth;
    if (!dbDob) {
      return res.status(403).json({ error: 'Alumni record does not have a Date of Birth. Please contact admin.' });
    }
    const reqDob = new Date(dob);
    const dbDobDate = new Date(dbDob);
    if (
      reqDob.getUTCFullYear() !== dbDobDate.getUTCFullYear() ||
      reqDob.getUTCMonth() !== dbDobDate.getUTCMonth() ||
      reqDob.getUTCDate() !== dbDobDate.getUTCDate()
    ) {
      return res.status(403).json({ error: 'The provided Date of Birth does not match the alumni records.' });
    }

    // Verify Graduation Year (Passout date)
    const hasMatchingGradYear = alumniMember.education_details?.some(
      (ed) => String(ed.end_year) === String(graduationYear)
    );
    if (!hasMatchingGradYear) {
      return res.status(403).json({ error: 'The provided Graduation Year does not match the alumni records.' });
    }

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = {
      name,
      phone,
      department,
      graduationYear,
      dob,
      gender,
      previousRole,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    await db.collection('users').insertOne(newUser);
    
    // Return user without password
    delete newUser.password;
    res.status(201).json(newUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Return user without password
    delete user.password;
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/applications', async (req, res) => {
  try {
    const { applicantEmail, name, department, graduationYear, phone, targetPositions, previousRoles, roleDurations, motivation } = req.body;
    
    const newApplication = {
      applicantEmail,
      name,
      department,
      graduationYear,
      phone,
      targetPositions,
      previousRoles,
      roleDurations,
      motivation,
      status: 'pending',
      submittedAt: new Date()
    };

    const result = await db.collection('applications').insertOne(newApplication);
    res.status(201).json({ ...newApplication, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

app.get('/api/applications', async (req, res) => {
  try {
    const statusFilter = req.query.status;
    const emailFilter = req.query.email;
    let query = {};
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }
    if (emailFilter) {
      query.applicantEmail = emailFilter;
    }
    
    const applications = await db.collection('applications').find(query).sort({ submittedAt: -1 }).toArray();
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

app.patch('/api/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.collection('applications').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ success: true, message: `Application ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});
