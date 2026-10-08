const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const { 
  generateElectionAnnouncementEmail, 
  generateSeconderConsentEmail, 
  generateSeconderConfirmationPage,
  generateNomineeConsentEmail,
  generateNomineeConfirmationPage,
  generateVotingReminderEmail,
  generateVotingLiveEmail,
  generateVoteConfirmationEmail,
  generateScrutinyApprovalEmail,
  generateCandidatesPublishedEmail
} = require('./electionEmailTemplate');

const app = express();
const port = process.env.PORT || 5000;

function createMailTransporter(customPass, customUser) {
  const smtpUser = (customUser || process.env.SMTP_USER || 'muralisubbu11@gmail.com').trim();
  const smtpPass = (customPass || process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');

  if (!smtpPass) {
    throw new Error(`Gmail App Password is required to send live emails from ${smtpUser}.`);
  }

  return {
    transporter: nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    }),
    smtpUser,
    senderAddress: process.env.SMTP_FROM || `"Alumni Election Commission" <${smtpUser}>`
  };
}

/**
 * Resolves a nominee photo to a direct public HTTPS hosted URL.
 * Hosting the photo as a public HTTPS URL ensures that Gmail and other email clients
 * render it strictly inline inside the email body WITHOUT displaying separate attachment chips,
 * "noname" pills, or downloadable attachment preview boxes at the bottom of the email.
 */
async function resolveNomineePhotoUrl(photoDataUrl) {
  if (!photoDataUrl) return null;
  if (photoDataUrl.startsWith('http://') || photoDataUrl.startsWith('https://')) {
    return photoDataUrl;
  }
  
  try {
    const result = await cloudinary.uploader.upload(photoDataUrl, {
      folder: 'election_nominees',
      resource_type: 'image'
    });
    console.log(`[PhotoHost] Nominee photo hosted at: ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.warn("[PhotoHost] Could not upload photo to Cloudinary:", err.message);
  }
  return null;
}

/**
 * Converts a base64 data URL to a nodemailer CID inline attachment (fallback).
 * @param {string|null} dataUrl  - e.g. "data:image/jpeg;base64,/9j/..."
 * @param {string} cid           - Content-ID used in HTML as <img src="cid:xxx">
 * @returns {{ cidUrl: string, attachment: object }|null}
 */
function buildPhotoAttachment(dataUrl, cid = 'nominee-photo') {
  if (!dataUrl) return null;
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return {
      cidUrl: dataUrl,
      attachment: null
    };
  }
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return null;
  const [, mimeType, base64Data] = matches;
  return {
    cidUrl: `cid:${cid}`,
    attachment: {
      filename: false,
      content: Buffer.from(base64Data, 'base64'),
      contentType: mimeType,
      cid,
      contentDisposition: 'inline'
    }
  };
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

// Security & RBAC Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'ems_super_secret_jwt_key_2026_alumni_system';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Murali Subbiah M';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'muralisubbu11@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Kuttyamma@79';

// Auto-provision designated administrator account on database connection
async function provisionAdminAccount() {
  try {
    const existingAdmin = await db.collection('users').findOne({ email: ADMIN_EMAIL });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    if (!existingAdmin) {
      await db.collection('users').insertOne({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
        department: 'CSE',
        graduationYear: '2028',
        phone: '+91-9876543210',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`[RBAC] Designated admin account provisioned: ${ADMIN_EMAIL}`);
    } else {
      await db.collection('users').updateOne(
        { email: ADMIN_EMAIL },
        {
          $set: {
            name: ADMIN_NAME,
            role: 'admin',
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );
      console.log(`[RBAC] Designated admin account verified & synced: ${ADMIN_EMAIL}`);
    }
  } catch (err) {
    console.error("[RBAC] Error provisioning admin account:", err);
  }
}

// Authentication & Role-Based Middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No session token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.collection('users').findOne({ email: decoded.email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Authenticated user account not found.' });
    }
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email.toLowerCase(),
      role: user.email.toLowerCase() === ADMIN_EMAIL ? 'admin' : (user.role || 'alumni'),
      department: user.department,
      graduationYear: user.graduationYear,
      phone: user.phone
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token.' });
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.collection('users').findOne({ email: decoded.email.toLowerCase() });
    if (user) {
      req.user = {
        _id: user._id,
        name: user.name,
        email: user.email.toLowerCase(),
        role: user.email.toLowerCase() === ADMIN_EMAIL ? 'admin' : (user.role || 'alumni'),
        department: user.department,
        graduationYear: user.graduationYear,
        phone: user.phone
      };
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
  }
  next();
}

async function startServer() {
  let retries = 5;
  while (retries > 0) {
    try {
      await client.connect();
      db = client.db('election_db');
      console.log("Connected to MongoDB");

      // Initialize designated administrator account
      await provisionAdminAccount();

      app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
      });
      return;
    } catch (err) {
      retries--;
      console.error(`Could not connect to MongoDB (${retries} retries left):`, err.message);
      if (retries === 0) {
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, 2000));
    }
  }
}

startServer();

// API Routes
app.get('/api/applications/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const total = await db.collection('applications').countDocuments();
    const approved = await db.collection('applications').countDocuments({ status: 'approved', withdrawn: { $ne: true } });
    const pending = await db.collection('applications').countDocuments({ status: 'pending', withdrawn: { $ne: true } });
    const rejected = await db.collection('applications').countDocuments({ status: 'rejected' });
    const withdrawn = await db.collection('applications').countDocuments({ $or: [{ status: 'withdrawn' }, { withdrawn: true }] });

    res.json({
      total,
      approved,
      pending,
      rejected,
      withdrawn
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Election Announcement & Timeline Model
const DEFAULT_ANNOUNCEMENT = {
  notificationNumber: "AA/ELEC/2026/01",
  title: "Official Notification: Alumni Association Office Bearer Elections 2026",
  description: "In accordance with the Alumni Association Constitution, nominations are hereby called for the forthcoming AGM. Notification is formally published via the official Alumni portal at least one month prior to the AGM.",
  publishedVia: "Official Alumni Website Portal",
  status: "published",
  electionYear: "2026",
  electionDate: "2026-10-25",
  electionStartTime: "10:00 AM",
  electionEndTime: "04:00 PM",
  agmDate: "2026-10-25T10:00:00.000Z",
  nominationStartDate: "2026-09-12T00:00:00.000Z",
  nominationDeadline: "2026-09-30T23:59:59.000Z",
  scrutinyMeetingDate: "2026-10-05T14:00:00.000Z",
  withdrawalDeadline: "2026-10-14T17:00:00.000Z",
  finalListDate: "2026-10-18T10:00:00.000Z",
  votingDateTime: "2026-10-25T10:00:00.000Z",
  contactInfo: "",
  emailSubject: "OFFICIAL NOTIFICATION: Alumni Association Office Bearer Elections 2026 – Call for Nominations [Ref: AA/ELEC/2026/01]",
  emailIntro: "Notice is hereby formally given to all registered alumni members regarding the Alumni Association General Election for Executive Office Bearers for the 2026–2028 tenure.",
  emailBody: "In accordance with the Alumni Association Constitution, nominations are hereby called for the forthcoming AGM. Notification is formally published via the official Alumni portal at least one month prior to the AGM.",
  emailCustomNotes: "",
  emailSignOffAuthorized: "Alumni Election Commission",
  emailSignOffApproved: "Patron & Principal",
  scrutinyCommittee: [
    { designation: "Principal / Patron", role: "Committee Head" },
    { designation: "Alumni Coordinator & Election Convener", role: "Convener" },
    { designation: "Incumbent President", role: "Office Bearer Member" },
    { designation: "Incumbent Secretary", role: "Office Bearer Member" }
  ],
  rules: [
    "Call for nominations announced at least one month prior to AGM.",
    "Notification published via official Alumni website.",
    "President candidate must have served as an Office Bearer during the immediate preceding 5 years.",
    "Candidates must be registered alumni with at least 1 year continuous active service without gap in the past 5 years.",
    "Candidates must have held additional responsibilities (Office Bearer, Chapter Coordinator, Club Coordinator, Mentorship/Placement, Data Management).",
    "Each nomination must be proposed and seconded by eligible members with a detailed Purpose Statement.",
    "Scrutiny committee decision is final and binding.",
    "Final list published after scrutiny with a withdrawal window provided."
  ]
};

// Fetch Election Announcement
// Admin sees draft or published; Alumni/Public only sees published announcements
app.get('/api/elections/announcement', optionalAuth, async (req, res) => {
  try {
    const announcement = await db.collection('announcements').findOne({}, { sort: { updatedAt: -1 } });
    const isAdmin = req.user && req.user.role === 'admin';

    if (announcement) {
      if (!isAdmin && announcement.status !== 'published') {
        return res.json({
          published: false,
          message: 'No election announcement is currently published.',
          announcement: null
        });
      }
      return res.json({
        published: announcement.status === 'published',
        announcement: {
          ...DEFAULT_ANNOUNCEMENT,
          ...announcement
        }
      });
    } else {
      if (!isAdmin && DEFAULT_ANNOUNCEMENT.status !== 'published') {
        return res.json({
          published: false,
          message: 'No election announcement is currently published.',
          announcement: null
        });
      }
      return res.json({
        published: DEFAULT_ANNOUNCEMENT.status === 'published',
        announcement: DEFAULT_ANNOUNCEMENT
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// Admin Only: Create or Update Election Announcement
app.post('/api/elections/announcement', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      status: req.body.status || 'published',
      updatedAt: new Date(),
      updatedBy: req.user.email
    };
    await db.collection('announcements').updateOne(
      {},
      { $set: updateData },
      { upsert: true }
    );
    res.json({ success: true, message: "Election announcement updated successfully", data: updateData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Admin Only: Delete / Reset Announcement
app.delete('/api/elections/announcement', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.collection('announcements').deleteMany({});
    res.json({ success: true, message: "Election announcement deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// Admin Only: Send Announcement / Call for Nominations to All Alumni or a Single Person
app.post('/api/elections/announcement/send-email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rawAnnouncement = await db.collection('announcements').findOne({}, { sort: { updatedAt: -1 } });
    const announcement = {
      ...DEFAULT_ANNOUNCEMENT,
      ...(rawAnnouncement || {}),
      ...(req.body?.announcementOverrides || {}),
      ...(req.body?.emailSubject ? { emailSubject: req.body.emailSubject } : {}),
      ...(req.body?.emailIntro ? { emailIntro: req.body.emailIntro } : {}),
      ...(req.body?.emailBody ? { emailBody: req.body.emailBody } : {}),
      ...(req.body?.emailCustomNotes !== undefined ? { emailCustomNotes: req.body.emailCustomNotes } : {}),
      ...(req.body?.emailSignOffAuthorized ? { emailSignOffAuthorized: req.body.emailSignOffAuthorized } : {}),
      ...(req.body?.emailSignOffApproved ? { emailSignOffApproved: req.body.emailSignOffApproved } : {})
    };

    const targetEmail = (req.body?.recipientEmail || req.body?.email || '').trim().toLowerCase();
    let recipients = [];

    if (targetEmail) {
      if (!targetEmail.includes('@') || !targetEmail.includes('.')) {
        return res.status(400).json({ error: 'Please provide a valid recipient email address.' });
      }
      const targetUser = await db.collection('users').findOne({ email: targetEmail });
      recipients = [{ email: targetEmail, user: targetUser }];
    } else {
      // Retrieve all registered alumni accounts (exclude admin)
      const alumniList = await db.collection('users').find({
        email: { $ne: ADMIN_EMAIL }
      }).toArray();

      if (!alumniList || alumniList.length === 0) {
        return res.status(400).json({ error: 'No registered alumni members found to send emails to.' });
      }

      // Deduplicate by email
      const seen = new Set();
      recipients = [];
      for (const u of alumniList) {
        const email = (u.email || '').trim().toLowerCase();
        if (email && !seen.has(email)) {
          seen.add(email);
          recipients.push({ email, user: u });
        }
      }
    }

    const portalUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // Configure Live Gmail Mailer (Strictly real emails from muralisubbu11@gmail.com)
    const smtpUser = (req.body?.smtpUser || process.env.SMTP_USER || 'muralisubbu11@gmail.com').trim();
    const smtpPass = (req.body?.smtpPass || process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');

    if (!smtpPass) {
      return res.status(400).json({
        error: `Gmail App Password is required to send live emails from ${smtpUser}. Please enter your 16-character Google App Password in the modal or configure SMTP_PASS in server/.env.`
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    try {
      await transporter.verify();
    } catch (verifyErr) {
      console.error("Gmail SMTP verification failed:", verifyErr);
      return res.status(400).json({
        error: `Gmail authentication failed for ${smtpUser}: ${verifyErr.message}. Make sure you are using a 16-character Google App Password generated from your Google Account (Security > 2-Step Verification > App passwords).`
      });
    }

    // Persist verified password to .env if supplied
    if (req.body?.smtpPass) {
      process.env.SMTP_PASS = smtpPass;
      process.env.SMTP_USER = smtpUser;
      try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          envContent = envContent.replace(/^SMTP_USER=.*$/m, `SMTP_USER=${smtpUser}`);
          if (/^SMTP_PASS=.*$/m.test(envContent)) {
            envContent = envContent.replace(/^SMTP_PASS=.*$/m, `SMTP_PASS=${smtpPass}`);
          } else {
            envContent += `\nSMTP_PASS=${smtpPass}`;
          }
          fs.writeFileSync(envPath, envContent, 'utf8');
        }
      } catch (e) {
        console.warn("Could not persist SMTP_PASS to .env:", e.message);
      }
    }

    let sentCount = 0;
    let failedCount = 0;
    const failedRecipients = [];

    const senderAddress = process.env.SMTP_FROM || `"Alumni Election Commission" <${smtpUser}>`;

    for (const { email, user } of recipients) {
      try {
        const recipientName = user?.name || (email ? email.split('@')[0] : 'Esteemed Alumni Member');
        const recipientDept = user?.department ? `${user.department.toUpperCase()} Department` : '';
        const recipientBatch = user?.batch || user?.graduationYear ? `Class of ${user.batch || user.graduationYear}` : '';

        const { subject, html } = generateElectionAnnouncementEmail({
          announcement,
          recipientName,
          recipientEmail: email,
          recipientDept,
          recipientBatch,
          portalUrl
        });

        await transporter.sendMail({
          from: senderAddress,
          to: email,
          subject,
          html
        });

        sentCount++;
      } catch (err) {
        failedCount++;
        failedRecipients.push({ email, error: err.message });
      }
    }

    res.json({
      success: true,
      message: targetEmail
        ? `Official election announcement successfully sent to ${targetEmail} from ${smtpUser}.`
        : `Official election announcement broadcast completed. Live emails sent to ${sentCount} alumni from ${smtpUser}.`,
      stats: {
        targetType: targetEmail ? 'single' : 'all',
        senderEmail: smtpUser,
        recipientEmail: targetEmail || null,
        totalAlumni: recipients.length,
        sentCount,
        failedCount,
        failedRecipients,
        mode: 'live'
      }
    });
  } catch (err) {
    console.error("Failed to send announcement emails:", err);
    res.status(500).json({ error: 'Failed to broadcast announcement emails: ' + (err.message || 'Internal error') });
  }
});

// Admin Only: Get SMTP Status
app.get('/api/elections/smtp-status', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    smtpUser: process.env.SMTP_USER || 'muralisubbu11@gmail.com',
    configured: Boolean(process.env.SMTP_PASS && process.env.SMTP_PASS.trim())
  });
});

// Admin Only: Live Email Gazette Preview (Supports GET and POST for live typing preview)
const handleEmailPreview = async (req, res) => {
  try {
    const rawAnnouncement = await db.collection('announcements').findOne({}, { sort: { updatedAt: -1 } });
    const announcement = {
      ...DEFAULT_ANNOUNCEMENT,
      ...(rawAnnouncement || {}),
      ...(req.body || {})
    };
    const portalUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const emailData = generateElectionAnnouncementEmail({
      announcement,
      recipientName: req.user.name || 'Esteemed Alumni Member',
      recipientEmail: req.user.email,
      recipientDept: req.user.department || 'Computer Science and Engineering',
      recipientBatch: req.user.batch || 'Class of 2022',
      portalUrl
    });

    res.json({ success: true, ...emailData });
  } catch (err) {
    console.error("Failed to generate preview:", err);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
};
app.get('/api/elections/announcement/email-preview', authenticateToken, requireAdmin, handleEmailPreview);
app.post('/api/elections/announcement/email-preview', authenticateToken, requireAdmin, handleEmailPreview);

function isDobMatch(reqDobStr, dbDobVal) {
  if (!reqDobStr || !dbDobVal) return false;
  const rawDbDate = (typeof dbDobVal === 'object' && dbDobVal !== null && dbDobVal.$date) ? dbDobVal.$date : dbDobVal;
  const dbDate = new Date(rawDbDate);
  if (isNaN(dbDate.getTime())) return false;

  const reqDate = new Date(reqDobStr);
  if (!isNaN(reqDate.getTime())) {
    if (
      reqDate.getUTCFullYear() === dbDate.getUTCFullYear() &&
      reqDate.getUTCMonth() === dbDate.getUTCMonth() &&
      reqDate.getUTCDate() === dbDate.getUTCDate()
    ) {
      return true;
    }
    if (
      reqDate.getFullYear() === dbDate.getFullYear() &&
      reqDate.getMonth() === dbDate.getMonth() &&
      reqDate.getDate() === dbDate.getDate()
    ) {
      return true;
    }
  }

  if (typeof reqDobStr === 'string') {
    const parts = reqDobStr.split(/[-/]/).map(Number);
    if (parts.length === 3) {
      const dbYear = dbDate.getUTCFullYear();
      const dbMonth = dbDate.getUTCMonth() + 1;
      const dbDay = dbDate.getUTCDate();

      if (parts[0] === dbYear && parts[1] === dbMonth && parts[2] === dbDay) return true;
      if (parts[2] === dbYear && parts[1] === dbMonth && parts[0] === dbDay) return true;
      if (parts[2] === dbYear && parts[0] === dbMonth && parts[1] === dbDay) return true;
    }
  }

  return false;
}

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
    if (!isDobMatch(dob, dbDob)) {
      return res.status(403).json({ error: 'The provided Date of Birth does not match the alumni records.' });
    }

    // Verify Graduation Year (Passout date)
    const hasMatchingGradYear = alumniMember.education_details?.some(
      (ed) => String(ed.end_year) === String(graduationYear)
    );
    if (!hasMatchingGradYear) {
      return res.status(403).json({ error: 'The provided Graduation Year does not match the alumni records.' });
    }

    const userEmail = (email || '').trim().toLowerCase();

    // Prevent registering with designated admin email
    if (userEmail === ADMIN_EMAIL) {
      return res.status(403).json({ error: 'This email is reserved for the designated administrator account.' });
    }

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email: userEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user - strictly assigned role 'alumni'
    const newUser = {
      name,
      phone,
      department,
      graduationYear,
      dob,
      gender,
      previousRole,
      email: userEmail,
      password: hashedPassword,
      role: 'alumni',
      createdAt: new Date()
    };

    const insertResult = await db.collection('users').insertOne(newUser);
    newUser._id = insertResult.insertedId;

    // Return user without password and issue JWT session token
    delete newUser.password;

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: 'alumni', name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user: newUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Configure Login Rate Limiter (15 minutes window)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Generous limit for dev/testing while guarding against brute-force
  message: { error: 'Too many login attempts from this IP. Your IP is temporarily banned for 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const userEmail = (email || '').trim().toLowerCase();

    const user = await db.collection('users').findOne({ email: userEmail });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Ensure role integrity: Admin email is always admin, others are alumni
    const role = userEmail === ADMIN_EMAIL ? 'admin' : (user.role || 'alumni');
    delete user.password;
    user.role = role;

    // Issue signed JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify user for forgot password
app.post('/api/forgot-password/verify', async (req, res) => {
  try {
    const { email, dob, graduationYear } = req.body;

    if (!email || !dob || !graduationYear) {
      return res.status(400).json({ error: 'Email, Date of Birth, and Graduation Year are required.' });
    }

    const alumniMember = await db.collection('members').findOne({
      $or: [
        { 'basic.email_id': email },
        { 'basic.alternate_email_id': email }
      ]
    });

    if (!alumniMember) {
      return res.status(404).json({ error: 'Alumni record not found.' });
    }

    // Verify Date of Birth
    const dbDob = alumniMember.basic?.dateofbirth;
    if (!dbDob) {
      return res.status(400).json({ error: 'Alumni record does not have a Date of Birth to verify.' });
    }
    if (!isDobMatch(dob, dbDob)) {
      return res.status(403).json({ error: 'Incorrect verification details.' });
    }

    const hasMatchingGradYear = alumniMember.education_details?.some(
      (ed) => String(ed.end_year) === String(graduationYear)
    );
    if (!hasMatchingGradYear) {
      return res.status(403).json({ error: 'Incorrect verification details.' });
    }

    const existingUser = await db.collection('users').findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ error: 'Account not found. You need to sign up first.' });
    }

    res.json({ success: true, message: 'Identity verified. You can now reset your password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during verification.' });
  }
});

// Reset Password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const result = await db.collection('users').updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during password reset.' });
  }
});

// --- Alumni Validation & Database Verification Helpers ---
const DEPT_ALIASES = {
  'cse': ['cse', 'computer science', 'computer science & engineering', 'computer science and engineering'],
  'it': ['it', 'information technology', 'info tech'],
  'ece': ['ece', 'electronics & communication', 'electronics and communication engineering', 'electronics & communication engineering'],
  'eee': ['eee', 'electrical & electronics', 'electrical and electronics engineering', 'electrical & electronics engineering'],
  'mech': ['mech', 'mechanical', 'mechanical engineering'],
  'civil': ['civil', 'civil engineering'],
  'ai&ds': ['ai&ds', 'aids', 'ai and ds', 'artificial intelligence & data science', 'artificial intelligence']
};

function normalizeText(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizePhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function escapeRegex(str) {
  return (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getPrimaryDept(member) {
  if (member.basic?.label) {
    const parts = member.basic.label.split(',');
    if (parts.length > 1) return parts[1].trim();
  }
  const stream = member.education_details?.find(e => e.stream)?.stream;
  if (stream) return stream;
  const memStream = member.membership_details?.flatMap(m => m.details || []).find(d => d.stream)?.stream;
  return memStream || 'Alumni Member';
}

function getPrimaryGradYear(member) {
  const edYear = member.education_details?.find(e => e.end_year)?.end_year;
  if (edYear) return String(edYear);
  if (member.basic?.label) {
    const m = member.basic.label.match(/\b(19\d\d|20\d\d)\b/);
    if (m) return m[1];
  }
  return '';
}

const TITLES = new Set(['dr', 'er', 'prof', 'mr', 'mrs', 'ms', 'shri', 'smt']);

function getCleanTokens(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w && !TITLES.has(w));
}

function matchesName(inputName, memberName) {
  if (!inputName || !memberName) return false;
  const inTokens = getCleanTokens(inputName);
  const dbTokens = getCleanTokens(memberName);
  if (inTokens.length === 0 || dbTokens.length === 0) return false;

  // Exact normalized string match
  if (inTokens.join('') === dbTokens.join('')) return true;

  // Check main names (length >= 3)
  const inMain = inTokens.filter(t => t.length >= 3);
  const dbMain = dbTokens.filter(t => t.length >= 3);

  if (inMain.length > 0 && dbMain.length > 0) {
    const hasMainMatch = inMain.some(im => dbMain.some(dm => dm === im || (dm.length >= 4 && dm.includes(im))));
    if (!hasMainMatch) return false;
  } else if (inMain.length !== dbMain.length) {
    return false;
  }

  // All input words must either match a DB word, or if 1 char initial, match DB initial/prefix
  for (const t of inTokens) {
    const matched = dbTokens.some(dt => {
      if (t === dt) return true;
      if (t.length === 1 && dt.startsWith(t)) return true;
      if (dt.length === 1 && t.length === 1 && t === dt) return true;
      return false;
    });
    if (!matched) return false;
  }

  return true;
}

function matchesPhone(inputPhone, memberPhone) {
  if (!inputPhone || !memberPhone) return false;
  const inDigits = normalizePhone(inputPhone);
  const dbDigits = normalizePhone(memberPhone);
  if (!inDigits || !dbDigits) return false;
  return inDigits === dbDigits;
}

function matchesDepartment(inputDept, member) {
  if (!inputDept) return false;
  const normInput = normalizeText(inputDept);
  if (!normInput) return false;
  
  // Check against basic.label
  const normLabel = normalizeText(member.basic?.label || '');
  if (normLabel.includes(normInput)) return true;

  // Check against education details streams
  const streams = [
    ...(member.education_details || []).map(e => e.stream || ''),
    ...(member.membership_details || []).flatMap(m => (m.details || []).map(d => d.stream || ''))
  ];
  for (const stream of streams) {
    const normStream = normalizeText(stream);
    if (!normStream) continue;
    if (normStream.includes(normInput) || normInput.includes(normStream)) return true;
    
    // Check aliases
    for (const [key, aliases] of Object.entries(DEPT_ALIASES)) {
      const isInputAlias = aliases.some(a => normalizeText(a) === normInput || normInput === key);
      const isStreamAlias = aliases.some(a => normStream.includes(normalizeText(a)));
      if (isInputAlias && isStreamAlias) return true;
    }
  }
  return false;
}

let cachedFallbackMembers = null;
function getFallbackMembers() {
  if (cachedFallbackMembers) return cachedFallbackMembers;
  try {
    const filePath = path.join(__dirname, '../DB File/test.members.json');
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      cachedFallbackMembers = JSON.parse(fileData);
      console.log(`Loaded ${cachedFallbackMembers.length} fallback alumni records into memory.`);
      return cachedFallbackMembers;
    }
  } catch (err) {
    console.error("Fallback file read error:", err);
  }
  return [];
}

async function queryAlumniByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  
  // Try MongoDB first
  if (db) {
    try {
      const member = await db.collection('members').findOne({
        $or: [
          { 'basic.email_id': { $regex: new RegExp(`^${escapeRegex(cleanEmail)}$`, 'i') } },
          { 'basic.alternate_email_id': { $regex: new RegExp(`^${escapeRegex(cleanEmail)}$`, 'i') } }
        ]
      });
      if (member) return member;
    } catch (e) {
      console.warn("MongoDB query error in queryAlumniByEmail:", e.message);
    }
  }

  // Fallback to DB File/test.members.json if DB unavailable
  const members = getFallbackMembers();
  return members.find(m => 
    (m.basic?.email_id && m.basic.email_id.toLowerCase() === cleanEmail) ||
    (m.basic?.alternate_email_id && m.basic.alternate_email_id.toLowerCase() === cleanEmail)
  ) || null;
}

// Alumni Lookup Endpoint: Auto-fetch details by email for instant form auto-population
app.get('/api/alumni/lookup', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email || !email.trim()) {
      return res.status(400).json({ found: false, error: 'Email query parameter is required.' });
    }

    const member = await queryAlumniByEmail(email);
    if (!member) {
      return res.status(404).json({ found: false, error: 'Alumni data not found.' });
    }

    const officialName = member.basic?.name || '';
    const officialPhone = member.contact_details?.mobile || member.contact_details?.home || member.basic?.mobile_no_1 || member.basic?.mobile_no_2 || '';
    const officialDept = getPrimaryDept(member);
    const officialGradYear = getPrimaryGradYear(member);
    const alumniId = member.basic?.roll_no || member.membership_details?.[0]?.site_id || member.membership_details?.[0]?.reg_no || '';

    return res.json({
      found: true,
      alumni: {
        name: officialName,
        email: member.basic?.email_id || email.trim(),
        alternateEmail: member.basic?.alternate_email_id || '',
        phone: officialPhone,
        department: officialDept,
        graduationYear: officialGradYear,
        alumniId: alumniId,
        label: member.basic?.label || '',
        institution: member.education_details?.[0]?.institution || 'National Engineering College'
      }
    });
  } catch (err) {
    console.error("Alumni lookup error:", err);
    res.status(500).json({ found: false, error: 'Failed to lookup alumni record.' });
  }
});

app.post('/api/alumni/lookup', async (req, res) => {
  try {
    const email = req.body.email || req.query.email;
    if (!email || !email.trim()) {
      return res.status(400).json({ found: false, error: 'Email is required.' });
    }

    const member = await queryAlumniByEmail(email);
    if (!member) {
      return res.status(404).json({ found: false, error: 'Alumni data not found.' });
    }

    const officialName = member.basic?.name || '';
    const officialPhone = member.contact_details?.mobile || member.contact_details?.home || member.basic?.mobile_no_1 || member.basic?.mobile_no_2 || '';
    const officialDept = getPrimaryDept(member);
    const officialGradYear = getPrimaryGradYear(member);
    const alumniId = member.basic?.roll_no || member.membership_details?.[0]?.site_id || member.membership_details?.[0]?.reg_no || '';

    return res.json({
      found: true,
      alumni: {
        name: officialName,
        email: member.basic?.email_id || email.trim(),
        alternateEmail: member.basic?.alternate_email_id || '',
        phone: officialPhone,
        department: officialDept,
        graduationYear: officialGradYear,
        alumniId: alumniId,
        label: member.basic?.label || '',
        institution: member.education_details?.[0]?.institution || 'National Engineering College'
      }
    });
  } catch (err) {
    console.error("Alumni lookup error:", err);
    res.status(500).json({ found: false, error: 'Failed to lookup alumni record.' });
  }
});

// Nominee Real Alumni Verification Endpoint
app.post('/api/alumni/verify-nominee', async (req, res) => {
  try {
    const { email, name, phone, department, graduationYear } = req.body;
    
    if (!email || !email.trim()) {
      return res.status(400).json({ 
        found: false, 
        valid: false, 
        error: 'Nominee alumni email is required for verification.' 
      });
    }

    const member = await queryAlumniByEmail(email);

    if (!member) {
      return res.status(404).json({
        found: false,
        valid: false,
        error: 'Alumni data not found.'
      });
    }

    const officialName = member.basic?.name || '';
    const officialPhone = member.contact_details?.mobile || member.contact_details?.home || '';
    const officialDept = getPrimaryDept(member);
    const officialGradYear = getPrimaryGradYear(member);

    const errors = {};

    // Validate Name if provided
    if (name && name.trim()) {
      if (!matchesName(name, officialName)) {
        errors.name = 'Nominee name does not match alumni records.';
      }
    }

    // Validate Phone if provided
    if (phone && phone.trim()) {
      if (officialPhone && !matchesPhone(phone, officialPhone)) {
        errors.phone = 'Nominee phone number does not match alumni records.';
      }
    }

    // Validate Department if provided
    if (department && department.trim()) {
      if (!matchesDepartment(department, member)) {
        errors.department = 'Nominee department does not match alumni records.';
      }
    }

    // Validate Graduation Year if provided
    if (graduationYear && String(graduationYear).trim()) {
      if (officialGradYear && String(graduationYear).trim() !== String(officialGradYear).trim()) {
        errors.graduationYear = 'Nominee graduation year does not match alumni records.';
      }
    }

    const isValid = Object.keys(errors).length === 0;

    res.json({
      found: true,
      valid: isValid,
      errors,
      officialRecord: {
        name: officialName,
        email: member.basic?.email_id || email,
        phone: officialPhone,
        department: officialDept,
        graduationYear: officialGradYear,
        label: member.basic?.label || '',
        institution: member.education_details?.[0]?.institution || 'National Engineering College'
      }
    });
  } catch (err) {
    console.error("Nominee verification error:", err);
    res.status(500).json({ error: 'Failed to verify nominee record.' });
  }
});

// Submit Nomination Application (Proposal-Driven: No Self-Nomination & Strict Real Alumni Validation)
// Submit Nomination Application (Proposal-Driven: Requires Affirmative Seconder Willingness Consent)
app.post('/api/applications', async (req, res) => {
  try {
    const {
      proposer,
      nominee,
      nomineePhoto,

      applicantEmail,
      name,
      department,
      graduationYear,
      phone,
      targetPositions,
      previousRoles,
      roleDurations,
      roleCategory,
      continuousService,
      seconder,
      purposeStatement,
      motivation
    } = req.body;

    const nomineeName = (nominee?.name || name || '').trim();
    const nomineeEmail = (nominee?.email || applicantEmail || '').trim().toLowerCase();
    const proposerEmail = (proposer?.email || '').trim().toLowerCase();
    const seconderEmail = (seconder?.email || '').trim().toLowerCase();
    const nomineePhone = (nominee?.phone || phone || '').trim();
    const nomineeDept = (nominee?.department || department || '').trim();
    const nomineeGradYear = (nominee?.graduationYear || graduationYear || '').toString().trim();

    if (!nomineeEmail) {
      return res.status(400).json({ error: 'Nominee email is required.' });
    }

    if (!proposerEmail) {
      return res.status(400).json({ error: 'Proposer details are required. A candidate must be proposed by an eligible member.' });
    }

    if (!seconderEmail) {
      return res.status(400).json({ error: 'Seconder email is required. Every nomination must be seconded by an eligible alumni member.' });
    }

    // STRICT RULE: Nominee passport-size photograph is mandatory
    if (!nomineePhoto || (typeof nomineePhoto === 'string' && !nomineePhoto.trim())) {
      return res.status(400).json({
        error: 'Nominee passport-size photograph is strictly mandatory. You cannot submit a nomination without uploading the nominee’s photograph.'
      });
    }

    // STRICT RULE: No Self-Nomination
    if (proposerEmail === nomineeEmail) {
      return res.status(400).json({
        error: 'Self-nomination is strictly prohibited. A member can only be nominated by being proposed by another eligible alumni member.'
      });
    }

    if (seconderEmail === proposerEmail || seconderEmail === nomineeEmail) {
      return res.status(400).json({
        error: 'Seconder must be a distinct eligible alumni member (cannot be the proposer or the nominee).'
      });
    }

    // STRICT RULE: Nominee must be an authentic registered alumni in the database
    const nomineeMember = await queryAlumniByEmail(nomineeEmail);
    if (!nomineeMember) {
      return res.status(404).json({
        error: 'Nominee alumni data not found in alumni records.'
      });
    }

    // STRICT RULE: Seconder must be an authentic registered alumni in the database
    const seconderMember = await queryAlumniByEmail(seconderEmail);
    if (!seconderMember) {
      return res.status(404).json({
        error: 'Seconder alumni data not found in alumni records.'
      });
    }

    const officialNomineeName = nomineeMember.basic?.name || '';
    const officialNomineePhone = nomineeMember.contact_details?.mobile || nomineeMember.contact_details?.home || '';
    const officialNomineeDept = getPrimaryDept(nomineeMember);

    // Validate Name against official record
    if (nomineeName && !matchesName(nomineeName, officialNomineeName)) {
      return res.status(400).json({
        error: 'Nominee name does not match alumni records.'
      });
    }

    // Validate Phone against official record
    if (nomineePhone && officialNomineePhone && !matchesPhone(nomineePhone, officialNomineePhone)) {
      return res.status(400).json({
        error: 'Nominee phone number does not match alumni records.'
      });
    }

    // Validate Department against official record
    if (nomineeDept && !matchesDepartment(nomineeDept, nomineeMember)) {
      return res.status(400).json({
        error: 'Nominee department does not match alumni records.'
      });
    }

    // STRICT RULE: President role eligibility - Must have served as an Office Bearer in preceding 5 years
    const positions = Array.isArray(targetPositions) ? targetPositions : (targetPositions ? [targetPositions] : []);
    if (positions.includes('President')) {
      if (roleCategory !== 'Office Bearer') {
        return res.status(400).json({
          error: 'Ineligible for President'
        });
      }
    }

    // Generate secure seconding consent token
    const seconderConsentToken = crypto.randomBytes(32).toString('hex');

    const newApplication = {
      applicantEmail: nomineeEmail,
      nomineeEmail,
      proposerEmail,
      seconderEmail,
      name: nomineeName,
      department: nominee?.department || department,
      graduationYear: nominee?.graduationYear || graduationYear,
      phone: nominee?.phone || phone,
      nominee: nominee || {
        name: nomineeName,
        email: nomineeEmail,
        department: department,
        graduationYear: graduationYear,
        phone: phone
      },
      proposer: proposer || { name: '', email: proposerEmail, phone: '', batch: '' },
      seconder: seconder || { name: '', email: seconderEmail, phone: '', batch: '' },
      targetPositions: Array.isArray(targetPositions) ? targetPositions : [targetPositions],
      previousRoles: previousRoles || [],
      roleDurations: roleDurations || {},
      roleCategory: roleCategory || 'Office Bearer',
      continuousService: continuousService || { years: 1, withoutGap: true, details: '' },
      purposeStatement: purposeStatement || motivation || '',
      motivation: purposeStatement || motivation || '',
      nomineePhoto: nomineePhoto || null,
      // Initially pending seconder willingness - NOT yet submitted for scrutiny!
      status: 'pending_seconding',
      seconderConsentStatus: 'pending',
      seconderConsentToken,
      seconderConsentExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      seconderConsentAt: null,
      withdrawn: false,
      createdAt: new Date(),
      submittedAt: new Date()
    };

    // Resolve nominee photo to public CDN URL so Gmail renders it strictly inline without attachment chips or download cards
    if (newApplication.nomineePhoto) {
      try {
        const hostedUrl = await resolveNomineePhotoUrl(newApplication.nomineePhoto);
        if (hostedUrl) {
          newApplication.nomineePhoto = hostedUrl;
          newApplication.nomineePhotoUrl = hostedUrl;
        }
      } catch (uploadErr) {
        console.warn("Failed to host nominee photo:", uploadErr.message);
      }
    }

    // Dispatch official email to seconder asking for their willingness
    let secondingEmailSent = false;
    let secondingEmailError = null;
    try {
      const { transporter, senderAddress } = createMailTransporter();
      const portalUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const apiBaseUrl = process.env.SERVER_URL || `http://localhost:${port}`;

      // If photo is already hosted on CDN, use it directly (NO email attachment = NO attachment chip in Gmail!)
      let mailAttachments = undefined;
      let emailPhoto = newApplication.nomineePhoto;
      if (emailPhoto && emailPhoto.startsWith('data:')) {
        const photoAttachInfo = buildPhotoAttachment(emailPhoto, 'nominee-photo');
        if (photoAttachInfo) {
          emailPhoto = photoAttachInfo.cidUrl;
          if (photoAttachInfo.attachment) mailAttachments = [photoAttachInfo.attachment];
        }
      }

      const emailData = generateSeconderConsentEmail({
        proposer: newApplication.proposer,
        nominee: newApplication.nominee,
        seconder: newApplication.seconder,
        targetPositions: newApplication.targetPositions,
        roleCategory: newApplication.roleCategory,
        purposeStatement: newApplication.purposeStatement,
        nomineePhoto: emailPhoto || null,
        consentToken: seconderConsentToken,
        portalUrl,
        apiBaseUrl
      });

      const seconderMailOptions = {
        from: senderAddress,
        to: seconderEmail,
        subject: emailData.subject,
        html: emailData.html
      };
      if (mailAttachments) seconderMailOptions.attachments = mailAttachments;

      await transporter.sendMail(seconderMailOptions);
      secondingEmailSent = true;
      console.log(`Seconding willingness request successfully sent to ${seconderEmail}`);
    } catch (mailErr) {
      console.error("Failed to dispatch seconder consent email:", mailErr.message);
      secondingEmailError = mailErr.message;
    }

    const result = await db.collection('applications').insertOne(newApplication);
    res.status(201).json({
      ...newApplication,
      _id: result.insertedId,
      secondingEmailSent,
      secondingEmailError
    });
  } catch (err) {
    console.error("Nomination submission error:", err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Seconder Willingness Consent Link Handler (Direct 1-Click from Email)
app.get('/api/nominations/seconding-consent', async (req, res) => {
  try {
    const { token, decision } = req.query;
    const portalUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    if (!token) {
      return res.send(generateSeconderConfirmationPage({
        success: false,
        errorMessage: 'Invalid verification link. Token is missing.',
        portalUrl
      }));
    }

    const application = await db.collection('applications').findOne({
      seconderConsentToken: token
    });

    if (!application) {
      return res.send(generateSeconderConfirmationPage({
        success: false,
        errorMessage: 'The seconding request was not found or has already been processed.',
        portalUrl
      }));
    }

    // If already finalized, show confirmation without reprocessing
    if (application.seconderConsentStatus && application.seconderConsentStatus !== 'pending') {
      return res.send(generateSeconderConfirmationPage({
        success: true,
        decision: application.seconderConsentStatus,
        nomineeName: application.nominee?.name || application.name,
        proposerName: application.proposer?.name,
        positions: application.targetPositions,
        portalUrl
      }));
    }

    const isAccept = decision === 'accept';
    const newConsentStatus = isAccept ? 'accepted' : 'declined';
    // If accepted → awaiting nominee consent; if declined → seconding_declined
    const newStatus = isAccept ? 'pending_nominee_consent' : 'seconding_declined';

    // Generate nominee consent token if accepting
    const nomineeConsentToken = isAccept ? crypto.randomBytes(32).toString('hex') : null;

    const updateFields = {
      seconderConsentStatus: newConsentStatus,
      status: newStatus,
      seconderConsentAt: new Date()
    };
    if (nomineeConsentToken) {
      updateFields.nomineeConsentToken = nomineeConsentToken;
      updateFields.nomineeConsentStatus = 'pending';
      updateFields.nomineeConsentExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }

    await db.collection('applications').updateOne(
      { _id: application._id },
      { $set: updateFields }
    );

    const portalUrl2 = process.env.CLIENT_URL || 'http://localhost:5173';
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5000';

    try {
      const { transporter, senderAddress } = createMailTransporter();
      const proposerEmail = application.proposer?.email || application.proposerEmail;
      const nomineeEmail = application.nominee?.email || application.nomineeEmail;
      const positionsText = (application.targetPositions || []).join(', ');

      if (!isAccept && proposerEmail) {
        // Notify proposer of decline
        await transporter.sendMail({
          from: senderAddress,
          to: proposerEmail,
          subject: `Notice: Seconding request for ${application.nominee?.name} was declined`,
          html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #dc2626; margin-top: 0;">✕ Seconding Request Declined</h2>
            <p>Dear <strong>${application.proposer?.name || 'Alumni Member'}</strong>,</p>
            <p>The designated seconder <strong>${application.seconder?.name || 'The seconder'}</strong> (${application.seconder?.email || ''}) has <strong>declined</strong> to second the nomination of <strong>${application.nominee?.name}</strong> for <strong>${positionsText}</strong>.</p>
            <p>In accordance with constitutional election bylaws, a nomination without an affirmative seconding member cannot be submitted to the committee.</p>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">Alumni Election Commission • National Engineering College</div>
          </div>`
        });
      }

      if (isAccept && nomineeEmail && nomineeConsentToken) {
        // Notify proposer that seconding is confirmed, awaiting nominee
        if (proposerEmail) {
          await transporter.sendMail({
            from: senderAddress,
            to: proposerEmail,
            subject: `Seconding Confirmed – Awaiting Nominee Consent for ${application.nominee?.name}`,
            html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #16a34a; margin-top: 0;">✓ Seconding Confirmed</h2>
              <p>Dear <strong>${application.proposer?.name || 'Alumni Member'}</strong>,</p>
              <p><strong>${application.seconder?.name || 'The seconder'}</strong> has <strong>accepted</strong> the seconding request for the nomination of <strong>${application.nominee?.name}</strong> as <strong>${positionsText}</strong>.</p>
              <p>An official consent notice has now been dispatched to the nominee (<strong>${application.nominee?.name}</strong>) asking whether they wish to stand for election. The nomination will be formally submitted to the Scrutiny Committee only after the nominee confirms acceptance.</p>
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">Alumni Election Commission • National Engineering College</div>
            </div>`
          });
        }

        // Resolve hosted nominee photo (zero email attachment = no separate noname chip)
        let emailNomineePhoto = application.nomineePhotoUrl || application.nomineePhoto;
        if (emailNomineePhoto && emailNomineePhoto.startsWith('data:')) {
          try {
            const uploadedUrl = await resolveNomineePhotoUrl(emailNomineePhoto);
            if (uploadedUrl) {
              emailNomineePhoto = uploadedUrl;
              await db.collection('applications').updateOne(
                { _id: application._id },
                { $set: { nomineePhoto: uploadedUrl, nomineePhotoUrl: uploadedUrl } }
              );
            }
          } catch (e) {
            console.warn("Could not host photo:", e.message);
          }
        }

        let mailAttachmentsN = undefined;
        if (emailNomineePhoto && emailNomineePhoto.startsWith('data:')) {
          const photoAttachInfoN = buildPhotoAttachment(emailNomineePhoto, 'nominee-photo');
          if (photoAttachInfoN) {
            emailNomineePhoto = photoAttachInfoN.cidUrl;
            if (photoAttachInfoN.attachment) mailAttachmentsN = [photoAttachInfoN.attachment];
          }
        }

        const nomineeEmailData = generateNomineeConsentEmail({
          proposer: application.proposer || { name: '', email: proposerEmail },
          nominee: application.nominee || { name: application.name, email: nomineeEmail },
          seconder: application.seconder || { name: '', email: application.seconderEmail },
          targetPositions: application.targetPositions,
          roleCategory: application.roleCategory,
          purposeStatement: application.purposeStatement || application.motivation,
          nomineePhoto: emailNomineePhoto || null,
          consentToken: nomineeConsentToken,
          portalUrl: portalUrl2,
          apiBaseUrl
        });
        const nomineeMailOpts = {
          from: senderAddress,
          to: nomineeEmail,
          subject: nomineeEmailData.subject,
          html: nomineeEmailData.html
        };
        if (mailAttachmentsN) nomineeMailOpts.attachments = mailAttachmentsN;
        await transporter.sendMail(nomineeMailOpts);
        console.log(`Nominee consent email dispatched to ${nomineeEmail}`);
      }
    } catch (mailErr) {
      console.warn("Could not dispatch seconding/nominee status email:", mailErr.message);
    }

    res.send(generateSeconderConfirmationPage({
      success: true,
      decision: newConsentStatus,
      nomineeName: application.nominee?.name || application.name,
      proposerName: application.proposer?.name,
      positions: application.targetPositions,
      portalUrl
    }));
  } catch (err) {
    console.error("Seconding consent error:", err);
    res.status(500).send("Server error processing seconding consent");
  }
});

// Seconder Willingness Consent API (For logged-in alumni reviewing in portal)
app.post('/api/nominations/seconding-consent', optionalAuth, async (req, res) => {
  try {
    const { applicationId, token, decision } = req.body;
    let query = {};
    if (token) {
      query.seconderConsentToken = token;
    } else if (applicationId) {
      query._id = new ObjectId(applicationId);
      if (req.user?.email) {
        query.$or = [
          { 'seconder.email': req.user.email.toLowerCase() },
          { seconderEmail: req.user.email.toLowerCase() }
        ];
      }
    } else {
      return res.status(400).json({ error: 'applicationId or token is required' });
    }

    const application = await db.collection('applications').findOne(query);
    if (!application) {
      return res.status(404).json({ error: 'Nomination proposal not found or unauthorized' });
    }

    const isAccept = decision === 'accept';
    const newConsentStatus = isAccept ? 'accepted' : 'declined';
    const newStatus = isAccept ? 'pending_nominee_consent' : 'seconding_declined';

    const nomineeConsentToken = isAccept ? crypto.randomBytes(32).toString('hex') : null;
    const updateFields = {
      seconderConsentStatus: newConsentStatus,
      status: newStatus,
      seconderConsentAt: new Date()
    };
    if (nomineeConsentToken) {
      updateFields.nomineeConsentToken = nomineeConsentToken;
      updateFields.nomineeConsentStatus = 'pending';
      updateFields.nomineeConsentExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }

    await db.collection('applications').updateOne(
      { _id: application._id },
      { $set: updateFields }
    );

    // Dispatch nominee consent email if accepted
    if (isAccept && nomineeConsentToken) {
      try {
        const { transporter, senderAddress } = createMailTransporter();
        const portalUrl2 = process.env.CLIENT_URL || 'http://localhost:5173';
        const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
        const nomineeEmail = application.nominee?.email || application.nomineeEmail;
        if (nomineeEmail) {
          let emailNomineePhoto = application.nomineePhotoUrl || application.nomineePhoto;
          if (emailNomineePhoto && emailNomineePhoto.startsWith('data:')) {
            try {
              const uploadedUrl = await resolveNomineePhotoUrl(emailNomineePhoto);
              if (uploadedUrl) {
                emailNomineePhoto = uploadedUrl;
                await db.collection('applications').updateOne(
                  { _id: application._id },
                  { $set: { nomineePhoto: uploadedUrl, nomineePhotoUrl: uploadedUrl } }
                );
              }
            } catch (e) {
              console.warn("Could not host photo:", e.message);
            }
          }

          let mailAttachmentsP = undefined;
          if (emailNomineePhoto && emailNomineePhoto.startsWith('data:')) {
            const photoAttachInfoP = buildPhotoAttachment(emailNomineePhoto, 'nominee-photo');
            if (photoAttachInfoP) {
              emailNomineePhoto = photoAttachInfoP.cidUrl;
              if (photoAttachInfoP.attachment) mailAttachmentsP = [photoAttachInfoP.attachment];
            }
          }

          const nomineeEmailData = generateNomineeConsentEmail({
            proposer: application.proposer || { name: '', email: application.proposerEmail },
            nominee: application.nominee || { name: application.name, email: nomineeEmail },
            seconder: application.seconder || { name: '', email: application.seconderEmail },
            targetPositions: application.targetPositions,
            roleCategory: application.roleCategory,
            purposeStatement: application.purposeStatement || application.motivation,
            nomineePhoto: emailNomineePhoto || null,
            consentToken: nomineeConsentToken,
            portalUrl: portalUrl2,
            apiBaseUrl
          });
          const nomineeMailOptsP = {
            from: senderAddress,
            to: nomineeEmail,
            subject: nomineeEmailData.subject,
            html: nomineeEmailData.html
          };
          if (mailAttachmentsP) nomineeMailOptsP.attachments = mailAttachmentsP;
          await transporter.sendMail(nomineeMailOptsP);
          console.log(`[In-portal] Nominee consent email dispatched to ${nomineeEmail}`);
        }
      } catch (mailErr) {
        console.warn("Could not dispatch nominee consent email:", mailErr.message);
      }
    }

    res.json({
      success: true,
      seconderConsentStatus: newConsentStatus,
      status: newStatus
    });
  } catch (err) {
    console.error("In-app seconding consent error:", err);
    res.status(500).json({ error: 'Failed to update seconding consent' });
  }
});

// Nominee Willingness Consent API (via email link)
app.get('/api/nominations/nominee-consent', async (req, res) => {
  try {
    const { token, decision } = req.query;
    const portalUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    if (!token) {
      return res.send(generateNomineeConfirmationPage({
        success: false,
        errorMessage: 'Invalid verification link. Token is missing.',
        portalUrl
      }));
    }

    const application = await db.collection('applications').findOne({ nomineeConsentToken: token });
    if (!application) {
      return res.send(generateNomineeConfirmationPage({
        success: false,
        errorMessage: 'The nominee consent request was not found or has already been processed.',
        portalUrl
      }));
    }

    // Already processed
    if (application.nomineeConsentStatus && application.nomineeConsentStatus !== 'pending') {
      return res.send(generateNomineeConfirmationPage({
        success: true,
        decision: application.nomineeConsentStatus,
        nomineeName: application.nominee?.name || application.name,
        proposerName: application.proposer?.name,
        seconderName: application.seconder?.name,
        positions: application.targetPositions,
        portalUrl
      }));
    }

    const isAccept = decision === 'accept';
    const newNomineeConsentStatus = isAccept ? 'accepted' : 'declined';
    const newStatus = isAccept ? 'pending' : 'nominee_declined';

    await db.collection('applications').updateOne(
      { _id: application._id },
      {
        $set: {
          nomineeConsentStatus: newNomineeConsentStatus,
          status: newStatus,
          nomineeConsentAt: new Date(),
          submittedAt: isAccept ? new Date() : application.submittedAt
        }
      }
    );

    // Notify proposer of nominee decision
    try {
      const { transporter, senderAddress } = createMailTransporter();
      const proposerEmail = application.proposer?.email || application.proposerEmail;
      const positionsText = (application.targetPositions || []).join(', ');
      if (proposerEmail) {
        await transporter.sendMail({
          from: senderAddress,
          to: proposerEmail,
          subject: isAccept
            ? `Nomination Confirmed: ${application.nominee?.name} accepted & submitted for Scrutiny!`
            : `Notice: ${application.nominee?.name} declined the nomination for ${positionsText}`,
          html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: ${isAccept ? '#7c3aed' : '#dc2626'}; margin-top: 0;">${isAccept ? '✓ Nominee Accepted – Submitted for Scrutiny' : '✕ Nominee Declined the Nomination'}</h2>
            <p>Dear <strong>${application.proposer?.name || 'Alumni Member'}</strong>,</p>
            ${isAccept
              ? `<p>The nominee <strong>${application.nominee?.name}</strong> has <strong>accepted</strong> the nomination for <strong>${positionsText}</strong>. The nomination proposal has now been formally submitted to the Election Scrutiny Committee.</p>`
              : `<p>The nominee <strong>${application.nominee?.name}</strong> has <strong>declined</strong> to stand for the position of <strong>${positionsText}</strong>. In accordance with election bylaws, the proposal was not submitted to the Scrutiny Committee.</p>`
            }
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">Alumni Election Commission • National Engineering College</div>
          </div>`
        });
      }
    } catch (mailErr) {
      console.warn("Could not dispatch nominee decision notification:", mailErr.message);
    }

    res.send(generateNomineeConfirmationPage({
      success: true,
      decision: newNomineeConsentStatus,
      nomineeName: application.nominee?.name || application.name,
      proposerName: application.proposer?.name,
      seconderName: application.seconder?.name,
      positions: application.targetPositions,
      portalUrl
    }));
  } catch (err) {
    console.error("Nominee consent error:", err);
    res.status(500).send("Server error processing nominee consent");
  }
});

// Nominee Willingness Consent API (in-portal)
app.post('/api/nominations/nominee-consent', optionalAuth, async (req, res) => {
  try {
    const { applicationId, token, decision } = req.body;
    let query = {};
    if (token) {
      query.nomineeConsentToken = token;
    } else if (applicationId) {
      query._id = new ObjectId(applicationId);
      if (req.user?.email) {
        query.$or = [
          { 'nominee.email': req.user.email.toLowerCase() },
          { nomineeEmail: req.user.email.toLowerCase() },
          { applicantEmail: req.user.email.toLowerCase() }
        ];
      }
    } else {
      return res.status(400).json({ error: 'applicationId or token is required' });
    }

    const application = await db.collection('applications').findOne(query);
    if (!application) {
      return res.status(404).json({ error: 'Nomination not found or unauthorized' });
    }
    if (application.nomineeConsentStatus && application.nomineeConsentStatus !== 'pending') {
      return res.status(409).json({ error: 'Nominee consent has already been recorded.' });
    }

    const isAccept = decision === 'accept';
    const newNomineeConsentStatus = isAccept ? 'accepted' : 'declined';
    const newStatus = isAccept ? 'pending' : 'nominee_declined';

    await db.collection('applications').updateOne(
      { _id: application._id },
      {
        $set: {
          nomineeConsentStatus: newNomineeConsentStatus,
          status: newStatus,
          nomineeConsentAt: new Date(),
          submittedAt: isAccept ? new Date() : application.submittedAt
        }
      }
    );

    res.json({ success: true, nomineeConsentStatus: newNomineeConsentStatus, status: newStatus });
  } catch (err) {
    console.error("In-app nominee consent error:", err);
    res.status(500).json({ error: 'Failed to update nominee consent' });
  }
});

// List Applications with role-based visibility filter
app.get('/api/applications', optionalAuth, async (req, res) => {
  try {
    const statusFilter = req.query.status;
    const emailFilter = req.query.email;
    const roleType = req.query.roleType;
    let query = {};
    const isScrutinyView = req.query.source === 'scrutiny' || (!emailFilter && (!req.user || req.user.role === 'admin'));

    if (isScrutinyView) {
      // STRICT CONSTITUTIONAL RULE:
      // A nomination moves to the Scrutiny Committee ONLY after BOTH the seconder and nominee
      // have affirmatively consented. Pre-consent workflow states (pending_seconding, seconding_declined,
      // pending_nominee_consent, nominee_declined) must NEVER be viewed in the Scrutiny Panel.
      query.seconderConsentStatus = 'accepted';
      query.nomineeConsentStatus = 'accepted';
      query.status = { $nin: ['pending_seconding', 'seconding_declined', 'pending_nominee_consent', 'nominee_declined'] };

      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'withdrawn') {
          query.$or = [{ status: 'withdrawn' }, { withdrawn: true }];
          delete query.status;
        } else {
          query.status = statusFilter;
        }
      }
    } else {
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'withdrawn') {
          query.$or = [{ status: 'withdrawn' }, { withdrawn: true }];
        } else {
          query.status = statusFilter;
        }
      }
    }

    // Role-based visibility enforcement:
    // If authenticated as alumni, strictly restrict visibility to their own nominations
    if (req.user && req.user.role === 'alumni') {
      const alumniEmail = req.user.email.toLowerCase();
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { applicantEmail: alumniEmail },
          { nomineeEmail: alumniEmail },
          { proposerEmail: alumniEmail },
          { 'proposer.email': alumniEmail },
          { 'nominee.email': alumniEmail },
          { seconderEmail: alumniEmail },
          { 'seconder.email': alumniEmail }
        ]
      });
    } else if (emailFilter) {
      const emailLower = emailFilter.toLowerCase();
      if (roleType === 'proposed_by_me') {
        query.$or = [{ proposerEmail: emailLower }, { 'proposer.email': emailLower }];
      } else if (roleType === 'nominated_me') {
        query.$or = [{ applicantEmail: emailLower }, { nomineeEmail: emailLower }, { 'nominee.email': emailLower }];
      } else if (roleType === 'seconded_by_me') {
        query.$or = [{ seconderEmail: emailLower }, { 'seconder.email': emailLower }];
      } else {
        query.$or = [
          { applicantEmail: emailLower },
          { nomineeEmail: emailLower },
          { proposerEmail: emailLower },
          { 'proposer.email': emailLower },
          { 'nominee.email': emailLower },
          { seconderEmail: emailLower },
          { 'seconder.email': emailLower }
        ];
      }
    }

    const applications = await db.collection('applications').find(query).sort({ submittedAt: -1 }).toArray();
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Scrutiny Committee Verification - Strictly Admin Only
app.patch('/api/applications/:id/scrutiny', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verifiedCriteria, committeeRemarks, evaluatedBy, integrityScore } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const scrutinyDetails = {
      status,
      verifiedCriteria: verifiedCriteria || [],
      committeeRemarks: committeeRemarks || '',
      evaluatedBy: evaluatedBy || 'Alumni Election Scrutiny Committee (Principal, Alumni Coordinator & Office Bearers)',
      integrityScore: integrityScore || 10,
      scrutinizedAt: new Date(),
      scrutinizedBy: req.user.email,
      isFinalAndBinding: true
    };

    const result = await db.collection('applications').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          scrutinyDetails,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // --- SEND SCRUTINY APPROVAL EMAIL ---
    if (status === 'approved') {
      try {
        const application = await db.collection('applications').findOne({ _id: new ObjectId(id) });
        if (application) {
          const rawAnnouncement = await db.collection('announcements').findOne({}, { sort: { updatedAt: -1 } });
          const announcement = { ...DEFAULT_ANNOUNCEMENT, ...(rawAnnouncement || {}) };
          
          const smtpPass = (process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');
          const smtpUser = (process.env.SMTP_USER || 'muralisubbu11@gmail.com').trim();
          
          if (smtpPass) {
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: { user: smtpUser, pass: smtpPass },
              tls: { rejectUnauthorized: false }
            });
            
            const nomineeEmail = application.nominee?.email || application.applicantEmail;
            const nomineeName = application.nominee?.name || application.name;
            const targetPositions = application.targetPositions || [application.position];
            
            const { subject, html } = generateScrutinyApprovalEmail({
              nomineeName,
              targetPositions,
              announcement
            });
            
            const senderAddress = process.env.SMTP_FROM || `"Alumni Election Commission" <${smtpUser}>`;
            
            await transporter.sendMail({
              from: senderAddress,
              to: nomineeEmail,
              subject,
              html
            });
            console.log(`[Scrutiny] Approval email sent to nominee: ${nomineeEmail}`);
          }
        }
      } catch (emailErr) {
        console.error('[Scrutiny] Failed to send approval email:', emailErr.message);
      }
    }

    res.json({ success: true, message: `Application ${status} by Scrutiny Committee`, scrutinyDetails });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process scrutiny decision' });
  }
});

// Candidate Nomination Withdrawal
app.patch('/api/applications/:id/withdraw', async (req, res) => {
  try {
    const { id } = req.params;
    const { withdrawalReason } = req.body;

    const result = await db.collection('applications').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'withdrawn',
          withdrawn: true,
          withdrawalReason: withdrawalReason || 'Voluntary withdrawal by candidate',
          withdrawnAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ success: true, message: 'Nomination withdrawn successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to withdraw application' });
  }
});

// Publication of Final List of Candidates
app.get('/api/elections/final-list', async (req, res) => {
  try {
    const config = await db.collection('voting_config').findOne({}) || { status: 'not_started', candidatesPublished: false };
    const position = req.query.position;
    
    let query = {
      status: 'approved',
      withdrawn: { $ne: true }
    };
    if (position && position !== 'All') {
      query.targetPositions = position;
    }

    let finalCandidates = await db.collection('applications')
      .find(query)
      .sort({ 'targetPositions.0': 1, name: 1 })
      .toArray();

    // Frontend will hide candidates for non-admins if isPublished is false
    res.json({
      isPublished: !!config.candidatesPublished,
      publishedAt: config.publishedAt || null,
      notifiedAt: config.candidatesNotifiedAt || null,
      certificationNotice: "Official Final List of Eligible Candidates certified and published by the Scrutiny Committee. All committee decisions are final and binding.",
      committeeOfficers: [
        "Principal / Patron",
        "Alumni Coordinator & Election Convener",
        "President, Alumni Association",
        "Secretary, Alumni Association"
      ],
      candidates: finalCandidates
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch final candidate list' });
  }
});

// POST Unpublish Final List (Admin Only)
app.post('/api/elections/unpublish-final-list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.collection('voting_config').updateOne(
      {},
      { $set: { candidatesPublished: false, publishedAt: null } },
      { upsert: true }
    );
    res.json({ success: true, message: 'Final list unpublished and locked.' });
  } catch (error) {
    console.error('Error unpublishing final list:', error);
    res.status(500).json({ error: 'Server error during unpublishing' });
  }
});

// POST Publish Final List (Admin Only - Makes list visible on portal, does NOT send emails)
app.post('/api/elections/publish-final-list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Update config: marks candidates list as published
    await db.collection('voting_config').updateOne(
      {},
      { $set: { candidatesPublished: true, publishedAt: new Date() } },
      { upsert: true }
    );

    res.json({ success: true, message: 'Final candidate list published successfully. It is now visible to alumni.' });
  } catch (error) {
    console.error('Error publishing final list:', error);
    res.status(500).json({ error: 'Failed to publish final list' });
  }
});

// POST Notify All Alumni (Admin Only - Separate email broadcast for final candidate list)
app.post('/api/elections/notify-final-list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { electionYear = '2026', appUrl = 'http://localhost:5173' } = req.body;
    const notifiedAt = new Date();

    // Record notification timestamp in config
    await db.collection('voting_config').updateOne(
      {},
      { $set: { candidatesNotifiedAt: notifiedAt } },
      { upsert: true }
    );

    // Send emails in background
    (async () => {
      try {
        const smtpPass = (process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');
        const smtpUser = (process.env.SMTP_USER || 'muralisubbu11@gmail.com').trim();
        if (!smtpPass) {
          console.warn('[Notify Alumni] SMTP credentials missing. Skipping emails.');
          return;
        }

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: smtpUser, pass: smtpPass },
          tls: { rejectUnauthorized: false }
        });

        const members = await db.collection('members').find({
          "basic.email_id": { $in: ['tarun.ganapathi2007@gmail.com', 'infintygaming28@gmail.com'] }
        }).toArray();
        let sentCount = 0;
        const senderAddress = process.env.SMTP_FROM || `"Alumni Election Commission" <${smtpUser}>`;

        for (const member of members) {
          const email = member.basic?.email_id;
          const name = member.basic?.name || 'Esteemed Alumnus';
          if (!email) continue;
          
          try {
            const { subject, html } = generateCandidatesPublishedEmail({
              recipientName: name,
              electionYear,
              appUrl
            });
            await transporter.sendMail({ from: senderAddress, to: email, subject, html });
            sentCount++;
          } catch (e) {
            console.error(`[Notify Alumni] Email failed for ${email}`, e.message);
          }
          await new Promise(r => setTimeout(r, 200)); // Rate limit
        }
        console.log(`[Notify Alumni] Finished sending candidate announcements. Sent to ${sentCount} alumni.`);
      } catch (err) {
        console.error('[Notify Alumni] Error during broadcast:', err.message);
      }
    })();

    res.json({ success: true, message: 'Announcement emails are being sent in the background.', notifiedAt });
  } catch (error) {
    console.error('Error notifying alumni:', error);
    res.status(500).json({ error: 'Failed to broadcast announcement emails' });
  }
});

// Legacy status update - Strictly Admin Only
app.patch('/api/applications/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected', 'withdrawn'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateFields = { status, updatedAt: new Date() };
    if (status === 'withdrawn') updateFields.withdrawn = true;

    const result = await db.collection('applications').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
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

// Bulk remove rejected and withdrawn applications (keeps pending and approved proposals)
app.delete('/api/applications/rejected-withdrawn', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.collection('applications').deleteMany({
      $or: [
        { status: 'rejected' },
        { status: 'withdrawn' },
        { withdrawn: true }
      ]
    });
    res.json({
      success: true,
      message: `Removed ${result.deletedCount} rejected and withdrawn logs. Pending and approved records are retained.`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error removing rejected/withdrawn applications:", err);
    res.status(500).json({ error: 'Failed to remove rejected and withdrawn applications.' });
  }
});

// Backward-compatible alias for non-approved
app.delete('/api/applications/non-approved', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.collection('applications').deleteMany({
      $or: [
        { status: 'rejected' },
        { status: 'withdrawn' },
        { withdrawn: true }
      ]
    });
    res.json({
      success: true,
      message: `Removed ${result.deletedCount} rejected and withdrawn logs. Pending and approved records are retained.`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error removing rejected/withdrawn applications:", err);
    res.status(500).json({ error: 'Failed to remove rejected and withdrawn applications.' });
  }
});

// Delete single application - Admin Only
app.delete('/api/applications/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('applications').deleteOne({
      _id: new ObjectId(id)
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }
    res.json({ success: true, message: 'Application log removed successfully.' });
  } catch (err) {
    console.error("Error deleting application:", err);
    res.status(500).json({ error: 'Failed to delete application.' });
  }
});

// ============================================================
// VOTING SYSTEM API ROUTES
// ============================================================

const ELECTION_POSITIONS = [
  "President", "Vice President", "Secretary",
  "Joint Secretary", "Treasurer", "Joint Treasurer"
];

// Helper: get candidate summary per position
async function getCandidateSummary() {
  const approved = await db.collection('applications').find({
    status: 'approved', withdrawn: { $ne: true }
  }).toArray();
  const summary = ELECTION_POSITIONS.map(pos => ({
    position: pos,
    count: approved.filter(a => (a.targetPositions || []).includes(pos)).length
  }));
  return summary;
}

// Helper: send voting broadcast email to ALL alumni
async function sendVotingBroadcast(emailGenerator, announcement, candidateSummary) {
  const smtpPass = (process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');
  const smtpUser = (process.env.SMTP_USER || 'muralisubbu11@gmail.com').trim();
  if (!smtpPass) {
    console.warn('[Voting] SMTP_PASS not configured, skipping email broadcast');
    return { sent: 0, failed: 0 };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpUser, pass: smtpPass },
    tls: { rejectUnauthorized: false }
  });

  const alumniList = await db.collection('users').find({
    email: { $in: ['tarun.ganapathi2007@gmail.com', 'infintygaming28@gmail.com'] }
  }).toArray();

  const portalUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const senderAddress = process.env.SMTP_FROM || `"Alumni Election Commission" <${smtpUser}>`;
  let sent = 0, failed = 0;

  for (const user of alumniList) {
    const email = (user.email || '').trim().toLowerCase();
    if (!email) continue;
    try {
      const { subject, html } = emailGenerator({
        announcement,
        recipientName: user.name || 'Esteemed Alumni Member',
        recipientEmail: email,
        recipientDept: user.department || '',
        recipientBatch: user.graduationYear || '',
        portalUrl,
        candidateSummary
      });
      await transporter.sendMail({
        from: senderAddress,
        to: email,
        subject,
        html
      });
      sent++;
    } catch (err) {
      console.error(`[Voting] Failed to send to ${email}:`, err.message);
      failed++;
    }
  }

  return { sent, failed, total: alumniList.length };
}

// 1. GET voting status
app.get('/api/elections/voting/status', optionalAuth, async (req, res) => {
  try {
    const config = await db.collection('voting_config').findOne({}) || { status: 'not_started' };
    res.json({
      status: config.status || 'not_started',
      openedAt: config.openedAt || null,
      closedAt: config.closedAt || null,
      reminderSentAt: config.reminderSentAt || null,
      notifyLiveSentAt: config.notifyLiveSentAt || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get voting status' });
  }
});

// 2. POST open voting (Admin)
app.post('/api/elections/voting/open', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const existing = await db.collection('voting_config').findOne({});
    if (existing && existing.status === 'live') {
      return res.status(400).json({ error: 'Voting is already live.' });
    }

    // Ensure unique index on votes
    try {
      await db.collection('votes').createIndex(
        { voterEmail: 1, position: 1 },
        { unique: true }
      );
    } catch (e) { /* index may already exist */ }

    await db.collection('voting_config').updateOne(
      {},
      {
        $set: {
          status: 'live',
          openedAt: new Date(),
          openedBy: req.user.email,
          closedAt: null,
          closedBy: null
        }
      },
      { upsert: true }
    );

    // If skipBroadcast is requested, simply open voting without blasting email
    if (req.body?.skipBroadcast === true) {
      console.log(`[Voting] Opened by ${req.user.email} (notification separated).`);
      return res.json({
        success: true,
        message: 'Voting is now LIVE. Ballot is open for alumni members.'
      });
    }

    // Broadcast "Voting is Live" email to ALL alumni (when explicitly requested or default)
    const rawAnnouncement = await db.collection('announcements').findOne({}, { sort: { updatedAt: -1 } });
    const announcement = { ...DEFAULT_ANNOUNCEMENT, ...(rawAnnouncement || {}) };
    const candidateSummary = await getCandidateSummary();

    const broadcastResult = await sendVotingBroadcast(
      generateVotingLiveEmail,
      announcement,
      candidateSummary
    );

    await db.collection('voting_config').updateOne(
      {},
      { $set: { notifyLiveSentAt: new Date() } },
      { upsert: true }
    );

    console.log(`[Voting] Opened. Broadcast sent: ${broadcastResult.sent}/${broadcastResult.total}`);

    res.json({
      success: true,
      message: 'Voting is now LIVE. Broadcast email sent to all alumni.',
      broadcast: broadcastResult
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to open voting' });
  }
});

// 2b. POST notify alumni that voting is live (Admin - Separate Broadcast)
app.post('/api/elections/voting/notify-alumni', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rawAnnouncement = await db.collection('announcements').findOne({}, { sort: { updatedAt: -1 } });
    const announcement = { ...DEFAULT_ANNOUNCEMENT, ...(rawAnnouncement || {}) };
    const candidateSummary = await getCandidateSummary();

    const broadcastResult = await sendVotingBroadcast(
      generateVotingLiveEmail,
      announcement,
      candidateSummary
    );

    await db.collection('voting_config').updateOne(
      {},
      { $set: { notifyLiveSentAt: new Date() } },
      { upsert: true }
    );

    console.log(`[Voting] Live broadcast: ${broadcastResult.sent}/${broadcastResult.total}`);

    res.json({
      success: true,
      message: `Voting announcement sent to ${broadcastResult.sent} alumni members.`,
      broadcast: broadcastResult
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to broadcast voting announcement' });
  }
});

// 3. POST close voting (Admin)
app.post('/api/elections/voting/close', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.collection('voting_config').updateOne(
      {},
      {
        $set: {
          status: 'closed',
          closedAt: new Date(),
          closedBy: req.user.email
        }
      },
      { upsert: true }
    );

    res.json({ success: true, message: 'Voting has been closed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to close voting' });
  }
});

// 4. GET ballot — approved candidates grouped by position
app.get('/api/elections/voting/ballot', authenticateToken, async (req, res) => {
  try {
    const config = await db.collection('voting_config').findOne({}) || { status: 'not_started' };

    const candidates = await db.collection('applications').find({
      status: 'approved',
      withdrawn: { $ne: true }
    }).toArray();

    const ballot = ELECTION_POSITIONS.map(pos => ({
      position: pos,
      candidates: candidates
        .filter(c => (c.targetPositions || []).includes(pos))
        .map(c => ({
          _id: c._id,
          name: c.nominee?.name || c.name || '',
          email: c.nominee?.email || c.applicantEmail || '',
          department: c.nominee?.department || c.department || '',
          graduationYear: c.nominee?.graduationYear || c.graduationYear || '',
          photo: c.nomineePhoto || null,
          purposeStatement: c.purposeStatement || '',
          previousRoles: c.previousRoles || [],
          roleCategory: c.roleCategory || ''
        }))
    }));

    res.json({
      votingStatus: config.status || 'not_started',
      ballot
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get ballot' });
  }
});

// 5. POST cast vote
app.post('/api/elections/voting/cast', authenticateToken, async (req, res) => {
  try {
    // Admin cannot vote
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Administrators are not eligible to vote.' });
    }

    const config = await db.collection('voting_config').findOne({});
    if (!config || config.status !== 'live') {
      return res.status(400).json({ error: 'Voting is not currently open.' });
    }

    const { position, candidateId } = req.body;

    if (!position || !ELECTION_POSITIONS.includes(position)) {
      return res.status(400).json({ error: 'Invalid position.' });
    }

    if (!candidateId) {
      return res.status(400).json({ error: 'Candidate selection is required.' });
    }

    // Verify candidate is approved for this position
    const candidate = await db.collection('applications').findOne({
      _id: new ObjectId(candidateId),
      status: 'approved',
      withdrawn: { $ne: true },
      targetPositions: position
    });

    if (!candidate) {
      return res.status(400).json({ error: 'Selected candidate is not valid for this position.' });
    }

    // Check if already fully voted (all 6 positions)
    const existingVotes = await db.collection('votes').countDocuments({
      voterEmail: req.user.email
    });
    if (existingVotes >= ELECTION_POSITIONS.length) {
      return res.status(400).json({ error: 'You have already cast all your votes. Your ballot is sealed.' });
    }

    // Insert vote (unique index prevents duplicate position votes)
    try {
      await db.collection('votes').insertOne({
        voterId: req.user._id,
        voterEmail: req.user.email,
        voterName: req.user.name,
        position,
        candidateId: new ObjectId(candidateId),
        candidateName: candidate.nominee?.name || candidate.name || '',
        votedAt: new Date()
      });
    } catch (dupErr) {
      if (dupErr.code === 11000) {
        return res.status(400).json({ error: `You have already voted for the ${position} position.` });
      }
      throw dupErr;
    }

    // Check if all positions are now voted
    const totalVotes = await db.collection('votes').countDocuments({
      voterEmail: req.user.email
    });

    const allVoted = totalVotes >= ELECTION_POSITIONS.length;

    // If all 6 votes cast, send confirmation email
    if (allVoted) {
      try {
        const smtpPass = (process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');
        const smtpUser = (process.env.SMTP_USER || 'muralisubbu11@gmail.com').trim();
        if (smtpPass) {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: smtpUser, pass: smtpPass },
            tls: { rejectUnauthorized: false }
          });
          const rawAnnouncement = await db.collection('announcements').findOne({}, { sort: { updatedAt: -1 } });
          const announcement = { ...DEFAULT_ANNOUNCEMENT, ...(rawAnnouncement || {}) };
          const voteSummary = ELECTION_POSITIONS.map(p => ({ position: p }));
          const portalUrl = process.env.CLIENT_URL || 'http://localhost:5173';
          const { subject, html } = generateVoteConfirmationEmail({
            announcement,
            recipientName: req.user.name || 'Esteemed Alumni Member',
            recipientEmail: req.user.email,
            recipientDept: req.user.department || '',
            recipientBatch: req.user.graduationYear || '',
            voteSummary,
            portalUrl
          });
          const senderAddress = process.env.SMTP_FROM || `"Alumni Election Commission" <${smtpUser}>`;
          await transporter.sendMail({
            from: senderAddress,
            to: req.user.email,
            subject,
            html
          });
          console.log(`[Voting] Confirmation email sent to ${req.user.email}`);
        }
      } catch (emailErr) {
        console.error('[Voting] Failed to send confirmation email:', emailErr.message);
      }
    }

    res.json({
      success: true,
      message: `Vote for ${position} recorded successfully.`,
      totalVotes,
      allVoted,
      ballotSealed: allVoted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

// 6. GET my votes
app.get('/api/elections/voting/my-votes', authenticateToken, async (req, res) => {
  try {
    const votes = await db.collection('votes').find({
      voterEmail: req.user.email
    }).toArray();

    const votedPositions = votes.map(v => v.position);
    const allVoted = votedPositions.length >= ELECTION_POSITIONS.length;

    res.json({
      votes: votes.map(v => ({
        position: v.position,
        candidateId: v.candidateId,
        candidateName: v.candidateName,
        votedAt: v.votedAt
      })),
      votedPositions,
      totalVoted: votedPositions.length,
      totalPositions: ELECTION_POSITIONS.length,
      allVoted,
      ballotSealed: allVoted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get your votes' });
  }
});

// 7. GET results (Admin only while live; everyone after closed)
app.get('/api/elections/voting/results', optionalAuth, async (req, res) => {
  try {
    const config = await db.collection('voting_config').findOne({}) || { status: 'not_started' };
    const isAdmin = req.user && req.user.role === 'admin';

    // Only admin can see results while voting is live
    if (config.status === 'live' && !isAdmin) {
      return res.status(403).json({ error: 'Results are not available while voting is in progress.' });
    }

    if (config.status === 'not_started' && !isAdmin) {
      return res.status(400).json({ error: 'Voting has not started yet.' });
    }

    const allVotes = await db.collection('votes').find({}).toArray();
    const uniqueVoters = new Set(allVotes.map(v => v.voterEmail)).size;
    const totalAlumni = await db.collection('users').countDocuments({ email: { $ne: ADMIN_EMAIL } });

    const results = ELECTION_POSITIONS.map(pos => {
      const posVotes = allVotes.filter(v => v.position === pos);
      const tally = {};
      posVotes.forEach(v => {
        const key = v.candidateId.toString();
        if (!tally[key]) {
          tally[key] = { candidateId: key, candidateName: v.candidateName, votes: 0 };
        }
        tally[key].votes++;
      });
      const candidates = Object.values(tally).sort((a, b) => b.votes - a.votes);
      const maxVotes = candidates.length > 0 ? candidates[0].votes : 0;
      const isTied = candidates.filter(c => c.votes === maxVotes).length > 1 && maxVotes > 0;

      return {
        position: pos,
        totalVotes: posVotes.length,
        candidates,
        winner: !isTied && candidates.length > 0 ? candidates[0] : null,
        isTied
      };
    });

    res.json({
      votingStatus: config.status,
      totalVotesCast: allVotes.length,
      uniqueVoters,
      totalAlumni,
      turnoutPercent: totalAlumni > 0 ? Math.round((uniqueVoters / totalAlumni) * 100) : 0,
      results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

app.post('/api/elections/voting/clear-all-votes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.collection('votes').deleteMany({});
    await db.collection('voting_config').updateOne(
      {},
      { $set: { status: 'not_started' } },
      { upsert: true }
    );
    res.json({ success: true, message: `Successfully cleared ${result.deletedCount} votes and reset voting status to 'Not Started'.` });
  } catch (err) {
    console.error('Error clearing votes:', err);
    res.status(500).json({ error: 'Failed to clear votes' });
  }
});

// 8. POST send reminder email (Admin) — sends to ALL alumni
app.post('/api/elections/voting/send-reminder', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rawAnnouncement = await db.collection('announcements').findOne({}, { sort: { updatedAt: -1 } });
    const announcement = { ...DEFAULT_ANNOUNCEMENT, ...(rawAnnouncement || {}) };
    const candidateSummary = await getCandidateSummary();

    const broadcastResult = await sendVotingBroadcast(
      generateVotingReminderEmail,
      announcement,
      candidateSummary
    );

    // Record reminder sent timestamp
    await db.collection('voting_config').updateOne(
      {},
      { $set: { reminderSentAt: new Date() } },
      { upsert: true }
    );

    console.log(`[Voting] Reminder broadcast: ${broadcastResult.sent}/${broadcastResult.total}`);

    res.json({
      success: true,
      message: `Election reminder sent to ${broadcastResult.sent} alumni members.`,
      broadcast: broadcastResult
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});
