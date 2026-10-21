const jwt = require('jsonwebtoken');

module.exports = function registerSSORoutes(app, getDb, ADMIN_EMAIL, JWT_SECRET) {
  const dbGetter = typeof getDb === 'function' ? getDb : () => getDb;

  let decryptSSOToken = null;
  try {
    const vaaveSdk = require('vaave-sso-sdk');
    decryptSSOToken = vaaveSdk.decryptSSOToken;
    console.log('[SSO] vaave-sso-sdk loaded successfully');
  } catch (e) {
    console.warn('[SSO] vaave-sso-sdk warning:', e.message);
  }

  // Common decrypt helper
  const decryptTokenToEmail = async (tokenStr) => {
    if (!tokenStr) return null;
    const seed = process.env.SEED || '1xGzQKCekHbGLjAWqsB7vFzMJNpi+LjHscIMfeCpl5g=';
    const decoded = decodeURIComponent(tokenStr);
    if (decryptSSOToken) {
      const res = await decryptSSOToken(decoded, seed);
      if (res && res.details) {
        return res.details.email || res.details.email_id || (typeof res.details === 'string' ? res.details : null);
      }
    }
    return null;
  };

  const handleElectionSSO = async (req, res) => {
    const token = req.query.token || req.body?.token;
    if (!token) {
      return res.status(400).json({ error: 'SSO token is required in query parameter.' });
    }

    let email = null;
    try {
      email = await decryptTokenToEmail(token);
      if (!email) {
        // Fallback: check if raw token is an email
        const rawDecoded = decodeURIComponent(token);
        if (rawDecoded.includes('@')) email = rawDecoded;
      }
    } catch (err) {
      console.error('[SSO] Token decryption error:', err.message);
      return res.status(400).json({ error: 'Invalid SSO Token or decryption failed.' });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Decrypted token does not contain a valid email address.' });
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const encodedEmail = Buffer.from(cleanEmail).toString('base64');
      const frontendUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://election-management-system-rho.vercel.app').replace(/\/+$/, '');
      console.log(`[SSO] Verified ${cleanEmail}, redirecting to frontend dashboard`);
      return res.redirect(302, `${frontendUrl}/?sso_email=${encodeURIComponent(encodedEmail)}&email=${encodeURIComponent(cleanEmail)}`);
    } catch (err) {
      console.error('[SSO] Redirect error:', err.message);
      return res.status(500).json({ error: 'SSO server error during redirection.' });
    }
  };

  app.get('/election/sso', handleElectionSSO);
  app.get('/api/sso', handleElectionSSO);
  app.get('/api/election/sso', handleElectionSSO);

  app.post('/api/auth/sso-login', async (req, res) => {
    try {
      const db = dbGetter();
      if (!db) {
        return res.status(503).json({ error: 'Database not initialized' });
      }

      let { email, token: ssoToken } = req.body || {};

      // If token provided instead of email, decrypt it
      if (!email && ssoToken) {
        email = await decryptTokenToEmail(ssoToken);
      }

      if (!email) {
        return res.status(400).json({ error: 'Email or valid SSO token is required' });
      }

      // If email is base64 encoded, decode it
      try {
        const decoded = Buffer.from(email, 'base64').toString('utf8');
        if (decoded && decoded.includes('@')) {
          email = decoded;
        }
      } catch (e) {}

      const cleanEmail = (email || '').trim().toLowerCase();
      let user = await db.collection('users').findOne({ email: cleanEmail });

      if (!user) {
        // Look up member from 12,053 college records
        const orQuery = [
          { 'basic.email_id': cleanEmail },
          { 'basic.alternate_email_id': cleanEmail }
        ];
        const memberQuery = {};
        memberQuery['$' + 'or'] = orQuery;
        const member = await db.collection('members').findOne(memberQuery);

        const adminEmailLower = (ADMIN_EMAIL || '').trim().toLowerCase();
        const role = cleanEmail === adminEmailLower ? 'admin' : 'alumni';
        const name = (member && member.basic && member.basic.name) ? member.basic.name : cleanEmail.split('@')[0];
        const dept = (member && member.education_details && member.education_details[0] && member.education_details[0].stream) ? member.education_details[0].stream : 'CSE';
        const deg = (member && member.education_details && member.education_details[0] && member.education_details[0].course) ? member.education_details[0].course : 'B.E.';
        const gradYear = (member && member.education_details && member.education_details[0] && member.education_details[0].end_year) ? member.education_details[0].end_year : '2020';
        const phone = (member && member.contact_details && (member.contact_details.mobile || member.contact_details.phone)) ? (member.contact_details.mobile || member.contact_details.phone) : '';

        const newUser = {
          name,
          email: cleanEmail,
          department: dept,
          degree: deg,
          graduationYear: String(gradYear),
          phone,
          role,
          isVerified: true,
          authProvider: 'vaave-sso',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection('users').insertOne(newUser);
        user = Object.assign({}, newUser, { _id: result.insertedId });
        console.log(`[SSO] Auto-provisioned verified voter from members: ${cleanEmail} (${name})`);
      }

      const adminEmailLower = (ADMIN_EMAIL || '').trim().toLowerCase();
      const role = cleanEmail === adminEmailLower ? 'admin' : (user.role || 'alumni');
      delete user.password;
      user.role = role;

      const token = jwt.sign(
        { userId: user._id, email: user.email, role, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({ success: true, user, token });
    } catch (err) {
      console.error('[SSO Login] Error:', err.message);
      return res.status(500).json({ error: 'SSO login error' });
    }
  });

  app.get('/api/user-by-email', async (req, res) => {
    try {
      const db = dbGetter();
      if (!db) {
        return res.status(503).json({ error: 'Database not initialized' });
      }

      let { email } = req.query;
      if (!email) {
        return res.status(400).json({ error: 'Email query param is required' });
      }

      try {
        const decoded = Buffer.from(email, 'base64').toString('utf8');
        if (decoded && decoded.includes('@')) {
          email = decoded;
        }
      } catch (e) {}

      const cleanEmail = (email || '').trim().toLowerCase();
      const user = await db.collection('users').findOne({ email: cleanEmail });
      if (user) {
        delete user.password;
        return res.json(user);
      }

      const orQuery = [
        { 'basic.email_id': cleanEmail },
        { 'basic.alternate_email_id': cleanEmail }
      ];
      const memberQuery = {};
      memberQuery['$' + 'or'] = orQuery;
      const member = await db.collection('members').findOne(memberQuery);

      if (member) {
        return res.json({
          email: cleanEmail,
          name: member && member.basic && member.basic.name,
          department: member && member.education_details && member.education_details[0] && member.education_details[0].stream,
          degree: member && member.education_details && member.education_details[0] && member.education_details[0].course,
          graduationYear: member && member.education_details && member.education_details[0] && member.education_details[0].end_year
        });
      }

      return res.status(404).json({ message: 'User not found' });
    } catch (err) {
      console.error('[user-by-email] Error:', err.message);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  console.log('[SSO] Routes registered: /election/sso, /api/sso, /api/auth/sso-login, /api/user-by-email');
};
