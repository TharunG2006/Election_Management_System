const FALLBACK_POSITIONS = [
  'President',
  'Vice President',
  'Secretary',
  'Joint Secretary',
  'Treasurer',
  'Joint Treasurer'
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function withLineBreaks(value) {
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

function formatOfficialDate(value, fallback) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
}

function safePortalUrl(value) {
  try {
    const parsed = new URL(value || 'http://localhost:5173');
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol');
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return 'http://localhost:5173';
  }
}

function cleanSubject(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

function isLegacySubject(value) {
  return /^OFFICIAL NOTIFICATION:.*Call for Nominations/i.test(value)
    || /^Alumni Association Election \d{4}: Official notice and schedule/i.test(value);
}

function isLegacyIntro(value) {
  return /^Notice is hereby formally given to all registered alumni members/i.test(value);
}

function isLegacyBody(value) {
  return /nominations are hereby (formally )?called/i.test(value)
    && /(published via|formally published via|forthcoming AGM)/i.test(value);
}

function normalisePositions(announcement, electionPositions) {
  const source = Array.isArray(announcement.positions) && announcement.positions.length
    ? announcement.positions
    : electionPositions;
  const values = Array.isArray(source) && source.length ? source : FALLBACK_POSITIONS;

  return values.map((position) => {
    if (typeof position === 'string') return { title: position, seats: 1 };
    return {
      title: position.title || position.name || position.position || 'Office Bearer',
      seats: Number(position.seats || position.posts || 1) || 1
    };
  });
}

function scheduleRow(label, value, options = {}) {
  const background = options.highlight ? '#f5f3ff' : '#ffffff';
  const valueColour = options.highlight ? '#5b21b6' : '#1f2937';
  return `
    <tr class="schedule-row" style="background:${background};">
      <td class="schedule-label" style="width:42%;padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#4b5563;font-size:13px;vertical-align:top;overflow-wrap:anywhere;">${escapeHtml(label)}</td>
      <td class="schedule-value" style="width:58%;padding:10px 12px;border-bottom:1px solid #e5e7eb;color:${valueColour};font-size:13px;font-weight:600;text-align:right;vertical-align:top;overflow-wrap:anywhere;">${escapeHtml(value)}</td>
    </tr>`;
}

function generateElectionAnnouncementEmail({
  announcement = {},
  electionPositions = [],
  recipientName = 'Alumni Member',
  recipientEmail = '',
  recipientDept = '',
  recipientBatch = '',
  portalUrl = 'http://localhost:5173',
  logoSource = ''
}) {
  const year = String(announcement.electionYear || announcement.year || new Date().getFullYear());
  const yearNumber = Number(year);
  const tenureEnd = Number.isFinite(yearNumber) ? yearNumber + 2 : Number(year) + 2;
  const eligibilityStart = Number.isFinite(yearNumber) ? yearNumber - 5 : 2021;
  const tenureText = `${year}-${tenureEnd}`;
  const notifNumber = announcement.notificationNumber || announcement.referenceNumber || `AA/ELEC/${year}/01`;
  const positions = normalisePositions(announcement, electionPositions);
  const resolvedPortalUrl = safePortalUrl(portalUrl);
  const logoUrl = logoSource || `${resolvedPortalUrl}/nec-logo.png`;

  const suppliedSubject = cleanSubject(announcement.emailSubject);
  const subject = suppliedSubject && !isLegacySubject(suppliedSubject)
    ? suppliedSubject
    : `National Engineering College Alumni Association Election ${year}: Official notice and schedule [${notifNumber}]`;

  const suppliedIntro = String(announcement.emailIntro || '').trim();
  const intro = suppliedIntro && !isLegacyIntro(suppliedIntro)
    ? suppliedIntro
    : `The Alumni Association Election Commission invites eligible alumni members to participate in the ${year} election for Executive Office Bearers.`;

  const suppliedBody = String(announcement.emailBody || announcement.description || '').trim();
  const body = suppliedBody && !isLegacyBody(suppliedBody)
    ? suppliedBody
    : 'This notice summarises the eligibility requirements, nomination process, publication milestones and voting window. All election actions and status updates are handled through the Alumni Election Portal.';

  const nominationStart = formatOfficialDate(announcement.nominationStartDate, 'To be announced');
  const nominationDeadline = formatOfficialDate(announcement.nominationDeadline, 'To be announced');
  const scrutinyDate = formatOfficialDate(announcement.scrutinyMeetingDate, 'To be announced');
  const withdrawalDeadline = formatOfficialDate(announcement.withdrawalDeadline, 'To be announced');
  const finalListDate = formatOfficialDate(announcement.finalListDate, 'To be announced');
  const votingDate = formatOfficialDate(
    announcement.electionDate || announcement.votingDateTime,
    'To be announced'
  );
  const votingStartTime = announcement.electionStartTime || announcement.votingStartTime || '10:00 AM';
  const votingEndTime = announcement.electionEndTime || announcement.votingEndTime || '04:00 PM';
  const votingWindow = votingDate === 'To be announced'
    ? votingDate
    : `${votingDate}, ${votingStartTime} to ${votingEndTime} IST`;
  const agmDate = formatOfficialDate(announcement.agmDate, 'To be announced');
  const issuedDate = formatOfficialDate(new Date(), '');
  const recipientMeta = [recipientEmail, recipientDept, recipientBatch].filter(Boolean).join(' | ');

  const rolesRows = positions.map((position, index) => `
    <tr>
      <td style="padding:9px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;width:28px;">${index + 1}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;font-weight:600;">${escapeHtml(position.title)}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #e5e7eb;color:#4b5563;font-size:12px;text-align:right;white-space:nowrap;">${position.seats} ${position.seats === 1 ? 'post' : 'posts'}</td>
    </tr>`).join('');

  const customNotes = String(announcement.emailCustomNotes || '').trim();
  const authorisedBy = announcement.emailSignOffAuthorized || 'Alumni Election Commission';
  const approvedBy = announcement.emailSignOffApproved || 'Patron and Principal';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
  <style>
    .email-shell { width: 100% !important; max-width: 680px !important; table-layout: fixed !important; }
    @media only screen and (max-width: 620px) {
      .page-pad { padding: 12px 6px !important; }
      .content-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .meta-cell { display: block !important; width: 100% !important; text-align: left !important; padding-top: 3px !important; }
      .schedule-row { display: block !important; width: 100% !important; }
      .schedule-label, .schedule-value { display: block !important; width: auto !important; text-align: left !important; border-bottom: 0 !important; }
      .schedule-label { padding-bottom: 2px !important; }
      .schedule-value { padding-top: 0 !important; border-bottom: 1px solid #e5e7eb !important; }
      .signatory { display: block !important; width: 100% !important; text-align: left !important; padding: 8px 0 !important; }
    }
  </style>
</head>
<body style="margin:0;background:#eef2f7;color:#1f2937;font-family:Arial,Helvetica,sans-serif;">
  <div class="page-pad" style="padding:24px 10px;">
    <table class="email-shell" role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;table-layout:fixed;margin:0 auto;background:#ffffff;border:1px solid #d7dde7;border-top:5px solid #6d28d9;">
      <tr>
        <td class="content-pad" style="padding:24px 30px 20px;border-bottom:1px solid #d7dde7;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="width:64px;vertical-align:middle;padding-right:14px;">
                <img src="${escapeHtml(logoUrl)}" width="54" height="54" alt="National Engineering College" style="display:block;width:54px;height:54px;object-fit:contain;border:0;" />
              </td>
              <td style="vertical-align:middle;">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.25;font-weight:700;color:#111827;">National Engineering College</div>
                <div style="margin-top:3px;font-size:13px;line-height:1.5;color:#64748b;">Alumni Association, Kovilpatti</div>
                <div style="margin-top:3px;font-size:11px;line-height:1.4;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#6d28d9;">Elections</div>
                <div style="margin-top:2px;font-size:10px;line-height:1.4;color:#6b7280;">Election Commission &middot; Autonomous Institution</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td class="content-pad" style="padding:25px 30px 12px;">
          <div style="font-size:12px;font-weight:700;color:#6d28d9;text-transform:uppercase;letter-spacing:0.7px;">Election Notice</div>
          <h1 style="margin:7px 0 15px;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.3;color:#111827;font-weight:700;">Official Notice: Alumni Association Election ${escapeHtml(year)}</h1>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
            <tr>
              <td class="meta-cell" style="padding:9px 0;font-size:12px;color:#4b5563;"><strong>Reference:</strong> ${escapeHtml(notifNumber)}</td>
              <td class="meta-cell" style="padding:9px 0;font-size:12px;color:#4b5563;text-align:center;"><strong>Term:</strong> ${escapeHtml(tenureText)}</td>
              <td class="meta-cell" style="padding:9px 0;font-size:12px;color:#4b5563;text-align:right;"><strong>Issued:</strong> ${escapeHtml(issuedDate)}</td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td class="content-pad" style="padding:12px 30px 26px;">
          <p style="margin:0 0 5px;font-size:15px;line-height:1.6;color:#111827;">Dear ${escapeHtml(recipientName)},</p>
          ${recipientMeta ? `<p style="margin:0 0 17px;font-size:11px;line-height:1.5;color:#6b7280;">${escapeHtml(recipientMeta)}</p>` : '<div style="height:9px;line-height:9px;">&nbsp;</div>'}
          <p style="margin:0 0 11px;font-size:14px;line-height:1.65;color:#374151;">${withLineBreaks(intro)}</p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.65;color:#374151;">${withLineBreaks(body)}</p>

          ${customNotes ? `
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 22px;background:#fafafa;border-left:3px solid #6d28d9;">
            <tr><td style="padding:11px 13px;font-size:13px;line-height:1.6;color:#374151;"><strong>Additional note:</strong><br />${withLineBreaks(customNotes)}</td></tr>
          </table>` : ''}

          <h2 style="margin:0 0 9px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.4;color:#111827;">Positions notified</h2>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;margin:0 0 24px;border:1px solid #e5e7eb;border-collapse:collapse;">
            ${rolesRows}
          </table>

          <h2 style="margin:0 0 9px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.4;color:#111827;">Eligibility criteria</h2>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:13px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;line-height:1.6;color:#374151;"><strong style="color:#111827;">President:</strong> The candidate must have served as an Office Bearer of the Alumni Association at least once during the five years immediately before the election (${escapeHtml(String(eligibilityStart))}-${escapeHtml(year)}).</td>
            </tr>
            <tr>
              <td style="padding:13px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;line-height:1.6;color:#374151;"><strong style="color:#111827;">Other Office Bearer positions:</strong> The candidate must be a registered alumni member, have at least one continuous year of active service without a break during the last five years, and have held a recognised responsibility as an Office Bearer, Chapter Coordinator, Club Coordinator, Mentorship or Placement Coordinator, or Data Management Team Coordinator.</td>
            </tr>
            <tr>
              <td style="padding:13px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;line-height:1.6;color:#374151;"><strong style="color:#111827;">Voting:</strong> Every verified, registered alumni member may cast one confidential vote for each contested position.</td>
            </tr>
            <tr>
              <td style="padding:13px 14px;font-size:13px;line-height:1.6;color:#374151;"><strong style="color:#111827;">Verification:</strong> Nominations will be checked against the official election bylaws. The decision made under those rules is final and binding.</td>
            </tr>
          </table>

          <h2 style="margin:0 0 9px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.4;color:#111827;">How the portal will be used</h2>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;">
            <tr><td style="width:24px;padding:5px 7px 5px 0;color:#6d28d9;font-size:13px;font-weight:700;vertical-align:top;">1.</td><td style="padding:5px 0;font-size:13px;line-height:1.55;color:#374151;"><strong>Review eligibility:</strong> The published Eligibility Criteria page remains available in the portal unless it is withdrawn by the Election Commission.</td></tr>
            <tr><td style="width:24px;padding:5px 7px 5px 0;color:#6d28d9;font-size:13px;font-weight:700;vertical-align:top;">2.</td><td style="padding:5px 0;font-size:13px;line-height:1.55;color:#374151;"><strong>Submit a proposal:</strong> Self-nomination is not permitted. During the nomination window, an alumni member proposes a candidate and identifies a seconder. The nominee and seconder complete their consent steps before scrutiny.</td></tr>
            <tr><td style="width:24px;padding:5px 7px 5px 0;color:#6d28d9;font-size:13px;font-weight:700;vertical-align:top;">3.</td><td style="padding:5px 0;font-size:13px;line-height:1.55;color:#374151;"><strong>Track candidature:</strong> Nomination status, scrutiny decisions and withdrawal are managed in the portal. An approved candidate may withdraw only up to the stated deadline.</td></tr>
            <tr><td style="width:24px;padding:5px 7px 5px 0;color:#6d28d9;font-size:13px;font-weight:700;vertical-align:top;">4.</td><td style="padding:5px 0;font-size:13px;line-height:1.55;color:#374151;"><strong>View and vote:</strong> The final candidate list becomes visible from its publication date. Voting opens only on the configured voting date and only during the stated hours.</td></tr>
          </table>

          <h2 style="margin:0 0 9px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.4;color:#111827;">Election schedule</h2>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;margin:0 0 24px;border:1px solid #e5e7eb;border-collapse:collapse;">
            ${scheduleRow('Nomination opens', nominationStart)}
            ${scheduleRow('Nomination deadline', nominationDeadline)}
            ${scheduleRow('Scrutiny conclave', scrutinyDate)}
            ${scheduleRow('Candidate withdrawal deadline', withdrawalDeadline)}
            ${scheduleRow('Final candidate list publication', finalListDate)}
            ${scheduleRow('Online voting window', votingWindow, { highlight: true })}
            ${scheduleRow('Annual General Meeting (AGM)', agmDate)}
          </table>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px auto 28px;">
            <tr>
              <td style="background:#6d28d9;border-radius:4px;text-align:center;">
                <a href="${escapeHtml(resolvedPortalUrl)}" target="_blank" style="display:inline-block;padding:12px 21px;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;">Open Alumni Election Portal</a>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 5px;font-size:13px;line-height:1.6;color:#374151;">Regards,</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e5e7eb;margin-top:12px;padding-top:12px;">
            <tr>
              <td class="signatory" style="width:50%;padding-top:12px;vertical-align:top;">
                <div style="font-size:11px;color:#6b7280;">Issued by</div>
                <div style="margin-top:3px;font-size:13px;font-weight:700;color:#111827;">${escapeHtml(authorisedBy)}</div>
                <div style="margin-top:2px;font-size:11px;color:#6b7280;">Alumni Association (NECAA)</div>
              </td>
              <td class="signatory" style="width:50%;padding-top:12px;text-align:right;vertical-align:top;">
                <div style="font-size:11px;color:#6b7280;">Approved by</div>
                <div style="margin-top:3px;font-size:13px;font-weight:700;color:#111827;">${escapeHtml(approvedBy)}</div>
                <div style="margin-top:2px;font-size:11px;color:#6b7280;">National Engineering College (Autonomous)</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td class="content-pad" style="padding:16px 30px;background:#f8fafc;border-top:1px solid #e5e7eb;font-size:11px;line-height:1.55;color:#6b7280;text-align:center;">
          This election notice was sent to ${escapeHtml(recipientEmail || 'your registered email address')}. Please do not share your account credentials or any voting confirmation details.
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

  return { subject, html };
}

module.exports = { generateElectionAnnouncementEmail };
