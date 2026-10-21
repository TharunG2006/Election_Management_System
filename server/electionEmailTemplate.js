const { generateElectionAnnouncementEmail } = require('./officialElectionNoticeEmail');
const { generateSeconderConsentEmail } = require('./officialSeconderConsentEmail');
const { generateNomineeConsentEmail } = require('./officialNomineeConsentEmail');

/**
 * Official Election Announcement Email Template Generator
 * Designed for National Engineering College Alumni Association (NECAA)
 * Informs alumni about the upcoming election, open nomination roles,
 * constitutional rules & eligibilities, and election schedule (without publish date).
 * Strictly avoids mentioning individual scrutiny committee member names.
 */

function formatDisplayDate(dateVal, fallback) {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return fallback;
  }
}

function formatDisplayDateTime(dateVal, timeVal, fallback) {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    const dateStr = d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    if (timeVal) {
      return `${dateStr} • ${timeVal} IST`;
    }
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateStr} • ${timeStr} IST`;
  } catch {
    return fallback;
  }
}

function generateLegacyElectionAnnouncementEmail({
  announcement = {},
  recipientName = 'Esteemed Alumni Member',
  recipientEmail = '',
  recipientDept = '',
  recipientBatch = '',
  portalUrl = 'http://localhost:5173'
}) {
  const notifNumber = announcement.notificationNumber || announcement.referenceNumber || 'AA/ELEC/2026/01';
  const title = announcement.title || 'Alumni Association General Election 2026';
  const year = announcement.electionYear || announcement.year || '2026';
  const tenure = `${year}–${Number(year) + 2}`;
  
  // Election Milestones (Excluding Notification Publish Date)
  const nominationStartStr = formatDisplayDateTime(announcement.nominationStartDate || '2026-09-10T09:00:00Z', '09:00 AM', 'Thursday, September 10, 2026 • 09:00 AM IST');
  const nominationDeadlineStr = formatDisplayDateTime(announcement.nominationDeadline || '2026-09-30T17:00:00Z', '05:00 PM', 'Wednesday, September 30, 2026 • 05:00 PM IST');
  const scrutinyMeetingStr = formatDisplayDateTime(announcement.scrutinyMeetingDate || '2026-10-05T14:00:00Z', '02:00 PM', 'Monday, October 05, 2026 • 02:00 PM IST');
  const withdrawalDeadlineStr = formatDisplayDateTime(announcement.withdrawalDeadline || '2026-10-14T17:00:00Z', '05:00 PM', 'Wednesday, October 14, 2026 • 05:00 PM IST');
  const finalListStr = formatDisplayDateTime(announcement.finalListDate || '2026-10-18T10:00:00Z', '10:00 AM', 'Sunday, October 18, 2026 • 10:00 AM IST');
  
  const votingStartTime = announcement.votingStartTime || announcement.electionStartTime || '10:00 AM';
  const votingEndTime = announcement.votingEndTime || announcement.electionEndTime || '04:00 PM';
  const electionDateStr = formatDisplayDate(announcement.electionDate || announcement.votingDateTime || '2026-10-25', 'Sunday, October 25, 2026');
  const votingWindowStr = `${electionDateStr} • ${votingStartTime} to ${votingEndTime} IST`;
  
  const agmDateStr = formatDisplayDateTime(announcement.agmDate || '2026-10-25T17:00:00Z', '05:00 PM', 'Sunday, October 25, 2026 • 05:00 PM IST');

  // Contested Executive Roles
  const positions = [
    { title: "President", posts: "1 Post", tenure: tenure, eligibility: "Must have served as an Office Bearer during the immediate preceding 5 years (2021–2026)" },
    { title: "Vice President", posts: "1 Post", tenure: tenure, eligibility: "Registered alumni with verified continuous service & demonstrated leadership" },
    { title: "Secretary", posts: "1 Post", tenure: tenure, eligibility: "Registered alumni with chapter or club coordination experience" },
    { title: "Joint Secretary", posts: "1 Post", tenure: tenure, eligibility: "Registered alumni with active standing & coordinator experience" },
    { title: "Treasurer", posts: "1 Post", tenure: tenure, eligibility: "Registered alumni with active standing & financial/secretarial experience" },
    { title: "Joint Treasurer", posts: "1 Post", tenure: tenure, eligibility: "Registered alumni with active standing & coordinator experience" }
  ];

  const dispatchId = `DISP-NECAA-${year}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const subject = announcement.emailSubject || `OFFICIAL NOTIFICATION: ${title} – Call for Nominations [Ref: ${notifNumber}]`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">

  <!-- Main Container -->
  <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #cbd5e1; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); overflow: hidden;">

    <!-- INSTITUTION LETTERHEAD HEADER -->
    <div style="background: #0f172a; border-bottom: 4px solid #f59e0b; padding: 30px 24px; text-align: center; color: #ffffff;">
      <h2 style="margin: 0 0 4px 0; font-size: 19px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: #ffffff;">
        National Engineering College (Autonomous)
      </h2>
      <p style="margin: 0 0 12px 0; font-size: 11px; color: #94a3b8; letter-spacing: 0.03em;">
        Approved by AICTE • Affiliated to Anna University • K.R. Nagar, Kovilpatti - 628 503
      </p>

      <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 12px; margin-top: 12px;">
        <h1 style="margin: 0; font-size: 17px; font-weight: 800; color: #38bdf8; letter-spacing: 0.02em;">
          ALUMNI ASSOCIATION (NECAA) • ELECTION COMMISSION
        </h1>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #e2e8f0; font-weight: 600;">
          Election Notification & Call for Nominations
        </p>
      </div>

      <!-- Official Reference Banner -->
      <div style="margin-top: 14px; font-size: 12px; color: #cbd5e1;">
        <span style="background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 6px; margin: 0 4px;"><strong>Notification Ref:</strong> ${notifNumber}</span>
        <span style="background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 6px; margin: 0 4px;"><strong>Tenure:</strong> ${tenure}</span>
      </div>
    </div>

    <!-- PRIMARY BODY -->
    <div style="padding: 28px 24px; line-height: 1.65; color: #334155;">

      <!-- PERSONALIZED ELECTOR GREETING -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #2563eb; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 800; color: #0f172a;">
          Dear ${recipientName},
        </p>
        <p style="margin: 0; font-size: 13px; color: #64748b;">
          ${[recipientEmail, recipientDept, recipientBatch].filter(Boolean).join(' • ')}
        </p>
      </div>

      <!-- ELECTION ANNOUNCEMENT -->
      <p style="font-size: 14px; margin: 0 0 14px 0; text-align: justify; color: #334155;">
        ${announcement.emailIntro || `Notice is hereby formally given to all registered alumni members regarding the <strong>Alumni Association General Election for Executive Office Bearers for the ${tenure} tenure</strong>.`}
      </p>
      <p style="font-size: 14px; margin: 0 0 20px 0; text-align: justify; color: #475569; background: #f1f5f9; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #64748b;">
        <em>"${announcement.emailBody || announcement.description || 'Nominations are hereby formally called for the forthcoming AGM for the 2026-2028 tenure.'}"</em>
      </p>

      ${announcement.emailCustomNotes ? `
      <!-- SPECIAL INSTRUCTIONS / ADMIN DIRECTIVE -->
      <div style="margin: 0 0 24px 0; padding: 14px 18px; background: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; border-radius: 8px; font-size: 13px; color: #1e40af; line-height: 1.6;">
        <strong style="display: block; font-size: 13px; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 4px; color: #1d4ed8;">
          Notice from Alumni Election Commission:
        </strong>
        ${announcement.emailCustomNotes.replace(/\n/g, '<br />')}
      </div>
      ` : ''}

      <!-- SECTION 1: ROLES OPEN FOR NOMINATION -->
      <div style="margin-bottom: 28px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.03em;">
            1. Roles Open for Nominations (Tenure: ${tenure})
          </h3>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #1e293b; color: #ffffff; text-align: left;">
              <th style="padding: 9px 12px; font-weight: 700; width: 30px;">#</th>
              <th style="padding: 9px 12px; font-weight: 700;">Role / Designation</th>
              <th style="padding: 9px 12px; font-weight: 700; width: 60px;">Seats</th>
              <th style="padding: 9px 12px; font-weight: 700;">Eligibility Requirement</th>
            </tr>
          </thead>
          <tbody>
            ${positions.map((p, idx) => `
              <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 9px 12px; font-weight: 700; color: #64748b;">${idx + 1}</td>
                <td style="padding: 9px 12px; font-weight: 700; color: #0f172a;">${p.title}</td>
                <td style="padding: 9px 12px; font-weight: 600; color: #2563eb;">${p.posts}</td>
                <td style="padding: 9px 12px; color: ${idx === 0 ? '#b45309' : '#475569'}; font-size: 12px; font-weight: ${idx === 0 ? '700' : '400'};">
                  ${idx === 0 ? '★ ' : ''}${p.eligibility}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- SECTION 2: NOMINATION RULES & ELIGIBILITY -->
      <div style="margin-bottom: 28px;">
        <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.03em;">
          2. Nomination Rules & Candidate Eligibility
        </h3>

        <!-- Rule 1: No Self-Nomination Banner -->
        <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 5px solid #d97706; border-radius: 8px; padding: 12px 15px; margin-bottom: 12px;">
          <h4 style="margin: 0 0 3px 0; font-size: 13px; font-weight: 800; color: #92400e; text-transform: uppercase;">
            Mandatory Rule: Strict Proposal Workflow (No Self-Nomination)
          </h4>
          <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.5;">
            Self-nominations are strictly not permitted. Every candidate must be <strong>proposed by an eligible registered alumnus and seconded</strong> with a formal <strong>Purpose Statement</strong> highlighting leadership capability, integrity, and contributions.
          </p>
        </div>

        <!-- Constitutional Requirements List -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-size: 13px; color: #334155; line-height: 1.6;">
          <ul style="margin: 0; padding-left: 18px;">
            <li style="margin-bottom: 6px;">
              <strong>President Post Eligibility:</strong> Candidates contesting for President <em>MUST have served as an Office Bearer of the Alumni Association during the immediate preceding 5 years (2021–2026)</em>.
            </li>
            <li style="margin-bottom: 6px;">
              <strong>General Office Bearer Eligibility:</strong> Candidates must be registered alumni with at least 1 year continuous active service without gap in the past 5 years and hold recognized responsibilities (Office Bearer, Chapter Coordinator, Club Coordinator, Mentorship/Placement, or Data Management).
            </li>
            <li style="margin-bottom: 6px;">
              <strong>Voter Franchise:</strong> All verified registered alumni are entitled to cast one vote per contested post via secure secret ballot.
            </li>
            <li>
              <strong>Nomination Review:</strong> All nominations will be formally verified strictly according to the electoral bylaws. Decisions are final and binding.
            </li>
          </ul>
        </div>
      </div>

      <!-- SECTION 3: COMPLETE ELECTION SCHEDULE & DEADLINES -->
      <div style="margin-bottom: 28px;">
        <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.03em;">
          3. Election Schedule & Key Deadlines
        </h3>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #1e293b; color: #ffffff; text-align: left;">
              <th style="padding: 9px 12px; font-weight: 700; width: 30px;">#</th>
              <th style="padding: 9px 12px; font-weight: 700;">Milestone Event</th>
              <th style="padding: 9px 12px; font-weight: 700; text-align: right;">Prescribed Schedule (IST)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
              <td style="padding: 9px 12px; font-weight: 700; color: #64748b;">1</td>
              <td style="padding: 9px 12px; font-weight: 600; color: #334155;">Nomination Start Date (Portal Opens)</td>
              <td style="padding: 9px 12px; text-align: right; color: #2563eb; font-weight: 700;">${nominationStartStr}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #fef2f2;">
              <td style="padding: 9px 12px; font-weight: 700; color: #b91c1c;">2</td>
              <td style="padding: 9px 12px; font-weight: 700; color: #991b1b;">
                Nomination Deadline
                <div style="font-size: 11px; font-weight: 400; color: #b91c1c;">Last date for submitting nominations</div>
              </td>
              <td style="padding: 9px 12px; text-align: right; color: #b91c1c; font-weight: 800;">${nominationDeadlineStr}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
              <td style="padding: 9px 12px; font-weight: 700; color: #64748b;">3</td>
              <td style="padding: 9px 12px; font-weight: 600; color: #334155;">Scrutiny Conclave Date</td>
              <td style="padding: 9px 12px; text-align: right; color: #0f172a; font-weight: 600;">${scrutinyMeetingStr}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #fffbeb;">
              <td style="padding: 9px 12px; font-weight: 700; color: #b45309;">4</td>
              <td style="padding: 9px 12px; font-weight: 700; color: #92400e;">
                Candidate Withdrawal Deadline
                <div style="font-size: 11px; font-weight: 400; color: #b45309;">Last day to withdraw candidature</div>
              </td>
              <td style="padding: 9px 12px; text-align: right; color: #92400e; font-weight: 800;">${withdrawalDeadlineStr}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
              <td style="padding: 9px 12px; font-weight: 700; color: #64748b;">5</td>
              <td style="padding: 9px 12px; font-weight: 600; color: #334155;">Final Candidate List Publication</td>
              <td style="padding: 9px 12px; text-align: right; color: #0f172a; font-weight: 600;">${finalListStr}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f0fdf4;">
              <td style="padding: 9px 12px; font-weight: 700; color: #166534;">6</td>
              <td style="padding: 9px 12px; font-weight: 700; color: #15803d;">
                Voting Schedule / Hours (Online Polling)
              </td>
              <td style="padding: 9px 12px; text-align: right; color: #15803d; font-weight: 800;">${votingWindowStr}</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 9px 12px; font-weight: 700; color: #64748b;">7</td>
              <td style="padding: 9px 12px; font-weight: 600; color: #334155;">Annual General Meeting (AGM) & Results Declaration</td>
              <td style="padding: 9px 12px; text-align: right; color: #0f172a; font-weight: 700;">${agmDateStr}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- SECTION 4: CALL TO ACTION -->
      <div style="text-align: center; margin: 32px 0 24px 0; padding: 6px 0;">
        <a href="${portalUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 15px 32px; border-radius: 12px; font-weight: 800; font-size: 14px; letter-spacing: 0.03em; box-shadow: 0 8px 18px -4px rgba(37, 99, 235, 0.4); text-transform: uppercase;">
          Access Alumni Election Portal & Submit Nomination &rarr;
        </a>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">
          Direct Portal Link: <a href="${portalUrl}" style="color: #2563eb; text-decoration: underline;">${portalUrl}</a>
        </p>
      </div>

      <!-- OFFICIAL SIGN-OFF BLOCK (NO INDIVIDUAL SCRUTINY NAMES) -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px dashed #cbd5e1;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 15px;">
              <p style="margin: 0 0 2px 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Authorized By:</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 800; color: #0f172a;">${announcement.emailSignOffAuthorized || 'Alumni Election Commission'}</p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">Alumni Association (NECAA)</p>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">National Engineering College</p>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 15px; text-align: right;">
              <p style="margin: 0 0 2px 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Approved By:</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 800; color: #0f172a;">${announcement.emailSignOffApproved || 'Patron & Principal'}</p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">Alumni Association</p>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">National Engineering College (Autonomous)</p>
            </td>
          </tr>
        </table>
      </div>

    </div>

    <!-- OFFICIAL FOOTER -->
    <div style="background: #0f172a; border-top: 1px solid #334155; padding: 20px 24px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
      <p style="margin: 0 0 6px 0; font-weight: 700; color: #cbd5e1;">
        STATUTORY NOTICE OF AUTHENTICITY & SECURITY VERIFICATION
      </p>
      <p style="margin: 0 0 6px 0;">
        This official communication is issued directly by the Alumni Election Commission of National Engineering College to your registered email address on the Electoral Roll.
      </p>
      <p style="margin: 0; font-family: monospace; font-size: 10px; color: #64748b;">
        DISPATCH IDENTIFIER: ${dispatchId} • ELECTION YEAR ${year}
      </p>
    </div>

  </div>
</body>
</html>
  `;

  return {
    subject,
    html
  };
}

function generateLegacySeconderConsentEmail({
  proposer = {},
  nominee = {},
  seconder = {},
  targetPositions = [],
  roleCategory = '',
  purposeStatement = '',
  nomineePhoto = null,
  consentToken = '',
  consentExpiresAt = null,
  portalUrl = 'http://localhost:5173',
  apiBaseUrl = 'http://localhost:5000'
}) {
  const positionsStr = Array.isArray(targetPositions) ? targetPositions.join(', ') : (targetPositions || 'Office Bearer');
  const consentDeadline = new Date(consentExpiresAt || 0);
  const consentDeadlineText = Number.isNaN(consentDeadline.getTime())
    ? 'within 24 hours of this request'
    : `${consentDeadline.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })} IST`;
  const acceptUrl = `${apiBaseUrl}/api/nominations/seconding-consent?token=${consentToken}&decision=accept`;
  const declineUrl = `${apiBaseUrl}/api/nominations/seconding-consent?token=${consentToken}&decision=decline`;
  const dispatchId = `CONSENT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const subject = `Action Required: Request for Seconding Nomination – NEC Alumni Election [Candidate: ${nominee.name || 'Nominee'} for ${positionsStr}]`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #cbd5e1; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); overflow: hidden;">
    
    <!-- HEADER -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%); padding: 28px 30px; text-align: center; color: #ffffff;">
      <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #a5b4fc;">
        NATIONAL ENGINEERING COLLEGE ALUMNI ASSOCIATION (NECAA)
      </p>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
        Election Commission • Statutory Seconding Notice
      </h1>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #e0e7ff;">
        Request for Affirmative Consent as Seconding Member
      </p>
    </div>

    <!-- MAIN BODY -->
    <div style="padding: 32px 30px; font-size: 14px; line-height: 1.6; color: #334155;">
      
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f172a;">
        Dear <strong>${seconder.name || 'Alumni Member'}</strong>,
      </p>

      <p style="margin: 0 0 16px 0;">
        You have been designated as the <strong>Seconding Member</strong> for an official election nomination filed for the upcoming <strong>NEC Alumni Association General Election 2026</strong>.
      </p>

      <!-- IMPORTANT NOTICE CALLOUT -->
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 0 0 24px 0;">
        <p style="margin: 0; font-size: 13px; color: #1e40af; font-weight: 600;">
          ⚖️ Constitutional Requirement: Under association election bylaws, every candidate must be proposed by an eligible alumni member and affirmatively seconded by another distinct member. This nomination <u>will not be submitted</u> to the Scrutiny Committee until you confirm your willingness.
        </p>
      </div>

      <p style="margin: -10px 0 24px 0; padding: 12px 14px; background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; font-size: 13px; line-height: 1.55;">
        Please respond by <strong>${consentDeadlineText}</strong>. If no response is received within 24 hours, this nomination will be automatically declined.
      </p>

      <!-- NOMINATION SUMMARY CARD -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 14px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #4338ca; font-weight: 800; border-bottom: 1px solid #e2e8f0; pb: 8px;">
          Nomination Proposal Details
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          ${nomineePhoto ? `
          <tr>
            <td colspan="2" style="padding: 0 0 16px 0; text-align: center;">
              <img src="${nomineePhoto}" alt="Nominee Photo" width="88" height="104" style="width: 88px; height: 104px; object-fit: cover; border-radius: 8px; border: 2px solid #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.10); display: inline-block;" />
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding: 6px 0; width: 35%; color: #64748b; font-weight: 600;">Position Proposing For:</td>
            <td style="padding: 6px 0; font-weight: 800; color: #1e1b4b; font-size: 14px;">${positionsStr}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Target Candidate (Nominee):</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">
              ${nominee.name || 'N/A'} <span style="font-weight: 400; color: #64748b;">(${nominee.email || ''})</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Nominee Dept & Batch:</td>
            <td style="padding: 6px 0; color: #334155;">
              ${nominee.department || ''} ${nominee.graduationYear ? `(Class of ${nominee.graduationYear})` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Proposed By:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">
              ${proposer.name || 'N/A'} <span style="font-weight: 400; color: #64748b;">(${proposer.email || ''})</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Proposer Dept & Batch:</td>
            <td style="padding: 6px 0; color: #334155;">
              ${proposer.department || ''} ${proposer.batch || proposer.graduationYear ? `(Class of ${proposer.batch || proposer.graduationYear})` : ''}
            </td>
          </tr>
          ${roleCategory ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Qualifying Category:</td>
            <td style="padding: 6px 0; color: #334155;">${roleCategory}</td>
          </tr>` : ''}
        </table>

        ${purposeStatement ? `
        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
          <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block; margin-bottom: 4px;">
            Proposer's Citation / Purpose Statement:
          </span>
          <p style="margin: 0; font-style: italic; color: #475569; font-size: 12px; line-height: 1.5; background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
            "${purposeStatement}"
          </p>
        </div>` : ''}
      </div>

      <!-- ACTION QUESTION -->
      <div style="text-align: center; margin: 30px 0 20px 0;">
        <p style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 18px;">
          Do you consent to be the Seconding Member for this nomination?
        </p>

        <table style="margin: 0 auto; border-collapse: separate; border-spacing: 12px 0;">
          <tr>
            <td>
              <a href="${acceptUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35); text-align: center;">
                ✓ I ACCEPT & SECOND NOMINATION
              </a>
            </td>
            <td>
              <a href="${declineUrl}" style="display: inline-block; background-color: #e2e8f0; color: #475569; font-weight: 700; font-size: 13px; text-decoration: none; padding: 14px 22px; border-radius: 10px; text-align: center;">
                ✕ Decline
              </a>
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 20px;">
        You can also review this proposal anytime by logging into the <a href="${portalUrl}" style="color: #4f46e5; text-decoration: underline; font-weight: 600;">Alumni Election Portal</a>.
      </p>

      <!-- SIGN OFF -->
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        <p style="margin: 0; font-weight: 700; color: #1e1b4b;">Alumni Election Commission</p>
        <p style="margin: 2px 0 0 0;">National Engineering College (Autonomous), Kovilpatti</p>
        <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 10px;">REF: ${dispatchId}</p>
      </div>

    </div>

    <!-- FOOTER -->
    <div style="background: #0f172a; padding: 16px 24px; text-align: center; color: #94a3b8; font-size: 11px;">
      This email was generated automatically by the NEC Alumni Election Commission for registered alumni member ${seconder.email || ''}.
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

function generateSeconderConfirmationPage({
  success = true,
  decision = 'accept',
  nomineeName = '',
  proposerName = '',
  positions = [],
  errorMessage = '',
  portalUrl = 'http://localhost:5173'
}) {
  const positionsStr = Array.isArray(positions) ? positions.join(', ') : (positions || 'Office Bearer');
  const isAccepted = decision === 'accept' || decision === 'accepted';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${success ? (isAccepted ? 'Seconding Confirmed' : 'Seconding Declined') : 'Verification Error'} – NEC Alumni Election</title>
  <style>
    body {
      margin: 0;
      padding: 40px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      max-width: 540px;
      width: 100%;
      background: #ffffff;
      border-radius: 20px;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
    }
    .icon {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px auto;
      font-size: 32px;
    }
    .icon-success { background: #dcfce7; color: #16a34a; }
    .icon-declined { background: #fee2e2; color: #dc2626; }
    .icon-error { background: #fef3c7; color: #d97706; }
    h1 { margin: 0 0 10px 0; font-size: 24px; font-weight: 800; color: #0f172a; }
    p { margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569; }
    .details {
      background: #f1f5f9;
      border-radius: 12px;
      padding: 16px;
      margin: 20px 0;
      text-align: left;
      font-size: 13px;
    }
    .details p { margin: 4px 0; color: #334155; }
    .details strong { color: #0f172a; }
    .btn {
      display: inline-block;
      margin-top: 16px;
      background: #4f46e5;
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 12px 28px;
      border-radius: 12px;
      transition: background 0.2s;
    }
    .btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    ${!success ? `
      <div class="icon icon-error">⚠️</div>
      <h1>Verification Error</h1>
      <p>${errorMessage || 'The seconding verification link is invalid, expired, or has already been used.'}</p>
      <a href="${portalUrl}" class="btn">Go to Alumni Election Portal</a>
    ` : isAccepted ? `
      <div class="icon icon-success">✓</div>
      <h1>Seconding Consent Confirmed!</h1>
      <p>
        Thank you for confirming your willingness. You have officially seconded the nomination proposal.
      </p>
      <div class="details">
        <p><strong>Candidate (Nominee):</strong> ${nomineeName}</p>
        <p><strong>Office Bearer Position:</strong> ${positionsStr}</p>
        <p><strong>Proposed By:</strong> ${proposerName}</p>
        <p><strong>Status:</strong> Formally Submitted to Election Scrutiny Committee</p>
      </div>
      <p style="font-size: 12px; color: #64748b;">
        The candidate and proposer have been notified. The proposal will now undergo constitutional scrutiny.
      </p>
      <a href="${portalUrl}" class="btn">Open Alumni Portal</a>
    ` : `
      <div class="icon icon-declined">✕</div>
      <h1>Seconding Request Declined</h1>
      <p>
        You have declined to second this nomination proposal.
      </p>
      <div class="details">
        <p><strong>Candidate (Nominee):</strong> ${nomineeName}</p>
        <p><strong>Office Bearer Position:</strong> ${positionsStr}</p>
        <p><strong>Proposed By:</strong> ${proposerName}</p>
        <p><strong>Outcome:</strong> Proposal was NOT submitted</p>
      </div>
      <p style="font-size: 12px; color: #64748b;">
        In accordance with election bylaws, a nomination without an affirmative seconding member cannot be submitted.
      </p>
      <a href="${portalUrl}" class="btn">Open Alumni Portal</a>
    `}
  </div>
</body>
</html>
  `;
}

function generateLegacyNomineeConsentEmail({
  proposer = {},
  nominee = {},
  seconder = {},
  targetPositions = [],
  roleCategory = '',
  purposeStatement = '',
  nomineePhoto = null,
  consentToken = '',
  portalUrl = 'http://localhost:5173',
  apiBaseUrl = 'http://localhost:5000'
}) {
  const positionsStr = Array.isArray(targetPositions) ? targetPositions.join(', ') : (targetPositions || 'Office Bearer');
  const acceptUrl = `${apiBaseUrl}/api/nominations/nominee-consent?token=${consentToken}&decision=accept`;
  const declineUrl = `${apiBaseUrl}/api/nominations/nominee-consent?token=${consentToken}&decision=decline`;
  const dispatchId = `NOMINEE-CONSENT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const subject = `Action Required: Nomination for ${positionsStr} – Do You Wish to Stand? [NEC Alumni Election 2026]`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #cbd5e1; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); overflow: hidden;">

    <!-- HEADER -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #7c3aed 60%, #a855f7 100%); padding: 28px 30px; text-align: center; color: #ffffff;">
      <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #e9d5ff;">
        NATIONAL ENGINEERING COLLEGE ALUMNI ASSOCIATION (NECAA)
      </p>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
        Election Commission • Nominee Consent Notice
      </h1>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #e9d5ff;">
        Your Consent is Required to Stand in the Election
      </p>
    </div>

    <!-- MAIN BODY -->
    <div style="padding: 32px 30px; font-size: 14px; line-height: 1.6; color: #334155;">

      <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f172a;">
        Dear <strong>${nominee.name || 'Alumni Member'}</strong>,
      </p>

      <p style="margin: 0 0 16px 0;">
        You have been <strong>formally nominated</strong> as a candidate for the upcoming <strong>NEC Alumni Association General Election 2026</strong>. The nomination proposal has been filed by a fellow alumni member and has received the required seconding consent.
      </p>

      <!-- IMPORTANT NOTICE CALLOUT -->
      <div style="background-color: #faf5ff; border-left: 4px solid #7c3aed; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 0 0 24px 0;">
        <p style="margin: 0; font-size: 13px; color: #5b21b6; font-weight: 600;">
          ⚖️ Constitutional Requirement: Under association election bylaws, your affirmative consent is mandatory before this nomination can be formally submitted to the Scrutiny Committee. You cannot be placed on the ballot without your explicit acceptance.
        </p>
      </div>

      <!-- NOMINATION SUMMARY CARD -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 14px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #7c3aed; font-weight: 800; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          Nomination Proposal Details
        </h3>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          ${nomineePhoto ? `
          <tr>
            <td colspan="2" style="padding: 0 0 16px 0; text-align: center;">
              <img src="${nomineePhoto}" alt="Nominee Photo" width="88" height="104" style="width: 88px; height: 104px; object-fit: cover; border-radius: 8px; border: 2px solid #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.10); display: inline-block;" />
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding: 6px 0; width: 35%; color: #64748b; font-weight: 600;">Position Nominated For:</td>
            <td style="padding: 6px 0; font-weight: 800; color: #1e1b4b; font-size: 14px;">${positionsStr}</td>
          </tr>
          ${roleCategory ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Qualifying Category:</td>
            <td style="padding: 6px 0; color: #334155;">${roleCategory}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Proposed By:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">
              ${proposer.name || 'N/A'} <span style="font-weight: 400; color: #64748b;">(${proposer.email || ''})</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Proposer Dept &amp; Batch:</td>
            <td style="padding: 6px 0; color: #334155;">
              ${proposer.department || ''} ${(proposer.batch || proposer.graduationYear) ? `(Class of ${proposer.batch || proposer.graduationYear})` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Seconded By:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">
              ${seconder.name || 'N/A'} <span style="font-weight: 400; color: #64748b;">(${seconder.email || ''})</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Seconder Status:</td>
            <td style="padding: 6px 0; color: #16a34a; font-weight: 700;">✓ Affirmatively Consented</td>
          </tr>
        </table>

        ${purposeStatement ? `
        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
          <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block; margin-bottom: 4px;">
            Proposer's Citation / Purpose Statement:
          </span>
          <p style="margin: 0; font-style: italic; color: #475569; font-size: 12px; line-height: 1.5; background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
            "${purposeStatement}"
          </p>
        </div>` : ''}
      </div>

      <!-- ACTION QUESTION -->
      <div style="text-align: center; margin: 30px 0 20px 0;">
        <p style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
          Do you wish to stand as a candidate in the NEC Alumni Election 2026?
        </p>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 20px;">
          By accepting, your nomination will be formally submitted to the Election Scrutiny Committee for verification.
        </p>

        <table style="margin: 0 auto; border-collapse: separate; border-spacing: 12px 0;">
          <tr>
            <td>
              <a href="${acceptUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35); text-align: center;">
                ✓ YES, I ACCEPT THE NOMINATION
              </a>
            </td>
            <td>
              <a href="${declineUrl}" style="display: inline-block; background-color: #e2e8f0; color: #475569; font-weight: 700; font-size: 13px; text-decoration: none; padding: 14px 22px; border-radius: 10px; text-align: center;">
                ✕ No, I Decline
              </a>
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 20px;">
        You can also respond to this nomination by logging into the <a href="${portalUrl}" style="color: #7c3aed; text-decoration: underline; font-weight: 600;">Alumni Election Portal</a>.
      </p>

      <!-- SIGN OFF -->
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        <p style="margin: 0; font-weight: 700; color: #1e1b4b;">Alumni Election Commission</p>
        <p style="margin: 2px 0 0 0;">National Engineering College (Autonomous), Kovilpatti</p>
        <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 10px;">REF: ${dispatchId}</p>
      </div>

    </div>

    <!-- FOOTER -->
    <div style="background: #0f172a; padding: 16px 24px; text-align: center; color: #94a3b8; font-size: 11px;">
      This email was generated automatically by the NEC Alumni Election Commission for registered alumni member ${nominee.email || ''}.
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

function generateNomineeConfirmationPage({
  success = true,
  decision = 'accept',
  nomineeName = '',
  proposerName = '',
  seconderName = '',
  positions = [],
  errorMessage = '',
  portalUrl = 'http://localhost:5173'
}) {
  const positionsStr = Array.isArray(positions) ? positions.join(', ') : (positions || 'Office Bearer');
  const isAccepted = decision === 'accept' || decision === 'accepted';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${success ? (isAccepted ? 'Nomination Accepted' : 'Nomination Declined') : 'Verification Error'} – NEC Alumni Election</title>
  <style>
    body {
      margin: 0;
      padding: 40px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      max-width: 540px;
      width: 100%;
      background: #ffffff;
      border-radius: 20px;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
    }
    .icon {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px auto;
      font-size: 32px;
    }
    .icon-success { background: #f3e8ff; color: #7c3aed; }
    .icon-declined { background: #fee2e2; color: #dc2626; }
    .icon-error { background: #fef3c7; color: #d97706; }
    h1 { margin: 0 0 10px 0; font-size: 24px; font-weight: 800; color: #0f172a; }
    p { margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569; }
    .details {
      background: #f1f5f9;
      border-radius: 12px;
      padding: 16px;
      margin: 20px 0;
      text-align: left;
      font-size: 13px;
    }
    .details p { margin: 4px 0; color: #334155; }
    .details strong { color: #0f172a; }
    .btn {
      display: inline-block;
      margin-top: 16px;
      background: #7c3aed;
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 12px 28px;
      border-radius: 12px;
      transition: background 0.2s;
    }
    .btn:hover { background: #6d28d9; }
  </style>
</head>
<body>
  <div class="card">
    ${!success ? `
      <div class="icon icon-error">⚠️</div>
      <h1>Verification Error</h1>
      <p>${errorMessage || 'The nominee consent link is invalid, expired, or has already been used.'}</p>
      <a href="${portalUrl}" class="btn">Go to Alumni Election Portal</a>
    ` : isAccepted ? `
      <div class="icon icon-success">✓</div>
      <h1>Nomination Accepted!</h1>
      <p>
        Thank you for confirming your candidacy. Your nomination has been formally submitted to the Election Scrutiny Committee.
      </p>
      <div class="details">
        <p><strong>Candidate (You):</strong> ${nomineeName}</p>
        <p><strong>Office Bearer Position:</strong> ${positionsStr}</p>
        <p><strong>Proposed By:</strong> ${proposerName}</p>
        <p><strong>Seconded By:</strong> ${seconderName}</p>
        <p><strong>Status:</strong> Submitted to Election Scrutiny Committee</p>
      </div>
      <p style="font-size: 12px; color: #64748b;">
        The proposer and the Election Commission have been notified. Your nomination will now undergo constitutional scrutiny.
      </p>
      <a href="${portalUrl}" class="btn">Open Alumni Portal</a>
    ` : `
      <div class="icon icon-declined">✕</div>
      <h1>Nomination Declined</h1>
      <p>
        You have declined to stand as a candidate for this nomination.
      </p>
      <div class="details">
        <p><strong>Position:</strong> ${positionsStr}</p>
        <p><strong>Proposed By:</strong> ${proposerName}</p>
        <p><strong>Seconded By:</strong> ${seconderName}</p>
        <p><strong>Outcome:</strong> Nomination was NOT submitted</p>
      </div>
      <p style="font-size: 12px; color: #64748b;">
        In accordance with election bylaws, a nomination without the nominee's affirmative consent cannot be submitted.
      </p>
      <a href="${portalUrl}" class="btn">Open Alumni Portal</a>
    `}
  </div>
</body>
</html>
  `;
}

const NEC_LOGO_URL = 'https://raw.githubusercontent.com/TharunG2006/Election_Management_System/main/public/nec-logo.png';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(value, fallback = '#') {
  const url = String(value || '').trim();
  return /^https?:/i.test(url) ? escapeHtml(url) : fallback;
}

function renderOfficialElectionCardEmail({
  subject = '',
  eyebrow = '',
  title = '',
  recipientName = 'Esteemed Alumni Member',
  recipientEmail = '',
  leadHtml = '',
  noticeHtml = '',
  sectionTitle = '',
  detailsHtml = '',
  actionTitle = '',
  actionButtonText = '',
  actionUrl = '',
  subNoteText = '',
  footerNote = ''
}) {
  const safeLink = safeUrl(actionUrl, '#');
  const safeRecipient = recipientEmail ? escapeHtml(recipientEmail) : 'the registered alumni email address';

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
  <style>
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .content-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .action-cell { display: block !important; width: 100% !important; padding: 0 0 10px !important; }
      .action-link { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 10px; background: #f3f5f8; color: #172033; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" class="email-shell" cellspacing="0" cellpadding="0" style="width: 640px; max-width: 640px; border-collapse: collapse; background: #ffffff; border: 1px solid #dbe2ec; border-top: 5px solid #7c3aed;">
          <!-- HEADER / LETTERHEAD -->
          <tr>
            <td class="content-pad" style="padding: 24px 34px 20px; border-bottom: 1px solid #e4e9f1;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <tr>
                  <td width="108" style="vertical-align: middle;">
                    <img src="${NEC_LOGO_URL}" width="90" height="56" alt="NEC Alumni Association" style="display: block; width: 90px; height: 56px; object-fit: cover; object-position: center;">
                  </td>
                  <td style="vertical-align: middle;">
                    <p style="margin: 0; color: #111827; font-size: 18px; line-height: 1.3; font-weight: 700;">National Engineering College</p>
                    <p style="margin: 3px 0 0; color: #5e6f87; font-size: 13px; line-height: 1.4;">Alumni Association, Kovilpatti</p>
                    <p style="margin: 3px 0 0; color: #7c3aed; font-size: 12px; line-height: 1.4; font-weight: 700;">Elections</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TITLE & LEAD -->
          <tr>
            <td class="content-pad" style="padding: 28px 34px 10px;">
              ${eyebrow ? `<p style="margin: 0 0 6px; color: #7c3aed; font-size: 12px; font-weight: 700; text-transform: uppercase;">${escapeHtml(eyebrow)}</p>` : ''}
              <h1 style="margin: 0; color: #111827; font-size: 25px; line-height: 1.3; font-weight: 700;">${escapeHtml(title)}</h1>
              <p style="margin: 18px 0 0; color: #172033; font-size: 15px; line-height: 1.65;">Dear ${escapeHtml(recipientName)},</p>
              ${leadHtml}
              ${noticeHtml ? `<div style="margin-top: 18px; padding: 12px 14px; background: #f7f8fb; border: 1px solid #e1e6ef; color: #52637a; font-size: 13px; line-height: 1.55;">${noticeHtml}</div>` : ''}
            </td>
          </tr>

          <!-- DETAILS / TABLE -->
          ${detailsHtml ? `
          <tr>
            <td class="content-pad" style="padding: 18px 34px 6px;">
              ${sectionTitle ? `<p style="margin: 0 0 11px; color: #111827; font-size: 15px; font-weight: 700;">${escapeHtml(sectionTitle)}</p>` : ''}
              ${detailsHtml}
            </td>
          </tr>
          ` : ''}

          <!-- ACTIONS / CTA -->
          ${actionButtonText ? `
          <tr>
            <td class="content-pad" style="padding: 26px 34px 30px;">
              ${actionTitle ? `<p style="margin: 0 0 14px; color: #111827; font-size: 16px; font-weight: 700;">${escapeHtml(actionTitle)}</p>` : ''}
              <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <tr>
                  <td class="action-cell">
                    <a class="action-link" href="${safeLink}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; border: 1px solid #7c3aed; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 4px;">${escapeHtml(actionButtonText)}</a>
                  </td>
                </tr>
              </table>
              ${subNoteText ? `<p style="margin: 17px 0 0; color: #64748b; font-size: 12px; line-height: 1.55;">${subNoteText}</p>` : ''}
            </td>
          </tr>
          ` : `
          <tr>
            <td class="content-pad" style="padding: 8px 34px 24px;">
              ${subNoteText ? `<p style="margin: 10px 0 0; color: #64748b; font-size: 12px; line-height: 1.55;">${subNoteText}</p>` : ''}
            </td>
          </tr>
          `}

          <!-- FOOTER -->
          <tr>
            <td class="content-pad" style="padding: 20px 34px; background: #f7f8fb; border-top: 1px solid #e1e6ef;">
              <p style="margin: 0; color: #172033; font-size: 13px; font-weight: 700;">Alumni Election Commission</p>
              <p style="margin: 4px 0 0; color: #64748b; font-size: 12px; line-height: 1.5;">National Engineering College (Autonomous), Kovilpatti</p>
              <p style="margin: 11px 0 0; color: #7b8798; font-size: 11px; line-height: 1.5;">${footerNote || `Sent to ${safeRecipient} regarding the NEC Alumni Association elections.`}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

function renderCandidateSummaryRows(candidateSummary = []) {
  if (!Array.isArray(candidateSummary) || !candidateSummary.length) return '';
  return candidateSummary.map((c, idx) => `
    <tr>
      <td style="width: 38%; padding: 10px 14px; border-bottom: ${idx === candidateSummary.length - 1 ? '0' : '1px solid #e5eaf2'}; color: #52637a; font-size: 13px;">${escapeHtml(c.position || 'Position')}</td>
      <td style="padding: 10px 14px; border-bottom: ${idx === candidateSummary.length - 1 ? '0' : '1px solid #e5eaf2'}; color: #172033; font-size: 13px; font-weight: 600;">${escapeHtml(c.count)} Candidate${Number(c.count) !== 1 ? 's' : ''}</td>
    </tr>
  `).join('');
}

/**
 * 1. Final Candidates Published Email — Sent to all alumni when final list is released
 */
function generateCandidatesPublishedEmail({
  recipientName = 'Esteemed Alumnus',
  electionYear = '2026',
  appUrl = 'http://localhost:5173'
}) {
  const year = String(electionYear || '2026');
  const tenure = `${year}–${Number(year) + 2}`;
  const subject = `Official Notice: Final List of Candidates Published | NEC Alumni Elections ${year}`;

  const leadHtml = `
    <p style="margin: 12px 0 0; color: #334155; font-size: 15px; line-height: 1.65;">
      The Alumni Election Scrutiny Committee has concluded the nomination verification, scrutiny, and withdrawal processes for the <strong>${escapeHtml(year)} Office Bearer Elections</strong>. The official final list of validated candidates is now published.
    </p>
    <p style="margin: 12px 0 0; color: #334155; font-size: 15px; line-height: 1.65;">
      All alumni members may now view the confirmed roll of candidates standing for each office bearer position prior to the opening of the ballot.
    </p>
  `;

  const noticeHtml = 'Nominations have closed and scrutiny is complete. Only validated candidates whose consents and seconding endorsements were verified appear on the official ballot.';

  const detailsHtml = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #dbe3ef;">
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #52637a; font-size: 13px;">Election Year</td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #172033; font-size: 13px; font-weight: 600;">${escapeHtml(year)} (Tenure ${escapeHtml(tenure)})</td>
      </tr>
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #52637a; font-size: 13px;">Notification Ref</td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #172033; font-size: 13px; font-weight: 600;">AA/ELEC/${escapeHtml(year)}/FINAL</td>
      </tr>
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #52637a; font-size: 13px;">Positions Contested</td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #172033; font-size: 13px; font-weight: 600;">President, Vice President, Secretary, Joint Secretary, Treasurer, Executive Committee</td>
      </tr>
      <tr>
        <td style="width: 38%; padding: 11px 14px; color: #52637a; font-size: 13px;">Scrutiny Status</td>
        <td style="padding: 11px 14px; color: #172033; font-size: 13px; font-weight: 600;">
          <span style="display: inline-block; padding: 2px 7px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; font-size: 11px; font-weight: 700; border-radius: 3px;">Verified & Published</span>
        </td>
      </tr>
    </table>
  `;

  return renderOfficialElectionCardEmail({
    subject,
    eyebrow: 'FINAL CANDIDATE LIST',
    title: 'Official Final List of Candidates Published',
    recipientName,
    recipientEmail: '',
    leadHtml,
    noticeHtml,
    sectionTitle: 'Election details',
    detailsHtml,
    actionTitle: 'Review candidates on the portal',
    actionButtonText: 'View Final Candidate List',
    actionUrl: appUrl,
    subNoteText: `You can review all verified candidates, qualifications, and past service by logging into the <a href="${safeUrl(appUrl, '#')}" style="color: #6d28d9; font-weight: 600;">Alumni Election Portal</a>.`
  });
}

/**
 * 2. Voting 2-Day Reminder Email — Sent 2 days before election (Day After Tomorrow is Voting Day)
 */
function generateVotingReminderEmail({
  announcement = {},
  recipientName = 'Esteemed Alumni Member',
  recipientEmail = '',
  recipientDept = '',
  recipientBatch = '',
  portalUrl = 'http://localhost:5173',
  candidateSummary = []
}) {
  const year = announcement.electionYear || '2026';
  const tenure = `${year}–${Number(year) + 2}`;
  const notifNumber = announcement.notificationNumber || `AA/ELEC/${year}/01`;
  const votingStartTime = announcement.electionStartTime || '10:00 AM';
  const votingEndTime = announcement.electionEndTime || '04:00 PM';
  const electionDateStr = formatDisplayDate(announcement.electionDate || announcement.votingDateTime || '2026-10-25', 'Sunday, October 25, 2026');

  const subject = `Election Notice: Voting Opens in 2 Days (Day After Tomorrow) | NEC Alumni Elections [Ref: ${notifNumber}]`;

  const leadHtml = `
    <p style="margin: 12px 0 0; color: #334155; font-size: 15px; line-height: 1.65;">
      This is an official advance reminder that polling for the NEC Alumni Association Office Bearer Elections (${escapeHtml(year)}) will take place the day after tomorrow, <strong>${escapeHtml(electionDateStr)}</strong>.
    </p>
    <p style="margin: 12px 0 0; color: #334155; font-size: 15px; line-height: 1.65;">
      The electronic voting booth will open promptly at <strong>${escapeHtml(votingStartTime)} IST</strong> and remain accessible until <strong>${escapeHtml(votingEndTime)} IST</strong>.
    </p>
  `;

  const noticeHtml = 'Under election rules, every registered alumni member is eligible to cast one confidential ballot across all 6 contested positions. Please mark your calendar and prepare to vote.';

  const candidateRows = renderCandidateSummaryRows(candidateSummary);
  const detailsHtml = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #dbe3ef;">
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #52637a; font-size: 13px;">Polling Date</td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #172033; font-size: 13px; font-weight: 600;">
          ${escapeHtml(electionDateStr)} <span style="display: inline-block; margin-left: 6px; padding: 2px 7px; background: #fef3c7; border: 1px solid #fde68a; color: #92400e; font-size: 11px; font-weight: 700; border-radius: 3px;">Day After Tomorrow</span>
        </td>
      </tr>
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #52637a; font-size: 13px;">Voting Hours</td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #172033; font-size: 13px; font-weight: 600;">${escapeHtml(votingStartTime)} – ${escapeHtml(votingEndTime)} IST</td>
      </tr>
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: ${candidateRows ? '1px solid #e5eaf2' : '0'}; color: #52637a; font-size: 13px;">Notification Ref</td>
        <td style="padding: 11px 14px; border-bottom: ${candidateRows ? '1px solid #e5eaf2' : '0'}; color: #172033; font-size: 13px; font-weight: 600;">${escapeHtml(notifNumber)} (Tenure ${escapeHtml(tenure)})</td>
      </tr>
      ${candidateRows}
    </table>
  `;

  return renderOfficialElectionCardEmail({
    subject,
    eyebrow: 'VOTING REMINDER • 2 DAYS TO GO',
    title: 'Voting opens the day after tomorrow',
    recipientName,
    recipientEmail,
    leadHtml,
    noticeHtml,
    sectionTitle: 'Polling schedule & details',
    detailsHtml,
    actionTitle: 'Check election portal access',
    actionButtonText: 'Open Election Portal',
    actionUrl: portalUrl,
    subNoteText: `The electronic ballot will be unlocked on ${escapeHtml(electionDateStr)} at ${escapeHtml(votingStartTime)} IST. You can sign in to the <a href="${safeUrl(portalUrl, '#')}" style="color: #6d28d9; font-weight: 600;">Alumni Election Portal</a> in advance to verify your account.`
  });
}

function generateVoting2DayReminderEmail(params) {
  return generateVotingReminderEmail(params);
}

/**
 * 3. Voting 1-Day Reminder Email — Sent 1 day before election (Day Before Voting / Tomorrow)
 */
function generateVoting1DayReminderEmail({
  announcement = {},
  recipientName = 'Esteemed Alumni Member',
  recipientEmail = '',
  recipientDept = '',
  recipientBatch = '',
  portalUrl = 'http://localhost:5173',
  candidateSummary = []
}) {
  const year = announcement.electionYear || '2026';
  const tenure = `${year}–${Number(year) + 2}`;
  const notifNumber = announcement.notificationNumber || `AA/ELEC/${year}/01`;
  const votingStartTime = announcement.electionStartTime || '10:00 AM';
  const votingEndTime = announcement.electionEndTime || '04:00 PM';
  const electionDateStr = formatDisplayDate(announcement.electionDate || announcement.votingDateTime || '2026-10-25', 'Sunday, October 25, 2026');

  const subject = `Election Notice: Voting Opens Tomorrow | NEC Alumni Elections [Ref: ${notifNumber}]`;

  const leadHtml = `
    <p style="margin: 12px 0 0; color: #334155; font-size: 15px; line-height: 1.65;">
      This is an official eve-of-election reminder that polling for the NEC Alumni Association Office Bearer Elections will open tomorrow, <strong>${escapeHtml(electionDateStr)}</strong>.
    </p>
    <p style="margin: 12px 0 0; color: #334155; font-size: 15px; line-height: 1.65;">
      Official polling hours are strictly from <strong>${escapeHtml(votingStartTime)} IST</strong> to <strong>${escapeHtml(votingEndTime)} IST</strong> tomorrow.
    </p>
  `;

  const noticeHtml = `Polling opens promptly at <strong style="color: #172033;">${escapeHtml(votingStartTime)} IST</strong> tomorrow. Alumni members are requested to cast their vote within these hours. Ballots will automatically close at ${escapeHtml(votingEndTime)} IST.`;

  const candidateRows = renderCandidateSummaryRows(candidateSummary);
  const detailsHtml = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #dbe3ef;">
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #52637a; font-size: 13px;">Polling Date</td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #172033; font-size: 13px; font-weight: 600;">
          ${escapeHtml(electionDateStr)} <span style="display: inline-block; margin-left: 6px; padding: 2px 7px; background: #dbeafe; border: 1px solid #bfdbfe; color: #1e40af; font-size: 11px; font-weight: 700; border-radius: 3px;">Tomorrow</span>
        </td>
      </tr>
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #52637a; font-size: 13px;">Voting Hours</td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #172033; font-size: 13px; font-weight: 600;">${escapeHtml(votingStartTime)} – ${escapeHtml(votingEndTime)} IST</td>
      </tr>
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: ${candidateRows ? '1px solid #e5eaf2' : '0'}; color: #52637a; font-size: 13px;">Notification Ref</td>
        <td style="padding: 11px 14px; border-bottom: ${candidateRows ? '1px solid #e5eaf2' : '0'}; color: #172033; font-size: 13px; font-weight: 600;">${escapeHtml(notifNumber)}</td>
      </tr>
      ${candidateRows}
    </table>
  `;

  return renderOfficialElectionCardEmail({
    subject,
    eyebrow: 'VOTING REMINDER • 1 DAY TO GO',
    title: 'Voting opens tomorrow',
    recipientName,
    recipientEmail,
    leadHtml,
    noticeHtml,
    sectionTitle: 'Polling schedule & positions',
    detailsHtml,
    actionTitle: 'Preview candidates & prepare to vote',
    actionButtonText: 'Open Election Portal',
    actionUrl: portalUrl,
    subNoteText: `Polling starts tomorrow at ${escapeHtml(votingStartTime)} IST. You can sign in to the <a href="${safeUrl(portalUrl, '#')}" style="color: #6d28d9; font-weight: 600;">Alumni Election Portal</a> to review candidates in advance.`
  });
}

/**
 * 4. Voting Live Email — Sent when voting is active / starts
 */
function generateVotingLiveEmail({
  announcement = {},
  recipientName = 'Esteemed Alumni Member',
  recipientEmail = '',
  recipientDept = '',
  recipientBatch = '',
  portalUrl = 'http://localhost:5173',
  candidateSummary = []
}) {
  const year = announcement.electionYear || '2026';
  const tenure = `${year}–${Number(year) + 2}`;
  const notifNumber = announcement.notificationNumber || `AA/ELEC/${year}/01`;
  const votingStartTime = announcement.electionStartTime || '10:00 AM';
  const votingEndTime = announcement.electionEndTime || '04:00 PM';
  const electionDateStr = formatDisplayDate(announcement.electionDate || announcement.votingDateTime || '2026-10-25', 'Sunday, October 25, 2026');

  const subject = `Official Notice: Voting is Now Live | NEC Alumni Elections ${year} [Ref: ${notifNumber}]`;

  const leadHtml = `
    <p style="margin: 12px 0 0; color: #334155; font-size: 15px; line-height: 1.65;">
      The electronic voting panel for the National Engineering College Alumni Association Office Bearer Elections (${escapeHtml(year)}) is now officially open.
    </p>
    <p style="margin: 12px 0 0; color: #334155; font-size: 15px; line-height: 1.65;">
      As an esteemed alumnus, your vote will determine the association's leadership for the <strong>${escapeHtml(tenure)}</strong> term. Please cast your ballot across all designated positions.
    </p>
  `;

  const noticeHtml = `Polling is currently live and will close promptly at <strong style="color: #172033;">${escapeHtml(votingEndTime)} IST today (${escapeHtml(electionDateStr)})</strong>. Once the voting deadline passes, the electronic ballot will be locked.`;

  const candidateRows = renderCandidateSummaryRows(candidateSummary);
  const detailsHtml = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #dbe3ef;">
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #52637a; font-size: 13px;">Ballot Status</td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #172033; font-size: 13px; font-weight: 600;">
          <span style="display: inline-block; padding: 2px 7px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; font-size: 11px; font-weight: 700; border-radius: 3px;">Polling Active</span>
        </td>
      </tr>
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #52637a; font-size: 13px;">Closing Time</td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #172033; font-size: 13px; font-weight: 600;">${escapeHtml(votingEndTime)} IST Today (${escapeHtml(electionDateStr)})</td>
      </tr>
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: ${candidateRows ? '1px solid #e5eaf2' : '0'}; color: #52637a; font-size: 13px;">Notification Ref</td>
        <td style="padding: 11px 14px; border-bottom: ${candidateRows ? '1px solid #e5eaf2' : '0'}; color: #172033; font-size: 13px; font-weight: 600;">${escapeHtml(notifNumber)}</td>
      </tr>
      ${candidateRows}
    </table>
  `;

  return renderOfficialElectionCardEmail({
    subject,
    eyebrow: 'VOTING IS NOW LIVE',
    title: 'The election ballot is now open',
    recipientName,
    recipientEmail,
    leadHtml,
    noticeHtml,
    sectionTitle: 'Ballot status & schedule',
    detailsHtml,
    actionTitle: 'Cast your secret ballot now',
    actionButtonText: 'Proceed to Voting Panel',
    actionUrl: portalUrl,
    subNoteText: 'Your ballot is confidential and recorded with cryptographic privacy. Upon casting your votes, an official confirmation receipt will be issued to your email.'
  });
}

/**
 * 5. Vote Confirmation Email — Sent after voter completes ballots
 */
function generateVoteConfirmationEmail({
  announcement = {},
  recipientName = 'Esteemed Alumni Member',
  recipientEmail = '',
  recipientDept = '',
  recipientBatch = '',
  voteSummary = [],
  portalUrl = 'http://localhost:5173'
}) {
  const year = announcement.electionYear || '2026';
  const tenure = `${year}–${Number(year) + 2}`;
  const notifNumber = announcement.notificationNumber || `AA/ELEC/${year}/01`;

  const subject = `Official Receipt: Ballot Recorded | NEC Alumni Association Elections ${year}`;

  const leadHtml = `
    <p style="margin: 12px 0 0; color: #334155; font-size: 15px; line-height: 1.65;">
      Thank you for participating in the NEC Alumni Association Office Bearer Elections (${escapeHtml(year)}). Your ballot has been successfully received, encrypted, and recorded in the election register.
    </p>
    <p style="margin: 12px 0 0; color: #334155; font-size: 15px; line-height: 1.65;">
      Your submission has been sealed. In accordance with election bylaws, individual voter selections remain strictly anonymous and cannot be altered or cast again.
    </p>
  `;

  const noticeHtml = 'Ballot recorded and sealed. Your individual vote selections are confidential and stored in compliance with the constitutional voting rules of the NEC Alumni Association.';

  const voteRows = Array.isArray(voteSummary) && voteSummary.length
    ? voteSummary.map((v, idx) => `
        <tr>
          <td style="width: 38%; padding: 10px 14px; border-bottom: ${idx === voteSummary.length - 1 ? '0' : '1px solid #e5eaf2'}; color: #52637a; font-size: 13px;">${escapeHtml(v.position || 'Position')}</td>
          <td style="padding: 10px 14px; border-bottom: ${idx === voteSummary.length - 1 ? '0' : '1px solid #e5eaf2'}; color: #059669; font-size: 13px; font-weight: 700;">Recorded &#10003;</td>
        </tr>
      `).join('')
    : `
      <tr>
        <td style="width: 38%; padding: 10px 14px; color: #52637a; font-size: 13px;">Ballot Status</td>
        <td style="padding: 10px 14px; color: #059669; font-size: 13px; font-weight: 700;">All Positions Recorded &#10003;</td>
      </tr>
    `;

  const detailsHtml = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #dbe3ef;">
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #52637a; font-size: 13px;">Voter</td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #172033; font-size: 13px; font-weight: 600;">
          ${escapeHtml(recipientName)}${recipientDept ? ` (${escapeHtml(recipientDept)}${recipientBatch ? `, Class of ${escapeHtml(recipientBatch)}` : ''})` : ''}
        </td>
      </tr>
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #52637a; font-size: 13px;">Ballot Status</td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #172033; font-size: 13px; font-weight: 600;">
          <span style="display: inline-block; padding: 2px 7px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; font-size: 11px; font-weight: 700; border-radius: 3px;">Sealed & Verified</span>
        </td>
      </tr>
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #52637a; font-size: 13px;">Election Reference</td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #172033; font-size: 13px; font-weight: 600;">${escapeHtml(notifNumber)} (Tenure ${escapeHtml(tenure)})</td>
      </tr>
      ${voteRows}
    </table>
  `;

  return renderOfficialElectionCardEmail({
    subject,
    eyebrow: 'BALLOT RECEIPT',
    title: 'Your ballot has been officially recorded',
    recipientName,
    recipientEmail,
    leadHtml,
    noticeHtml,
    sectionTitle: 'Submission receipt',
    detailsHtml,
    actionTitle: 'Return to the alumni portal',
    actionButtonText: 'Return to Election Portal',
    actionUrl: portalUrl,
    subNoteText: 'Official election results will be compiled and certified by the Alumni Election Commission once all voting has concluded.'
  });
}

/**
 * 6. Scrutiny Approval Confirmation Email — Sent to Nominee when Scrutiny is Passed
 */
function generateScrutinyApprovalEmail({
  nomineeName = 'Esteemed Nominee',
  targetPositions = [],
  announcement = {}
}) {
  const year = announcement.electionYear || '2026';
  const positionsStr = Array.isArray(targetPositions) ? targetPositions.join(' and ') : String(targetPositions || '');
  const subject = `Official Notice: Nomination Approved by Scrutiny Committee | NEC Alumni Elections ${year}`;

  const leadHtml = `
    <p style="margin: 12px 0 0; color: #334155; font-size: 15px; line-height: 1.65;">
      The Alumni Election Scrutiny Committee has completed review of your nomination for the position of <strong>${escapeHtml(positionsStr)}</strong>.
    </p>
    <p style="margin: 12px 0 0; color: #334155; font-size: 15px; line-height: 1.65;">
      Your candidacy complies with all constitutional eligibility criteria and qualifying service requirements. Your nomination is formally <strong>approved</strong>.
    </p>
  `;

  const noticeHtml = 'Your candidacy is confirmed. Your profile and nomination statement will appear on the official candidate roll and on the election ballot.';

  const detailsHtml = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #dbe3ef;">
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #52637a; font-size: 13px;">Candidate</td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #172033; font-size: 13px; font-weight: 600;">${escapeHtml(nomineeName)}</td>
      </tr>
      <tr>
        <td style="width: 38%; padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #52637a; font-size: 13px;">Approved Position</td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #e5eaf2; color: #172033; font-size: 13px; font-weight: 600;">${escapeHtml(positionsStr)}</td>
      </tr>
      <tr>
        <td style="width: 38%; padding: 11px 14px; color: #52637a; font-size: 13px;">Scrutiny Decision</td>
        <td style="padding: 11px 14px; color: #172033; font-size: 13px; font-weight: 600;">
          <span style="display: inline-block; padding: 2px 7px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; font-size: 11px; font-weight: 700; border-radius: 3px;">Approved & Validated</span>
        </td>
      </tr>
    </table>
  `;

  return renderOfficialElectionCardEmail({
    subject,
    eyebrow: 'SCRUTINY DECISION',
    title: 'Your nomination has been approved',
    recipientName: nomineeName,
    recipientEmail: '',
    leadHtml,
    noticeHtml,
    sectionTitle: 'Candidacy details',
    detailsHtml,
    actionTitle: 'Review your candidacy on the portal',
    actionButtonText: 'Open Election Portal',
    actionUrl: 'http://localhost:5173',
    subNoteText: 'We wish you the very best in the upcoming election.'
  });
}

module.exports = {
  generateElectionAnnouncementEmail,
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
};
