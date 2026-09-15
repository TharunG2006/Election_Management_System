const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
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

// Election Announcement & Timeline
const DEFAULT_ANNOUNCEMENT = {
  notificationNumber: "AA/ELEC/2026/01",
  title: "Official Notification: Alumni Association Office Bearer Elections 2026",
  description: "In accordance with the Alumni Association Constitution, nominations are hereby called for the forthcoming AGM. Notification is formally published via the official Alumni portal at least one month prior to the AGM.",
  publishedVia: "Official Alumni Website Portal",
  agmDate: "2026-10-25T10:00:00.000Z",
  announcementDate: "2026-09-10T09:00:00.000Z",
  nominationStartDate: "2026-09-12T00:00:00.000Z",
  nominationDeadline: "2026-09-30T23:59:59.000Z",
  scrutinyMeetingDate: "2026-10-05T14:00:00.000Z",
  provisionalListDate: "2026-10-07T12:00:00.000Z",
  withdrawalDeadline: "2026-10-14T17:00:00.000Z",
  finalListDate: "2026-10-18T10:00:00.000Z",
  scrutinyCommittee: [
    { name: "Dr. K. S. Ramanathan", designation: "Principal / Patron", role: "Committee Head" },
    { name: "Prof. S. Meenakshi", designation: "Alumni Coordinator", role: "Convener" },
    { name: "Er. Ramesh Babu", designation: "Incumbent President", role: "Office Bearer Member" },
    { name: "Er. Anita George", designation: "Incumbent Secretary", role: "Office Bearer Member" }
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

app.get('/api/elections/announcement', async (req, res) => {
  try {
    const announcement = await db.collection('announcements').findOne({}, { sort: { updatedAt: -1 } });
    if (announcement) {
      res.json(announcement);
    } else {
      res.json(DEFAULT_ANNOUNCEMENT);
    }
  } catch (err) {
    console.error(err);
    res.json(DEFAULT_ANNOUNCEMENT);
  }
});

app.post('/api/elections/announcement', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date()
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
  try {
    const filePath = path.join(__dirname, '../DB File/test.members.json');
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      const members = JSON.parse(fileData);
      return members.find(m => 
        (m.basic?.email_id && m.basic.email_id.toLowerCase() === cleanEmail) ||
        (m.basic?.alternate_email_id && m.basic.alternate_email_id.toLowerCase() === cleanEmail)
      );
    }
  } catch (err) {
    console.error("Fallback file read error:", err);
  }
  return null;
}

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
app.post('/api/applications', async (req, res) => {
  try {
    const {
      proposer,
      nominee,
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

    // STRICT RULE: No Self-Nomination
    if (proposerEmail === nomineeEmail) {
      return res.status(400).json({
        error: 'Self-nomination is strictly prohibited. A member can only be nominated by being proposed by another eligible alumni member.'
      });
    }

    if (seconderEmail && (seconderEmail === proposerEmail || seconderEmail === nomineeEmail)) {
      return res.status(400).json({
        error: 'Seconder must be a distinct eligible alumni member (cannot be the proposer or the nominee).'
      });
    }

    // STRICT RULE: Nominee must be an authentic registered alumni in the database
    const nomineeMember = await queryAlumniByEmail(nomineeEmail);

    if (!nomineeMember) {
      return res.status(404).json({
        error: 'Alumni data not found.'
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
    
    const newApplication = {
      applicantEmail: nomineeEmail,
      nomineeEmail,
      proposerEmail,
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
      status: 'pending',
      withdrawn: false,
      submittedAt: new Date()
    };

    const result = await db.collection('applications').insertOne(newApplication);
    res.status(201).json({ ...newApplication, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// List Applications with filter
app.get('/api/applications', async (req, res) => {
  try {
    const statusFilter = req.query.status;
    const emailFilter = req.query.email;
    const roleType = req.query.roleType; // 'proposed_by_me' | 'nominated_me' | undefined
    let query = {};

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'withdrawn') {
        query.$or = [{ status: 'withdrawn' }, { withdrawn: true }];
      } else {
        query.status = statusFilter;
      }
    }

    if (emailFilter) {
      const emailLower = emailFilter.toLowerCase();
      if (roleType === 'proposed_by_me') {
        query.$or = [{ proposerEmail: emailLower }, { 'proposer.email': emailLower }];
      } else if (roleType === 'nominated_me') {
        query.$or = [{ applicantEmail: emailLower }, { nomineeEmail: emailLower }, { 'nominee.email': emailLower }];
      } else {
        query.$or = [
          { applicantEmail: emailLower },
          { nomineeEmail: emailLower },
          { proposerEmail: emailLower },
          { 'proposer.email': emailLower },
          { 'nominee.email': emailLower }
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

// Scrutiny Committee Verification
app.patch('/api/applications/:id/scrutiny', async (req, res) => {
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
    const position = req.query.position;
    let query = {
      status: 'approved',
      withdrawn: { $ne: true }
    };
    if (position && position !== 'All') {
      query.targetPositions = position;
    }

    const finalCandidates = await db.collection('applications')
      .find(query)
      .sort({ 'targetPositions.0': 1, name: 1 })
      .toArray();

    res.json({
      publishedAt: new Date(),
      certificationNotice: "Official Final List of Eligible Candidates certified and published by the Scrutiny Committee. All committee decisions are final and binding.",
      committeeOfficers: [
        "Dr. K. S. Ramanathan (Principal / Patron)",
        "Prof. S. Meenakshi (Alumni Coordinator)",
        "Er. Ramesh Babu (President)",
        "Er. Anita George (Secretary)"
      ],
      candidates: finalCandidates
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch final candidate list' });
  }
});

// Legacy status update
app.patch('/api/applications/:id/status', async (req, res) => {
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
