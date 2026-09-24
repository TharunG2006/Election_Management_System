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

function generateElectionAnnouncementEmail({
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

function generateSeconderConsentEmail({
  proposer = {},
  nominee = {},
  seconder = {},
  targetPositions = [],
  roleCategory = '',
  purposeStatement = '',
  consentToken = '',
  portalUrl = 'http://localhost:5173',
  apiBaseUrl = 'http://localhost:5000'
}) {
  const positionsStr = Array.isArray(targetPositions) ? targetPositions.join(', ') : (targetPositions || 'Office Bearer');
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

      <!-- NOMINATION SUMMARY CARD -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 14px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #4338ca; font-weight: 800; border-bottom: 1px solid #e2e8f0; pb: 8px;">
          Nomination Proposal Details
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
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

module.exports = {
  generateElectionAnnouncementEmail,
  generateSeconderConsentEmail,
  generateSeconderConfirmationPage
};

