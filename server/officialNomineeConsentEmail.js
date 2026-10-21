const NEC_LOGO_URL = 'https://raw.githubusercontent.com/TharunG2006/Election_Management_System/main/public/nec-logo.png';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(value, fallback = '') {
  const url = String(value || '').trim();
  return /^https?:/i.test(url) ? escapeHtml(url) : fallback;
}

function safeImageUrl(value, fallback = '') {
  const url = String(value || '').trim();
  if (/^https?:/i.test(url)) return escapeHtml(url);
  if (/^data:image\/[a-zA-Z0-9+.-]+;base64,/i.test(url)) return url;
  return fallback;
}

function displayValue(value, fallback = 'Not provided') {
  const normalized = String(value || '').trim();
  return escapeHtml(normalized || fallback);
}

function formatConsentDeadline(value) {
  const deadline = new Date(value || 0);
  if (Number.isNaN(deadline.getTime())) return 'within 24 hours of this request';
  return deadline.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) + ' IST';
}

function formatPositions(targetPositions) {
  const positions = Array.isArray(targetPositions) ? targetPositions : [targetPositions];
  const normalized = positions.map(position => String(position || '').trim()).filter(Boolean);
  return normalized.length ? normalized.join(', ') : 'Office Bearer';
}

function getExperienceRows(previousRoles, roleDurations, roleCategory) {
  const durations = roleDurations && typeof roleDurations === 'object' ? roleDurations : {};
  const suppliedRoles = Array.isArray(previousRoles) ? previousRoles : [];
  const fallbackRoles = String(roleCategory || '').split(',');
  const roles = [...new Set([...suppliedRoles, ...Object.keys(durations), ...fallbackRoles]
    .map(role => String(role || '').trim())
    .filter(Boolean))];

  return roles.map(role => {
    const years = Array.isArray(durations[role])
      ? [...new Set(durations[role].map(year => String(year).trim()).filter(Boolean))]
        .sort((a, b) => Number(a) - Number(b))
      : [];
    return { role, years };
  });
}

function generateNomineeConsentEmail({
  proposer = {},
  nominee = {},
  seconder = {},
  targetPositions = [],
  previousRoles = [],
  roleDurations = {},
  roleCategory = '',
  purposeStatement = '',
  nomineePhoto = null,
  consentToken = '',
  consentExpiresAt = null,
  portalUrl = 'http://localhost:5173',
  apiBaseUrl = 'http://localhost:5000'
}) {
  const positions = formatPositions(targetPositions);
  const encodedToken = encodeURIComponent(String(consentToken || ''));
  const acceptUrl = `${String(apiBaseUrl).replace(/\/$/, '')}/api/nominations/nominee-consent?token=${encodedToken}&decision=accept`;
  const declineUrl = `${String(apiBaseUrl).replace(/\/$/, '')}/api/nominations/nominee-consent?token=${encodedToken}&decision=decline`;
  const safePortalUrl = safeUrl(portalUrl, '#');
  const safeAcceptUrl = safeUrl(acceptUrl, '#');
  const safeDeclineUrl = safeUrl(declineUrl, '#');
  const photoSource = safeImageUrl(nomineePhoto);
  const experienceRows = getExperienceRows(previousRoles, roleDurations, roleCategory);
  const nomineeName = String(nominee.name || 'Alumni Member').trim();
  const proposerName = String(proposer.name || 'The proposer').trim();
  const seconderName = String(seconder.name || 'The seconder').trim();
  const recipientEmail = String(nominee.email || '').trim();
  const subject = `Nomination consent request: ${nomineeName} for ${positions} | NEC Alumni Elections`;
  const purpose = String(purposeStatement || '').trim();
  const deadlineText = formatConsentDeadline(consentExpiresAt);

  const experienceHtml = experienceRows.length
    ? `
      <div style="margin-top: 24px;">
        <p style="margin: 0 0 10px; color: #111827; font-size: 15px; font-weight: 700;">Qualifying service</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #dbe3ef;">
          ${experienceRows.map(({ role, years }, index) => `
            <tr>
              <td style="width: 48%; padding: 11px 12px; border-bottom: ${index === experienceRows.length - 1 ? '0' : '1px solid #e5eaf2'}; color: #52637a; font-size: 13px; vertical-align: top;">${escapeHtml(role)}</td>
              <td style="padding: 11px 12px; border-bottom: ${index === experienceRows.length - 1 ? '0' : '1px solid #e5eaf2'}; color: #172033; font-size: 13px; font-weight: 600; vertical-align: top;">${years.length ? escapeHtml(years.join(', ')) : 'Years not provided'}</td>
            </tr>`).join('')}
        </table>
      </div>`
    : '';

  const purposeHtml = purpose
    ? `
      <div style="margin-top: 24px;">
        <p style="margin: 0 0 9px; color: #111827; font-size: 15px; font-weight: 700;">Proposer's statement</p>
        <div style="padding: 14px 16px; border-left: 3px solid #7c3aed; background: #f7f5ff; color: #334155; font-size: 14px; line-height: 1.65;">${escapeHtml(purpose).replace(/\r?\n/g, '<br>')}</div>
      </div>`
    : '';

  const photoCellHtml = photoSource
    ? `<td width="106" style="padding: 16px; vertical-align: top;"><img src="${photoSource}" width="82" height="96" alt="Photograph of ${escapeHtml(nomineeName)}" style="display: block; width: 82px; height: 96px; object-fit: cover; border-radius: 4px; border: 1px solid #d6deea;"></td>`
    : '';

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
  <style>
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .content-pad { padding-left: 22px !important; padding-right: 22px !important; }
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
          <tr>
            <td class="content-pad" style="padding: 28px 34px 10px;">
              <p style="margin: 0 0 6px; color: #7c3aed; font-size: 12px; font-weight: 700;">NOMINATION CONSENT</p>
              <h1 style="margin: 0; color: #111827; font-size: 25px; line-height: 1.3; font-weight: 700;">Please review your nomination</h1>
              <p style="margin: 18px 0 0; color: #172033; font-size: 15px; line-height: 1.65;">Dear ${escapeHtml(nomineeName)},</p>
              <p style="margin: 12px 0 0; color: #334155; font-size: 15px; line-height: 1.65;">${escapeHtml(proposerName)} has nominated you for the position of <strong>${escapeHtml(positions)}</strong> in the NEC Alumni Association Elections. ${escapeHtml(seconderName)} has formally seconded this nomination. Please review the details and confirm whether you agree to stand as a candidate.</p>
              <div style="margin-top: 18px; padding: 12px 14px; background: #f7f8fb; border: 1px solid #e1e6ef; color: #52637a; font-size: 13px; line-height: 1.55;">Under election rules, your nomination will proceed to scrutiny and the ballot only after you give consent. Please respond by <strong style="color: #172033;">${escapeHtml(deadlineText)}</strong>. If no response is received within 24 hours, this nomination will be automatically closed.</div>
            </td>
          </tr>
          <tr>
            <td class="content-pad" style="padding: 18px 34px 6px;">
              <p style="margin: 0 0 11px; color: #111827; font-size: 15px; font-weight: 700;">Nomination details</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #dbe3ef;">
                <tr>
                  ${photoCellHtml}
                  <td style="padding: 16px; ${photoSource ? 'padding-left: 0;' : ''} vertical-align: top;">
                    <p style="margin: 0; color: #111827; font-size: 18px; line-height: 1.35; font-weight: 700;">${displayValue(nominee.name, 'Nominee')}</p>
                    <p style="margin: 4px 0 0; color: #52637a; font-size: 13px; line-height: 1.5;">${displayValue(nominee.department)}${nominee.graduationYear || nominee.batch ? ` &middot; Class of ${displayValue(nominee.graduationYear || nominee.batch)}` : ''}</p>
                    <p style="margin: 13px 0 0; color: #52637a; font-size: 12px;">Position</p>
                    <p style="margin: 3px 0 0; color: #172033; font-size: 14px; font-weight: 700;">${escapeHtml(positions)}</p>
                    <p style="margin: 11px 0 0; color: #52637a; font-size: 12px;">Proposed by</p>
                    <p style="margin: 3px 0 0; color: #172033; font-size: 14px;">${displayValue(proposer.name)}${proposer.department || proposer.batch || proposer.graduationYear ? ` <span style="color: #64748b;">(${displayValue(proposer.department)}${proposer.batch || proposer.graduationYear ? `, Class of ${displayValue(proposer.batch || proposer.graduationYear)}` : ''})</span>` : ''}</p>
                    <p style="margin: 11px 0 0; color: #52637a; font-size: 12px;">Seconded by</p>
                    <p style="margin: 3px 0 0; color: #172033; font-size: 14px;">${displayValue(seconder.name)}${seconder.department || seconder.batch || seconder.graduationYear ? ` <span style="color: #64748b;">(${displayValue(seconder.department)}${seconder.batch || seconder.graduationYear ? `, Class of ${displayValue(seconder.batch || seconder.graduationYear)}` : ''})</span>` : ''} <span style="display: inline-block; margin-left: 6px; padding: 2px 7px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; font-size: 11px; font-weight: 700; border-radius: 3px;">Seconded</span></p>
                  </td>
                </tr>
              </table>
              ${experienceHtml}
              ${purposeHtml}
            </td>
          </tr>
          <tr>
            <td class="content-pad" style="padding: 26px 34px 30px;">
              <p style="margin: 0 0 14px; color: #111827; font-size: 16px; font-weight: 700;">Will you accept this nomination?</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <tr>
                  <td class="action-cell" style="padding-right: 10px;">
                    <a class="action-link" href="${safeAcceptUrl}" style="display: inline-block; padding: 12px 20px; background: #7c3aed; border: 1px solid #7c3aed; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none;">Accept and stand</a>
                  </td>
                  <td class="action-cell">
                    <a class="action-link" href="${safeDeclineUrl}" style="display: inline-block; padding: 12px 20px; background: #ffffff; border: 1px solid #b8c2d1; color: #334155; font-size: 14px; font-weight: 700; text-decoration: none;">Decline</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 17px 0 0; color: #64748b; font-size: 12px; line-height: 1.55;">These response links are personal to you. Please do not forward this email. You can also review and respond to this nomination by signing in to the <a href="${safePortalUrl}" style="color: #6d28d9;">Alumni Election Portal</a>.</p>
            </td>
          </tr>
          <tr>
            <td class="content-pad" style="padding: 20px 34px; background: #f7f8fb; border-top: 1px solid #e1e6ef;">
              <p style="margin: 0; color: #172033; font-size: 13px; font-weight: 700;">Alumni Election Commission</p>
              <p style="margin: 4px 0 0; color: #64748b; font-size: 12px; line-height: 1.5;">National Engineering College (Autonomous), Kovilpatti</p>
              <p style="margin: 11px 0 0; color: #7b8798; font-size: 11px; line-height: 1.5;">Sent to ${displayValue(recipientEmail, 'the registered nominee email address')} regarding an Alumni Association election nomination.</p>
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

module.exports = { generateNomineeConsentEmail };
