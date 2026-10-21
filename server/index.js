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
const { generateElectionAnnouncementEmail } = require('./officialElectionNoticeEmail');
const {
  generateSeconderConsentEmail, 
  generateSeconderConfirmationPage,
  generateNomineeConsentEmail,
  generateNomineeConfirmationPage,
  generateVotingReminderEmail,
  generateVoting2DayReminderEmail,
  generateVoting1DayReminderEmail,
  generateVotingLiveEmail,
  generateVoteConfirmationEmail,
  generateScrutinyApprovalEmail,
  generateCandidatesPublishedEmail
} = require('./electionEmailTemplate');

const app = express();
const port = process.env.PORT || 5000;
const ELECTION_EMAIL_LOGO_PATH = path.join(__dirname, '..', 'public', 'nec-logo.png');
const DEFAULT_ELECTION_EMAIL_LOGO_URL = 'https://raw.githubusercontent.com/TharunG2006/Election_Management_System/main/public/nec-logo.png';

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
  const trimmed = String(photoDataUrl).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // 1. Try Cloudinary if configured
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const result = await cloudinary.uploader.upload(trimmed, {
        folder: 'election_nominees',
        resource_type: 'image'
      });
      if (result && result.secure_url) {
        console.log(`[PhotoHost] Nominee photo hosted at Cloudinary: ${result.secure_url}`);
        return result.secure_url;
      }
    } catch (err) {
      console.warn("[PhotoHost] Could not upload photo to Cloudinary:", err.message);
    }
  }

  // 2. Upload to public permanent image host (Catbox) - free, anonymous, direct https link
  try {
    const matches = trimmed.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : 'image/jpeg';
    const buffer = Buffer.from(matches ? matches[2] : trimmed, 'base64');
    const ext = mimeType.split('/')[1]?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const blob = new Blob([buffer], { type: mimeType });
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', blob, `nominee_${Date.now()}.${ext}`);

    const catboxRes = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form
    });
    if (catboxRes.ok) {
      const hostedUrl = (await catboxRes.text()).trim();
      if (/^https?:\/\//i.test(hostedUrl)) {
        console.log(`[PhotoHost] Nominee photo hosted at Catbox: ${hostedUrl}`);
        return hostedUrl;
      }
    }
  } catch (catboxErr) {
    console.warn("[PhotoHost] Could not upload photo to Catbox:", catboxErr.message);
  }

  // 3. Save local copy to uploads directory
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const matches = trimmed.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : 'image/jpeg';
    const buffer = Buffer.from(matches ? matches[2] : trimmed, 'base64');
    const ext = mimeType.split('/')[1]?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const filename = `nominee_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);

    const serverUrl = (process.env.SERVER_URL || '').trim();
    if (/^https:\/\//i.test(serverUrl)) {
      const publicUrl = `${serverUrl.replace(/\/$/, '')}/uploads/${filename}`;
      console.log(`[PhotoHost] Nominee photo saved and served at: ${publicUrl}`);
      return publicUrl;
    }
  } catch (localErr) {
    console.warn("[PhotoHost] Could not save local photo copy:", localErr.message);
  }

  // 4. Return original data URI if remote hosting was unreachable
  return trimmed;
}

function getPublicEmailImageUrl(imageUrl) {
  const normalized = String(imageUrl || '').trim();
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (/^data:image\/[a-zA-Z0-9+.-]+;base64,/i.test(normalized)) return normalized;
  return null;
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;
const CONSENT_RESPONSE_WINDOW_MS = 24 * 60 * 60 * 1000;
const CONSENT_EXPIRY_SWEEP_MS = 60 * 1000;

function deadlineFrom(startedAt) {
  const start = new Date(startedAt || 0);
  return Number.isNaN(start.getTime())
    ? null
    : new Date(start.getTime() + CONSENT_RESPONSE_WINDOW_MS);
}

async function normalizePendingConsentDeadlines() {
  const applications = db.collection('applications');
  const pending = await applications.find({
    status: { $in: ['pending_seconding', 'pending_nominee_consent'] }
  }).project({
    status: 1,
    createdAt: 1,
    submittedAt: 1,
    updatedAt: 1,
    seconderConsentAt: 1,
    seconderConsentRequestedAt: 1,
    seconderConsentExpiresAt: 1,
    nomineeConsentRequestedAt: 1,
    nomineeConsentExpiresAt: 1
  }).toArray();

  const operations = [];
  for (const application of pending) {
    if (application.status === 'pending_seconding') {
      const startedAt = application.seconderConsentRequestedAt || application.createdAt || application.submittedAt;
      const deadline = deadlineFrom(startedAt);
      const currentDeadline = new Date(application.seconderConsentExpiresAt || 0);
      if (deadline && (Number.isNaN(currentDeadline.getTime()) || currentDeadline > deadline)) {
        operations.push({
          updateOne: {
            filter: { _id: application._id, status: 'pending_seconding' },
            update: { $set: { seconderConsentRequestedAt: new Date(startedAt), seconderConsentExpiresAt: deadline } }
          }
        });
      }
    }

    if (application.status === 'pending_nominee_consent') {
      const startedAt = application.nomineeConsentRequestedAt || application.seconderConsentAt || application.updatedAt || application.submittedAt;
      const deadline = deadlineFrom(startedAt);
      const currentDeadline = new Date(application.nomineeConsentExpiresAt || 0);
      if (deadline && (Number.isNaN(currentDeadline.getTime()) || currentDeadline > deadline)) {
        operations.push({
          updateOne: {
            filter: { _id: application._id, status: 'pending_nominee_consent' },
            update: { $set: { nomineeConsentRequestedAt: new Date(startedAt), nomineeConsentExpiresAt: deadline } }
          }
        });
      }
    }
  }

  if (operations.length) {
    await applications.bulkWrite(operations, { ordered: false });
  }
}

async function expirePendingConsents(now = new Date()) {
  const applications = db.collection('applications');
  const [secondingResult, nomineeResult] = await Promise.all([
    applications.updateMany(
      {
        status: 'pending_seconding',
        seconderConsentExpiresAt: { $lte: now },
        $or: [
          { seconderConsentStatus: 'pending' },
          { seconderConsentStatus: { $exists: false } }
        ]
      },
      {
        $set: {
          status: 'seconding_declined',
          seconderConsentStatus: 'declined',
          seconderConsentAt: now,
          seconderConsentExpiredAt: now,
          seconderConsentDecisionReason: 'No response received within 24 hours.'
        }
      }
    ),
    applications.updateMany(
      {
        status: 'pending_nominee_consent',
        nomineeConsentExpiresAt: { $lte: now },
        $or: [
          { nomineeConsentStatus: 'pending' },
          { nomineeConsentStatus: { $exists: false } }
        ]
      },
      {
        $set: {
          status: 'nominee_declined',
          nomineeConsentStatus: 'declined',
          nomineeConsentAt: now,
          nomineeConsentExpiredAt: now,
          nomineeConsentDecisionReason: 'No response received within 24 hours.'
        }
      }
    )
  ]);

  const expiredCount = secondingResult.modifiedCount + nomineeResult.modifiedCount;
  if (expiredCount) {
    console.log(`[ConsentExpiry] Automatically declined ${expiredCount} expired consent request(s).`);
  }
  return expiredCount;
}

async function expireApplicationConsentIfNeeded(application, consentType, now = new Date()) {
  const isSeconding = consentType === 'seconder';
  const pendingStatus = isSeconding ? 'pending_seconding' : 'pending_nominee_consent';
  const consentStatusField = isSeconding ? 'seconderConsentStatus' : 'nomineeConsentStatus';
  const expiresField = isSeconding ? 'seconderConsentExpiresAt' : 'nomineeConsentExpiresAt';
  const expiredAtField = isSeconding ? 'seconderConsentExpiredAt' : 'nomineeConsentExpiredAt';
  const consentAtField = isSeconding ? 'seconderConsentAt' : 'nomineeConsentAt';
  const reasonField = isSeconding ? 'seconderConsentDecisionReason' : 'nomineeConsentDecisionReason';
  const declinedStatus = isSeconding ? 'seconding_declined' : 'nominee_declined';
  const expiresAt = new Date(application?.[expiresField] || 0);

  if (
    application?.status !== pendingStatus ||
    (application?.[consentStatusField] && application[consentStatusField] !== 'pending') ||
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt > now
  ) {
    return false;
  }

  const result = await db.collection('applications').updateOne(
    {
      _id: application._id,
      status: pendingStatus,
      $or: [
        { [consentStatusField]: 'pending' },
        { [consentStatusField]: { $exists: false } }
      ]
    },
    {
      $set: {
        status: declinedStatus,
        [consentStatusField]: 'declined',
        [consentAtField]: now,
        [expiredAtField]: now,
        [reasonField]: 'No response received within 24 hours.'
      }
    }
  );
  return result.modifiedCount > 0;
}

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
      await normalizePendingConsentDeadlines();
      await expirePendingConsents();

      const consentExpiryTimer = setInterval(() => {
        expirePendingConsents().catch((err) => {
          console.error('[ConsentExpiry] Sweep failed:', err.message);
        });
      }, CONSENT_EXPIRY_SWEEP_MS);
      consentExpiryTimer.unref();

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
  emailSubject: "National Engineering College Alumni Association Election 2026: Official notice and schedule [AA/ELEC/2026/01]",
  emailIntro: "The Alumni Association Election Commission invites eligible alumni members to participate in the 2026 election for Executive Office Bearers.",
  emailBody: "This notice summarises the eligibility requirements, nomination process, publication milestones and voting window. All election actions and status updates are handled through the Alumni Election Portal.",
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

const ELECTION_TIMEZONE_OFFSET_MINUTES = 330; // Asia/Kolkata (IST)

function configuredDateParts(value) {
  const dateText = value instanceof Date ? value.toISOString() : String(value || '');
  const match = dateText.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
}

function configuredTimeParts(value, fallback = '12:00 AM') {
  const timeText = String(value || fallback).trim();
  const match = timeText.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return configuredTimeParts(fallback, '12:00 AM');

  let hour = Number(match[1]);
  const meridiem = (match[4] || '').toUpperCase();
  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (meridiem === 'PM' && hour !== 12) hour += 12;

  return { hour, minute: Number(match[2]), second: Number(match[3] || 0) };
}

function electionInstant(dateValue, timeValue = '12:00 AM') {
  const date = configuredDateParts(dateValue);
  if (!date) return null;
  const time = configuredTimeParts(timeValue);
  return new Date(
    Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute, time.second) -
      ELECTION_TIMEZONE_OFFSET_MINUTES * 60 * 1000
  );
}

function electionDayEnd(dateValue) {
  const date = configuredDateParts(dateValue);
  if (!date) return null;
  return new Date(
    Date.UTC(date.year, date.month - 1, date.day + 1) -
      ELECTION_TIMEZONE_OFFSET_MINUTES * 60 * 1000 - 1
  );
}

function isWithin(now, start, end) {
  return !!start && !!end && now >= start && now <= end;
}

function buildElectionAvailability(announcement, now = new Date()) {
  const nominationStart = electionInstant(announcement.nominationStartDate);
  const nominationEnd = electionDayEnd(announcement.nominationDeadline);
  const withdrawalEnd = electionDayEnd(announcement.withdrawalDeadline);
  const finalListStart = electionInstant(announcement.finalListDate);
  const votingDate = announcement.electionDate || announcement.votingDateTime || announcement.agmDate;
  const votingStart = electionInstant(votingDate, announcement.electionStartTime || '10:00 AM');
  const votingEnd = electionInstant(votingDate, announcement.electionEndTime || '04:00 PM');
  const electionEnd = votingEnd || electionDayEnd(votingDate);

  const availability = {
    announcements: !!electionEnd && now <= electionEnd,
    eligibility: true,
    apply: isWithin(now, nominationStart, nominationEnd),
    applications: isWithin(now, nominationStart, withdrawalEnd),
    finalList: isWithin(now, finalListStart, electionEnd),
    voting: isWithin(now, votingStart, votingEnd),
    timelines: !!electionEnd && now <= electionEnd
  };

  const toIso = (value) => value ? value.toISOString() : null;
  return {
    availability,
    timezone: 'Asia/Kolkata',
    serverTime: now.toISOString(),
    windows: {
      nomination: { start: toIso(nominationStart), end: toIso(nominationEnd) },
      applications: { start: toIso(nominationStart), end: toIso(withdrawalEnd) },
      finalList: { start: toIso(finalListStart), end: toIso(electionEnd) },
      voting: { start: toIso(votingStart), end: toIso(votingEnd) }
    }
  };
}

async function getElectionScheduleContext() {
  const stored = await db.collection('announcements').findOne({}, { sort: { updatedAt: -1 } });
  const announcement = { ...DEFAULT_ANNOUNCEMENT, ...(stored || {}) };
  return { announcement, ...buildElectionAvailability(announcement) };
}

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
    const votingDate = updateData.electionDate || updateData.votingDateTime;
    const votingStart = electionInstant(votingDate, updateData.electionStartTime);
    const votingEnd = electionInstant(votingDate, updateData.electionEndTime);
    if (!votingDate || !votingStart || !votingEnd || votingEnd <= votingStart) {
      return res.status(400).json({
        error: 'Voting date, start time, and end time are required. The end time must be after the start time.'
      });
    }
    await db.collection('announcements').updateOne(
      {},
      { $set: updateData },
      { upsert: true }
    );
    await db.collection('publication_settings').updateOne(
      {},
      { $set: { announcements: updateData.status === 'published', updatedAt: new Date(), updatedBy: req.user.email } },
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

// ============================================================
// COMPREHENSIVE ALUMNI PUBLICATION CONTROLS
// ============================================================

// Helper: retrieve current publication status across all alumni modules
async function getPublicationSettings() {
  const custom = await db.collection('publication_settings').findOne({}) || {};
  const ann = await db.collection('announcements').findOne({}, { sort: { updatedAt: -1 } });
  const voteCfg = await db.collection('voting_config').findOne({}) || {};

  return {
    announcements: custom.announcements !== undefined ? !!custom.announcements : (ann ? ann.status === 'published' : true),
    eligibility: custom.eligibility !== undefined ? !!custom.eligibility : true,
    apply: custom.apply !== undefined ? !!custom.apply : true,
    applications: custom.applications !== undefined ? !!custom.applications : true,
    finalList: custom.finalList !== undefined ? !!custom.finalList : !!voteCfg.candidatesPublished,
    voting: custom.voting !== undefined ? !!custom.voting : (voteCfg.status === 'live'),
    timelines: custom.timelines !== undefined ? !!custom.timelines : true
  };
}

async function getEffectiveAlumniSettings() {
  const settings = await getPublicationSettings();
  const schedule = await getElectionScheduleContext();
  const effectiveSettings = Object.fromEntries(
    Object.keys(settings).map((key) => [key, !!settings[key] && !!schedule.availability[key]])
  );
  return { settings, effectiveSettings, ...schedule };
}

// GET Publication Status for all modules
app.get('/api/elections/publication-status', optionalAuth, async (req, res) => {
  try {
    const { settings, effectiveSettings, availability, windows, timezone, serverTime } = await getEffectiveAlumniSettings();
    const isAdmin = req.user && req.user.role === 'admin';
    res.json({
      success: true,
      settings,
      effectiveSettings,
      availability,
      windows,
      timezone,
      serverTime,
      isAdmin
    });
  } catch (err) {
    console.error("Error fetching publication status:", err);
    res.status(500).json({ error: 'Failed to fetch publication status' });
  }
});

// POST Update Publication Status for specific module or full set (Admin Only)
app.post('/api/elections/publication-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const key = req.body.moduleKey || req.body.module;
    const pubStatus = req.body.isPublished !== undefined ? req.body.isPublished : req.body.status;
    const { settings: newSettings } = req.body;
    let updates = {};

    if (key) {
      updates[key] = !!pubStatus;
    } else if (newSettings && typeof newSettings === 'object') {
      updates = { ...newSettings };
    } else {
      return res.status(400).json({ error: 'moduleKey/module and isPublished/status or settings object is required.' });
    }

    // Sync underlying models
    if (updates.announcements !== undefined) {
      await db.collection('announcements').updateOne(
        {},
        { $set: { status: updates.announcements ? 'published' : 'draft', updatedAt: new Date(), updatedBy: req.user.email } },
        { upsert: true }
      );
    }

    if (updates.finalList !== undefined) {
      await db.collection('voting_config').updateOne(
        {},
        { $set: { candidatesPublished: !!updates.finalList, publishedAt: updates.finalList ? new Date() : null } },
        { upsert: true }
      );
    }

    if (updates.voting !== undefined) {
      await db.collection('voting_config').updateOne(
        {},
        {
          $set: {
            status: updates.voting ? 'live' : 'closed',
            ...(updates.voting ? { openedAt: new Date(), openedBy: req.user.email, closedAt: null } : { closedAt: new Date(), closedBy: req.user.email })
          }
        },
        { upsert: true }
      );
    }

    await db.collection('publication_settings').updateOne(
      {},
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
          updatedBy: req.user.email
        }
      },
      { upsert: true }
    );

    const settings = await getPublicationSettings();
    res.json({
      success: true,
      message: key ? `Module '${key}' ${updates[key] ? 'published live to alumni' : 'unpublished and set to draft'}.` : 'Publication settings updated.',
      settings
    });
  } catch (err) {
    console.error("Error updating publication status:", err);
    res.status(500).json({ error: 'Failed to update publication status' });
  }
});

// POST Publish Everything to Alumni (Admin Only)
app.post('/api/elections/publication-status/publish-all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allPublished = {
      announcements: true,
      eligibility: true,
      apply: true,
      applications: true,
      finalList: true,
      voting: true,
      timelines: true
    };

    // Sync models
    await db.collection('announcements').updateOne(
      {},
      { $set: { status: 'published', updatedAt: new Date(), updatedBy: req.user.email } },
      { upsert: true }
    );

    await db.collection('voting_config').updateOne(
      {},
      {
        $set: {
          candidatesPublished: true,
          publishedAt: new Date(),
          status: 'live',
          openedAt: new Date(),
          openedBy: req.user.email,
          closedAt: null
        }
      },
      { upsert: true }
    );

    await db.collection('publication_settings').updateOne(
      {},
      {
        $set: {
          ...allPublished,
          updatedAt: new Date(),
          updatedBy: req.user.email
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'All 7 election modules published live to alumni!',
      settings: allPublished
    });
  } catch (err) {
    console.error("Error publishing all modules:", err);
    res.status(500).json({ error: 'Failed to publish all modules' });
  }
});

// POST Unpublish Everything from Alumni (Admin Only)
app.post('/api/elections/publication-status/unpublish-all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allUnpublished = {
      announcements: false,
      eligibility: false,
      apply: false,
      applications: false,
      finalList: false,
      voting: false,
      timelines: false
    };

    // Sync models
    await db.collection('announcements').updateOne(
      {},
      { $set: { status: 'draft', updatedAt: new Date(), updatedBy: req.user.email } },
      { upsert: true }
    );

    await db.collection('voting_config').updateOne(
      {},
      {
        $set: {
          candidatesPublished: false,
          publishedAt: null,
          status: 'closed',
          closedAt: new Date(),
          closedBy: req.user.email
        }
      },
      { upsert: true }
    );

    await db.collection('publication_settings').updateOne(
      {},
      {
        $set: {
          ...allUnpublished,
          updatedAt: new Date(),
          updatedBy: req.user.email
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'All election modules unpublished and hidden from alumni.',
      settings: allUnpublished
    });
  } catch (err) {
    console.error("Error unpublishing all modules:", err);
    res.status(500).json({ error: 'Failed to unpublish all modules' });
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
    const electionLogoSource = process.env.ELECTION_EMAIL_LOGO_URL || DEFAULT_ELECTION_EMAIL_LOGO_URL;

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
          electionPositions: ELECTION_POSITIONS,
          recipientName,
          recipientEmail: email,
          recipientDept,
          recipientBatch,
          portalUrl,
          logoSource: electionLogoSource
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
    const logoSource = fs.existsSync(ELECTION_EMAIL_LOGO_PATH)
      ? `data:image/png;base64,${fs.readFileSync(ELECTION_EMAIL_LOGO_PATH).toString('base64')}`
      : `${portalUrl.replace(/\/$/, '')}/nec-logo.png`;
    const emailData = generateElectionAnnouncementEmail({
      announcement,
      electionPositions: ELECTION_POSITIONS,
      recipientName: req.user.name || 'Esteemed Alumni Member',
      recipientEmail: req.user.email,
      recipientDept: req.user.department || 'Computer Science and Engineering',
      recipientBatch: req.user.batch || 'Class of 2022',
      portalUrl,
      logoSource
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
app.post('/api/applications', optionalAuth, async (req, res) => {
  try {
    // Admins may prepare records at any time; alumni must be inside the published nomination window.
    const { effectiveSettings } = await getEffectiveAlumniSettings();
    if (req.user?.role !== 'admin' && !effectiveSettings.apply) {
      return res.status(403).json({
        error: 'Nomination submissions are only accepted between the configured nomination start date and deadline.'
      });
    }

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
    const positions = (Array.isArray(targetPositions) ? targetPositions : (targetPositions ? [targetPositions] : []))
      .map(position => String(position || '').trim())
      .filter(Boolean);
    if (positions.length !== 1) {
      return res.status(400).json({ error: 'Exactly one office bearer position must be selected for each nomination.' });
    }
    if (!ELECTION_POSITIONS.includes(positions[0])) {
      return res.status(400).json({ error: 'The selected office bearer position is not valid.' });
    }
    const allowedResponsibilityRoles = [
      'Office Bearer',
      'Chapter Coordinator',
      'Alumni Association Club Coordinator',
      'Mentorship or Placement Coordinator',
      'Data Management Team Coordinator'
    ];
    const submittedPreviousRoles = Array.isArray(previousRoles)
      ? previousRoles
      : (roleCategory ? String(roleCategory).split(',') : []);
    const normalizedPreviousRoles = [...new Set(submittedPreviousRoles
      .map(role => String(role || '').trim())
      .filter(role => allowedResponsibilityRoles.includes(role)))];
    if (normalizedPreviousRoles.length === 0) {
      return res.status(400).json({ error: 'Select at least one previous responsibility held by the nominee.' });
    }

    const normalizedRoleDurations = {};
    const serviceYearOwners = new Map();
    for (const role of normalizedPreviousRoles) {
      const years = [...new Set(
        (Array.isArray(roleDurations?.[role]) ? roleDurations[role] : [])
          .map(year => Number(year))
          .filter(year => Number.isInteger(year) && year >= 2021 && year <= 2026)
      )].sort((a, b) => a - b);
      if (years.length === 0) {
        return res.status(400).json({ error: `Select at least one service year for ${role}.` });
      }
      for (const year of years) {
        if (serviceYearOwners.has(year)) {
          return res.status(400).json({
            error: `${year} cannot be assigned to both ${serviceYearOwners.get(year)} and ${role}.`
          });
        }
        serviceYearOwners.set(year, role);
      }
      normalizedRoleDurations[role] = years.map(String);
    }

    const serviceYears = [...serviceYearOwners.keys()].sort((a, b) => a - b);
    if (serviceYears.length === 0) {
      return res.status(400).json({ error: 'Select at least one nominee service year between 2021 and 2026.' });
    }
    const hasContinuousService = serviceYears.every(
      (year, index) => index === 0 || year === serviceYears[index - 1] + 1
    );
    if (!hasContinuousService) {
      return res.status(400).json({ error: 'Nominee service years must be consecutive without a break.' });
    }
    const normalizedContinuousService = {
      ...(continuousService || {}),
      years: serviceYears.length,
      serviceYears: serviceYears.map(String),
      withoutGap: true
    };
    if (positions.includes('President')) {
      if (!normalizedRoleDurations['Office Bearer']?.length) {
        return res.status(400).json({
          error: 'President nominees must have at least one Office Bearer service year between 2021 and 2026.'
        });
      }
    }

    // Generate secure seconding consent token
    const seconderConsentToken = crypto.randomBytes(32).toString('hex');
    const seconderConsentRequestedAt = new Date();

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
      targetPositions: positions,
      previousRoles: normalizedPreviousRoles,
      roleDurations: normalizedRoleDurations,
      roleCategory: normalizedPreviousRoles.join(', '),
      continuousService: normalizedContinuousService,
      purposeStatement: purposeStatement || motivation || '',
      motivation: purposeStatement || motivation || '',
      nomineePhoto: nomineePhoto || null,
      // Initially pending seconder willingness - NOT yet submitted for scrutiny!
      status: 'pending_seconding',
      seconderConsentStatus: 'pending',
      seconderConsentToken,
      seconderConsentRequestedAt,
      seconderConsentExpiresAt: new Date(seconderConsentRequestedAt.getTime() + CONSENT_RESPONSE_WINDOW_MS),
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

      // Only public HTTPS images are embedded in email. Base64/CID fallbacks create
      // visible "noname" attachment chips in Gmail, so unhosted photos stay portal-only.
      const emailPhoto = getPublicEmailImageUrl(newApplication.nomineePhoto);

      const emailData = generateSeconderConsentEmail({
        proposer: newApplication.proposer,
        nominee: newApplication.nominee,
        seconder: newApplication.seconder,
        targetPositions: newApplication.targetPositions,
        previousRoles: newApplication.previousRoles,
        roleDurations: newApplication.roleDurations,
        roleCategory: newApplication.roleCategory,
        purposeStatement: newApplication.purposeStatement,
        nomineePhoto: emailPhoto || newApplication.nomineePhoto || null,
        consentToken: seconderConsentToken,
        consentExpiresAt: newApplication.seconderConsentExpiresAt,
        portalUrl,
        apiBaseUrl
      });

      const seconderMailOptions = {
        from: senderAddress,
        to: seconderEmail,
        subject: emailData.subject,
        html: emailData.html
      };
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
    const { effectiveSettings } = await getEffectiveAlumniSettings();

    if (!effectiveSettings.apply) {
      return res.status(403).send(generateSeconderConfirmationPage({
        success: false,
        errorMessage: 'The nomination consent window is closed.',
        portalUrl
      }));
    }

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

    if (application.seconderConsentExpiredAt || await expireApplicationConsentIfNeeded(application, 'seconder')) {
      return res.status(410).send(generateSeconderConfirmationPage({
        success: false,
        errorMessage: 'The 24-hour seconding consent period has expired. This request was automatically declined.',
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

    const consentRecordedAt = new Date();
    const nomineeConsentExpiresAt = new Date(consentRecordedAt.getTime() + CONSENT_RESPONSE_WINDOW_MS);
    const updateFields = {
      seconderConsentStatus: newConsentStatus,
      status: newStatus,
      seconderConsentAt: consentRecordedAt
    };
    if (nomineeConsentToken) {
      updateFields.nomineeConsentToken = nomineeConsentToken;
      updateFields.nomineeConsentStatus = 'pending';
      updateFields.nomineeConsentRequestedAt = consentRecordedAt;
      updateFields.nomineeConsentExpiresAt = nomineeConsentExpiresAt;
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

        emailNomineePhoto = getPublicEmailImageUrl(emailNomineePhoto);

        const nomineeEmailData = generateNomineeConsentEmail({
          proposer: application.proposer || { name: '', email: proposerEmail },
          nominee: application.nominee || { name: application.name, email: nomineeEmail },
          seconder: application.seconder || { name: '', email: application.seconderEmail },
          targetPositions: application.targetPositions,
          previousRoles: application.previousRoles,
          roleDurations: application.roleDurations,
          roleCategory: application.roleCategory,
          purposeStatement: application.purposeStatement || application.motivation,
          nomineePhoto: emailNomineePhoto || application.nomineePhoto || null,
          consentToken: nomineeConsentToken,
          consentExpiresAt: nomineeConsentExpiresAt,
          portalUrl: portalUrl2,
          apiBaseUrl
        });
        const nomineeMailOpts = {
          from: senderAddress,
          to: nomineeEmail,
          subject: nomineeEmailData.subject,
          html: nomineeEmailData.html
        };
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

// Resend Seconding Willingness Email for a nomination
app.post('/api/nominations/:id/resend-seconding-email', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }

    const application = await db.collection('applications').findOne({ _id: new ObjectId(id) });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const seconderEmail = (application.seconder?.email || application.seconderEmail || '').trim().toLowerCase();
    if (!seconderEmail) {
      return res.status(400).json({ error: 'Seconder email address not found on application.' });
    }

    // Host nominee photo if still base64
    let emailNomineePhoto = application.nomineePhotoUrl || application.nomineePhoto;
    if (emailNomineePhoto && (emailNomineePhoto.startsWith('data:') || !emailNomineePhoto.startsWith('http'))) {
      try {
        const hosted = await resolveNomineePhotoUrl(emailNomineePhoto);
        if (hosted && hosted.startsWith('http')) {
          emailNomineePhoto = hosted;
          await db.collection('applications').updateOne(
            { _id: application._id },
            { $set: { nomineePhoto: hosted, nomineePhotoUrl: hosted } }
          );
        }
      } catch (err) {
        console.warn("Could not host photo during resend:", err.message);
      }
    }
    emailNomineePhoto = getPublicEmailImageUrl(emailNomineePhoto);

    // Refresh token if needed
    let token = application.seconderConsentToken;
    let expiresAt = application.seconderConsentExpiresAt;
    if (!token || !expiresAt || new Date(expiresAt).getTime() < Date.now()) {
      token = crypto.randomBytes(32).toString('hex');
      expiresAt = new Date(Date.now() + CONSENT_RESPONSE_WINDOW_MS);
      await db.collection('applications').updateOne(
        { _id: application._id },
        { $set: { seconderConsentToken: token, seconderConsentExpiresAt: expiresAt, seconderConsentStatus: 'pending' } }
      );
    }

    const portalUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const apiBaseUrl = process.env.SERVER_URL || `http://localhost:${port}`;
    const { transporter, senderAddress } = createMailTransporter();

    const emailData = generateSeconderConsentEmail({
      proposer: application.proposer,
      nominee: application.nominee,
      seconder: application.seconder,
      targetPositions: application.targetPositions,
      previousRoles: application.previousRoles,
      roleDurations: application.roleDurations,
      roleCategory: application.roleCategory,
      purposeStatement: application.purposeStatement,
      nomineePhoto: emailNomineePhoto || application.nomineePhoto || null,
      consentToken: token,
      consentExpiresAt: expiresAt,
      portalUrl,
      apiBaseUrl
    });

    const seconderMailOptions = {
      from: senderAddress,
      to: seconderEmail,
      subject: emailData.subject,
      html: emailData.html
    };

    await transporter.sendMail(seconderMailOptions);
    console.log(`[Resend] Seconder consent email successfully resent to ${seconderEmail}`);

    res.json({
      success: true,
      message: `Seconding request email resent to ${seconderEmail} with nominee photo.`
    });
  } catch (err) {
    console.error("Failed to resend seconder consent email:", err);
    res.status(500).json({ error: 'Failed to resend seconder consent email: ' + err.message });
  }
});

// Resend Nominee Consent Email for a nomination
app.post('/api/nominations/:id/resend-nominee-email', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }

    const application = await db.collection('applications').findOne({ _id: new ObjectId(id) });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const nomineeEmail = (application.nominee?.email || application.nomineeEmail || application.email || '').trim().toLowerCase();
    if (!nomineeEmail) {
      return res.status(400).json({ error: 'Nominee email address not found on application.' });
    }

    // Host nominee photo if still base64
    let emailNomineePhoto = application.nomineePhotoUrl || application.nomineePhoto;
    if (emailNomineePhoto && (emailNomineePhoto.startsWith('data:') || !emailNomineePhoto.startsWith('http'))) {
      try {
        const hosted = await resolveNomineePhotoUrl(emailNomineePhoto);
        if (hosted && hosted.startsWith('http')) {
          emailNomineePhoto = hosted;
          await db.collection('applications').updateOne(
            { _id: application._id },
            { $set: { nomineePhoto: hosted, nomineePhotoUrl: hosted } }
          );
        }
      } catch (err) {
        console.warn("Could not host photo during nominee resend:", err.message);
      }
    }
    emailNomineePhoto = getPublicEmailImageUrl(emailNomineePhoto);

    // Refresh token if needed
    let token = application.nomineeConsentToken;
    let expiresAt = application.nomineeConsentExpiresAt;
    if (!token || !expiresAt || new Date(expiresAt).getTime() < Date.now()) {
      token = crypto.randomBytes(32).toString('hex');
      expiresAt = new Date(Date.now() + CONSENT_RESPONSE_WINDOW_MS);
      await db.collection('applications').updateOne(
        { _id: application._id },
        { $set: { nomineeConsentToken: token, nomineeConsentExpiresAt: expiresAt } }
      );
    }

    const portalUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const apiBaseUrl = process.env.SERVER_URL || `http://localhost:${port}`;
    const { transporter, senderAddress } = createMailTransporter();

    const emailData = generateNomineeConsentEmail({
      proposer: application.proposer,
      nominee: application.nominee,
      seconder: application.seconder,
      targetPositions: application.targetPositions,
      previousRoles: application.previousRoles,
      roleDurations: application.roleDurations,
      roleCategory: application.roleCategory,
      purposeStatement: application.purposeStatement || application.motivation,
      nomineePhoto: emailNomineePhoto || application.nomineePhoto || null,
      consentToken: token,
      consentExpiresAt: expiresAt,
      portalUrl,
      apiBaseUrl
    });

    const nomineeMailOptions = {
      from: senderAddress,
      to: nomineeEmail,
      subject: emailData.subject,
      html: emailData.html
    };

    await transporter.sendMail(nomineeMailOptions);
    console.log(`[Resend] Nominee consent email successfully resent to ${nomineeEmail}`);

    res.json({
      success: true,
      message: `Nominee consent email resent to ${nomineeEmail} with nominee photo.`
    });
  } catch (err) {
    console.error("Failed to resend nominee consent email:", err);
    res.status(500).json({ error: 'Failed to resend nominee consent email: ' + err.message });
  }
});

// Seconder Willingness Consent API (For logged-in alumni reviewing in portal)
app.post('/api/nominations/seconding-consent', optionalAuth, async (req, res) => {
  try {
    const { effectiveSettings } = await getEffectiveAlumniSettings();
    if (req.user?.role !== 'admin' && !effectiveSettings.apply) {
      return res.status(403).json({ error: 'The nomination consent window is closed.' });
    }
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

    if (application.seconderConsentExpiredAt || await expireApplicationConsentIfNeeded(application, 'seconder')) {
      return res.status(410).json({
        error: 'The 24-hour seconding consent period has expired. This request was automatically declined.'
      });
    }
    if (application.seconderConsentStatus && application.seconderConsentStatus !== 'pending') {
      return res.status(409).json({ error: 'Seconding consent has already been recorded.' });
    }

    const isAccept = decision === 'accept';
    const newConsentStatus = isAccept ? 'accepted' : 'declined';
    const newStatus = isAccept ? 'pending_nominee_consent' : 'seconding_declined';

    const nomineeConsentToken = isAccept ? crypto.randomBytes(32).toString('hex') : null;
    const consentRecordedAt = new Date();
    const nomineeConsentExpiresAt = new Date(consentRecordedAt.getTime() + CONSENT_RESPONSE_WINDOW_MS);
    const updateFields = {
      seconderConsentStatus: newConsentStatus,
      status: newStatus,
      seconderConsentAt: consentRecordedAt
    };
    if (nomineeConsentToken) {
      updateFields.nomineeConsentToken = nomineeConsentToken;
      updateFields.nomineeConsentStatus = 'pending';
      updateFields.nomineeConsentRequestedAt = consentRecordedAt;
      updateFields.nomineeConsentExpiresAt = nomineeConsentExpiresAt;
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

          emailNomineePhoto = getPublicEmailImageUrl(emailNomineePhoto);

          const nomineeEmailData = generateNomineeConsentEmail({
            proposer: application.proposer || { name: '', email: application.proposerEmail },
            nominee: application.nominee || { name: application.name, email: nomineeEmail },
            seconder: application.seconder || { name: '', email: application.seconderEmail },
            targetPositions: application.targetPositions,
            previousRoles: application.previousRoles,
            roleDurations: application.roleDurations,
            roleCategory: application.roleCategory,
            purposeStatement: application.purposeStatement || application.motivation,
            nomineePhoto: emailNomineePhoto || application.nomineePhoto || null,
            consentToken: nomineeConsentToken,
            consentExpiresAt: nomineeConsentExpiresAt,
            portalUrl: portalUrl2,
            apiBaseUrl
          });
          const nomineeMailOptsP = {
            from: senderAddress,
            to: nomineeEmail,
            subject: nomineeEmailData.subject,
            html: nomineeEmailData.html
          };
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
    const { effectiveSettings } = await getEffectiveAlumniSettings();

    if (!effectiveSettings.apply) {
      return res.status(403).send(generateNomineeConfirmationPage({
        success: false,
        errorMessage: 'The nomination consent window is closed.',
        portalUrl
      }));
    }

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

    if (application.nomineeConsentExpiredAt || await expireApplicationConsentIfNeeded(application, 'nominee')) {
      return res.status(410).send(generateNomineeConfirmationPage({
        success: false,
        errorMessage: 'The 24-hour nominee consent period has expired. This nomination was automatically declined.',
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
    const { effectiveSettings } = await getEffectiveAlumniSettings();
    if (req.user?.role !== 'admin' && !effectiveSettings.apply) {
      return res.status(403).json({ error: 'The nomination consent window is closed.' });
    }
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
    if (application.nomineeConsentExpiredAt || await expireApplicationConsentIfNeeded(application, 'nominee')) {
      return res.status(410).json({
        error: 'The 24-hour nominee consent period has expired. This nomination was automatically declined.'
      });
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
    await expirePendingConsents();
    const { effectiveSettings } = await getEffectiveAlumniSettings();
    if (req.user?.role !== 'admin' && !effectiveSettings.applications) {
      return res.status(403).json({ error: 'Nomination tracking is outside its configured availability window.' });
    }
    const statusFilter = req.query.status;
    const emailFilter = req.query.email;
    const roleType = req.query.roleType;
    let query = {};
    const isScrutinyView = req.query.source === 'scrutiny' || (!emailFilter && (!req.user || req.user.role === 'admin'));

    // STRICT CONSTITUTIONAL RULE:
    // A candidate nomination is valid and listed ONLY after BOTH the seconder and nominee
    // have affirmatively consented. Pre-consent and declined proposals (pending_seconding,
    // seconding_declined, pending_nominee_consent, nominee_declined) must NOT be shown.
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

    const relationshipFilterFor = (email, relationship) => {
      if (relationship === 'proposed_by_me') {
        return { $or: [{ proposerEmail: email }, { 'proposer.email': email }] };
      }
      if (relationship === 'nominated_me') {
        return {
          $or: [
            { nomineeEmail: email },
            { applicantEmail: email },
            { 'nominee.email': email }
          ]
        };
      }
      if (relationship === 'seconded_by_me') {
        return { $or: [{ seconderEmail: email }, { 'seconder.email': email }] };
      }
      return {
        $or: [
          { applicantEmail: email },
          { nomineeEmail: email },
          { proposerEmail: email },
          { 'proposer.email': email },
          { 'nominee.email': email },
          { seconderEmail: email },
          { 'seconder.email': email }
        ]
      };
    };

    // Alumni relationship tabs are scoped using the authenticated email. The email
    // query parameter is never trusted for deciding which alumni records are visible.
    if (req.user && req.user.role === 'alumni') {
      const alumniEmail = req.user.email.toLowerCase();
      query.$and = query.$and || [];
      query.$and.push(relationshipFilterFor(alumniEmail, roleType));
    } else if (emailFilter) {
      const emailLower = emailFilter.toLowerCase();
      const relationshipFilter = relationshipFilterFor(emailLower, roleType);
      query.$and = query.$and || [];
      query.$and.push(relationshipFilter);
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
app.patch('/api/applications/:id/withdraw', authenticateToken, async (req, res) => {
  try {
    const { effectiveSettings } = await getEffectiveAlumniSettings();
    if (req.user?.role !== 'admin' && !effectiveSettings.applications) {
      return res.status(403).json({ error: 'The candidate withdrawal deadline has passed.' });
    }
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid nomination ID' });
    }
    const { withdrawalReason } = req.body;

    const application = await db.collection('applications').findOne({ _id: new ObjectId(id) });
    if (!application) {
      return res.status(404).json({ error: 'Nomination not found' });
    }

    // STRICT RULE: Only the nominee (candidate) can withdraw. Proposers and seconders cannot withdraw.
    if (req.user?.role !== 'admin') {
      const requesterEmail = String(req.user?.email || '').trim().toLowerCase();
      const nomineeEmails = [
        application.nomineeEmail,
        application.applicantEmail,
        application.nominee?.email
      ].map(e => String(e || '').trim().toLowerCase()).filter(Boolean);

      const isNominee = nomineeEmails.includes(requesterEmail);
      if (!isNominee) {
        return res.status(403).json({
          error: 'Only the nominated candidate can withdraw this nomination. Proposers and seconders are not permitted to withdraw.'
        });
      }
    }

    if (application.status === 'withdrawn' || application.withdrawn) {
      return res.status(400).json({ error: 'This nomination has already been withdrawn.' });
    }

    await db.collection('applications').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'withdrawn',
          withdrawn: true,
          withdrawalReason: withdrawalReason || 'Voluntary withdrawal by candidate',
          withdrawnBy: req.user?.email || 'candidate',
          withdrawnAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    res.json({ success: true, message: 'Nomination withdrawn successfully by the candidate.' });
  } catch (err) {
    console.error("Error withdrawing nomination:", err);
    res.status(500).json({ error: 'Failed to withdraw application' });
  }
});

// Publication of Final List of Candidates
app.get('/api/elections/final-list', optionalAuth, async (req, res) => {
  try {
    const config = await db.collection('voting_config').findOne({}) || { status: 'not_started', candidatesPublished: false };
    const { effectiveSettings } = await getEffectiveAlumniSettings();
    const isAdmin = req.user?.role === 'admin';
    const canViewFinalList = isAdmin || effectiveSettings.finalList;
    const position = req.query.position;
    
    let query = {
      status: 'approved',
      withdrawn: { $ne: true }
    };
    if (position && position !== 'All') {
      query.targetPositions = position;
    }

    let finalCandidates = [];
    if (canViewFinalList) {
      finalCandidates = await db.collection('applications')
        .find(query)
        .sort({ 'targetPositions.0': 1, name: 1 })
        .toArray();
    }

    // Frontend will hide candidates for non-admins if isPublished is false
    res.json({
      isPublished: isAdmin ? !!config.candidatesPublished : canViewFinalList,
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
    await db.collection('publication_settings').updateOne(
      {},
      { $set: { finalList: false, updatedAt: new Date(), updatedBy: req.user.email } },
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
    await db.collection('publication_settings').updateOne(
      {},
      { $set: { finalList: true, updatedAt: new Date(), updatedBy: req.user.email } },
      { upsert: true }
    );

    res.json({ success: true, message: 'Final candidate list published successfully. It is now visible to alumni.' });
  } catch (error) {
    console.error('Error publishing final list:', error);
    res.status(500).json({ error: 'Failed to publish final list' });
  }
});

// POST Notify Alumni (Admin Only - Supports broadcast to all or single recipient)
app.post('/api/elections/notify-final-list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { electionYear = '2026', appUrl = 'http://localhost:5173', targetMode = 'all', recipientEmail } = req.body;
    const notifiedAt = new Date();

    if (targetMode === 'single' && (!recipientEmail || !recipientEmail.includes('@'))) {
      return res.status(400).json({ error: 'Valid recipient email address is required.' });
    }

    // Record notification timestamp in config when broadcasting
    if (targetMode === 'all') {
      await db.collection('voting_config').updateOne(
        {},
        { $set: { candidatesNotifiedAt: notifiedAt } },
        { upsert: true }
      );
    }

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

        let members = [];
        if (targetMode === 'single' && recipientEmail) {
          const cleanEmail = recipientEmail.trim().toLowerCase();
          const member = await db.collection('members').findOne({ "basic.email_id": cleanEmail });
          members = [{
            basic: {
              email_id: cleanEmail,
              name: member?.basic?.name || 'Esteemed Alumnus'
            }
          }];
        } else {
          members = await db.collection('members').find({
            "basic.email_id": { $in: ['tarun.ganapathi2007@gmail.com', 'infintygaming28@gmail.com'] }
          }).toArray();
        }

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
        console.log(`[Notify Alumni] Finished sending candidate announcements. Sent to ${sentCount} recipient(s).`);
      } catch (err) {
        console.error('[Notify Alumni] Error during broadcast:', err.message);
      }
    })();

    res.json({
      success: true,
      message: targetMode === 'single'
        ? `Final candidate list announcement is being sent to ${recipientEmail.trim()}.`
        : 'Announcement emails are being sent to all alumni members in the background.',
      notifiedAt
    });
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

// Helper: send voting broadcast email to ALL alumni or single recipient
async function sendVotingBroadcast(emailGenerator, announcement, candidateSummary, targetOptions = {}) {
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

  const { targetMode = 'all', recipientEmail } = targetOptions;

  let alumniList = [];
  if (targetMode === 'single' && recipientEmail) {
    const cleanEmail = recipientEmail.trim().toLowerCase();
    const foundUser = await db.collection('users').findOne({ email: cleanEmail });
    if (foundUser) {
      alumniList = [foundUser];
    } else {
      const foundMember = await db.collection('members').findOne({ "basic.email_id": cleanEmail });
      alumniList = [{
        email: cleanEmail,
        name: foundMember?.basic?.name || 'Esteemed Alumni Member',
        department: foundMember?.education?.department || '',
        graduationYear: foundMember?.education?.graduation_year || ''
      }];
    }
  } else {
    alumniList = await db.collection('users').find({
      email: { $in: ['tarun.ganapathi2007@gmail.com', 'infintygaming28@gmail.com'] }
    }).toArray();
  }

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
      reminder2DaySentAt: config.reminder2DaySentAt || config.reminderSentAt || null,
      reminder1DaySentAt: config.reminder1DaySentAt || null,
      reminderSentAt: config.reminderSentAt || config.reminder2DaySentAt || null,
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
    await db.collection('publication_settings').updateOne(
      {},
      { $set: { voting: true, updatedAt: new Date(), updatedBy: req.user.email } },
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

// 2b. POST notify alumni that voting is live (Admin - Separate Broadcast or Single Recipient)
app.post(['/api/elections/voting/notify-alumni', '/api/elections/voting/notify-live'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { targetMode = 'all', recipientEmail } = req.body;

    if (targetMode === 'single' && (!recipientEmail || !recipientEmail.includes('@'))) {
      return res.status(400).json({ error: 'Valid recipient email address is required.' });
    }

    const rawAnnouncement = await db.collection('announcements').findOne({}, { sort: { updatedAt: -1 } });
    const announcement = { ...DEFAULT_ANNOUNCEMENT, ...(rawAnnouncement || {}) };
    const candidateSummary = await getCandidateSummary();

    const broadcastResult = await sendVotingBroadcast(
      generateVotingLiveEmail,
      announcement,
      candidateSummary,
      { targetMode, recipientEmail }
    );

    if (targetMode === 'all') {
      await db.collection('voting_config').updateOne(
        {},
        { $set: { notifyLiveSentAt: new Date() } },
        { upsert: true }
      );
    }

    console.log(`[Voting] Live notification: ${broadcastResult.sent}/${broadcastResult.total}`);

    res.json({
      success: true,
      message: targetMode === 'single'
        ? `Voting announcement sent directly to ${recipientEmail.trim()}.`
        : `Voting announcement sent to ${broadcastResult.sent} alumni members.`,
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
    await db.collection('publication_settings').updateOne(
      {},
      { $set: { voting: false, updatedAt: new Date(), updatedBy: req.user.email } },
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
    const { effectiveSettings } = await getEffectiveAlumniSettings();
    if (req.user.role !== 'admin' && (!effectiveSettings.voting || config.status !== 'live')) {
      return res.status(403).json({ error: 'The ballot is only available during the configured voting hours.' });
    }

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
    const { effectiveSettings } = await getEffectiveAlumniSettings();
    if (!config || config.status !== 'live' || !effectiveSettings.voting) {
      return res.status(400).json({ error: 'Voting is only permitted during the configured voting date and hours.' });
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

// 8a. POST send 2-Day Reminder email (Admin) — Sent when voting day is the day after tomorrow (ALL alumni or single recipient)
app.post(['/api/elections/voting/send-2day-reminder', '/api/elections/voting/send-reminder'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { targetMode = 'all', recipientEmail } = req.body;

    if (targetMode === 'single' && (!recipientEmail || !recipientEmail.includes('@'))) {
      return res.status(400).json({ error: 'Valid recipient email address is required.' });
    }

    const rawAnnouncement = await db.collection('announcements').findOne({}, { sort: { updatedAt: -1 } });
    const announcement = { ...DEFAULT_ANNOUNCEMENT, ...(rawAnnouncement || {}) };
    const candidateSummary = await getCandidateSummary();

    const broadcastResult = await sendVotingBroadcast(
      generateVoting2DayReminderEmail,
      announcement,
      candidateSummary,
      { targetMode, recipientEmail }
    );

    // Record reminder sent timestamp if broadcasting to all
    if (targetMode === 'all') {
      await db.collection('voting_config').updateOne(
        {},
        { $set: { reminder2DaySentAt: new Date(), reminderSentAt: new Date() } },
        { upsert: true }
      );
    }

    console.log(`[Voting] 2-Day Reminder notification: ${broadcastResult.sent}/${broadcastResult.total}`);

    res.json({
      success: true,
      message: targetMode === 'single'
        ? `2-Day election reminder (Day After Tomorrow) sent directly to ${recipientEmail.trim()}.`
        : `2-Day election reminder (Day After Tomorrow) sent to ${broadcastResult.sent} alumni members.`,
      broadcast: broadcastResult
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send 2-day reminder' });
  }
});

// 8b. POST send 1-Day Reminder email (Admin) — Sent the day before voting day / tomorrow (ALL alumni or single recipient)
app.post('/api/elections/voting/send-1day-reminder', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { targetMode = 'all', recipientEmail } = req.body;

    if (targetMode === 'single' && (!recipientEmail || !recipientEmail.includes('@'))) {
      return res.status(400).json({ error: 'Valid recipient email address is required.' });
    }

    const rawAnnouncement = await db.collection('announcements').findOne({}, { sort: { updatedAt: -1 } });
    const announcement = { ...DEFAULT_ANNOUNCEMENT, ...(rawAnnouncement || {}) };
    const candidateSummary = await getCandidateSummary();

    const broadcastResult = await sendVotingBroadcast(
      generateVoting1DayReminderEmail,
      announcement,
      candidateSummary,
      { targetMode, recipientEmail }
    );

    // Record 1-day reminder sent timestamp if broadcasting to all
    if (targetMode === 'all') {
      await db.collection('voting_config').updateOne(
        {},
        { $set: { reminder1DaySentAt: new Date() } },
        { upsert: true }
      );
    }

    console.log(`[Voting] 1-Day Reminder notification: ${broadcastResult.sent}/${broadcastResult.total}`);

    res.json({
      success: true,
      message: targetMode === 'single'
        ? `1-Day election eve reminder (Voting Tomorrow) sent directly to ${recipientEmail.trim()}.`
        : `1-Day election eve reminder (Voting Tomorrow) sent to ${broadcastResult.sent} alumni members.`,
      broadcast: broadcastResult
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send 1-day reminder' });
  }
});
