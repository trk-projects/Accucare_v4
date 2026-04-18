'use strict';

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  const { MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET } = process.env;
  if (!MS_TENANT_ID || !MS_CLIENT_ID || !MS_CLIENT_SECRET) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Microsoft 365 credentials not configured.' }) };
  }

  async function getAccessToken() {
    const res = await fetch(
      `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: MS_CLIENT_ID,
          client_secret: MS_CLIENT_SECRET,
          scope: 'https://graph.microsoft.com/.default'
        })
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(`Token error: ${data.error_description || data.error}`);
    return data.access_token;
  }

  async function sendMail(accessToken, senderEmail, message) {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Graph API error: ${JSON.stringify(err)}`);
    }
  }

  const { firstname, lastname, email, phone, role, licensed, bgcheck, drugtest, workauth, sponsorship, experience, startdate, resume_filename, resume_content, submitted_at, source_page } = JSON.parse(event.body || '{}');

  const fullName = [firstname, lastname].filter(Boolean).join(' ') || 'N/A';
  const firstName = firstname || 'there';

  const submittedFormatted = submitted_at
    ? new Date(submitted_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    : 'N/A';

  const startFormatted = startdate
    ? new Date(startdate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  // Update this URL once the custom domain is connected
  const LOGO_URL = 'https://accucare.netlify.app/brandTheme/accucare-logo-email.png';

  function yesNo(val) {
    if (!val) return '<span style="color:#94a3b8;font-size:14px;">N/A</span>';
    return val === 'Yes'
      ? '<span style="color:#2E7D5E;font-weight:700;font-size:14px;">Yes</span>'
      : '<span style="color:#CC2229;font-weight:700;font-size:14px;">No</span>';
  }

  function field(label, value, isLink) {
    const display = value || 'N/A';
    const content = isLink && value
      ? `<a href="${isLink}" class="field-link" style="color:#1B3068;font-weight:600;text-decoration:none;font-size:15px;">${display}</a>`
      : `<span class="field-val" style="font-size:15px;font-weight:600;color:#0f172a;">${display}</span>`;
    return `
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;background-color:#ffffff;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">${label}</p>
          ${content}
        </td>
      </tr>`;
  }

  /* ── Internal notification to Accucare ── */
  const internalHtml = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>New Job Applicant</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; padding: 0; background-color: #f0f4f8 !important; }
    [data-ogsc] body, [data-ogsc] .email-bg { background-color: #f0f4f8 !important; }
    [data-ogsc] .email-card { background-color: #ffffff !important; }
    [data-ogsc] .email-header { background-color: #1B3068 !important; }
    [data-ogsc] .email-footer { background-color: #0e1e44 !important; }
    [data-ogsc] .email-logo-bar { background-color: #ffffff !important; }
    [data-ogsc] .field-row { background-color: #ffffff !important; }
    [data-ogsc] .eligibility-row td { background-color: #ffffff !important; color: #334155 !important; }
    [data-ogsc] .body-text { color: #334155 !important; }
    [data-ogsc] .strong-text { color: #0f172a !important; }
    @media only screen and (max-width: 620px) {
      .email-wrapper { width: 100% !important; }
      .email-pad { padding-left: 24px !important; padding-right: 24px !important; }
      .btn-group td { display: block !important; text-align: center !important; padding-bottom: 8px !important; }
    }
    @media (prefers-color-scheme: dark) {
      body, .email-bg { background-color: #0d1117 !important; }
      .email-header { background-color: #1B3068 !important; }
      .header-eyebrow { color: rgba(255,255,255,0.85) !important; }
      .header-sub { color: rgba(255,255,255,0.92) !important; }
      .header-meta { color: rgba(255,255,255,0.75) !important; }
      .email-logo-bar { background-color: #161b22 !important; border-bottom-color: #30363d !important; }
      .email-card { background-color: #161b22 !important; }
      .field-row td { background-color: #161b22 !important; border-bottom-color: #30363d !important; }
      .field-val { color: #e6edf3 !important; }
      .field-link { color: #58a6ff !important; }
      .body-text { color: #8b949e !important; }
      .strong-text { color: #e6edf3 !important; }
      .eligibility-row td { background-color: #161b22 !important; border-bottom-color: #30363d !important; color: #8b949e !important; }
      .resume-box { background-color: #161b22 !important; }
      .resume-box td { background-color: #161b22 !important; }
      .call-btn { background-color: #161b22 !important; color: #58a6ff !important; border-color: #58a6ff !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;" class="email-bg">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;" class="email-bg">
    <tr><td align="center" style="padding:32px 16px 48px;">

      <table class="email-wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- Logo bar -->
        <tr>
          <td style="background-color:#ffffff;padding:24px 40px;border-bottom:1px solid #e2e8f0;" class="email-logo-bar">
            <img src="${LOGO_URL}" alt="Accucare Nurse Staffing" width="160" style="display:block;height:auto;max-height:48px;object-fit:contain;" />
          </td>
        </tr>

        <!-- Header -->
        <tr>
          <td style="background-color:#1B3068;padding:36px 40px 30px;" class="email-header email-pad">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;">
                  <p class="header-eyebrow" style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.5);">New Applicant</p>
                  <h1 style="margin:0;font-size:26px;font-weight:400;color:#ffffff;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">New Job Applicant</h1>
                  <p class="header-meta" style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.55);">${submittedFormatted}</p>
                </td>
                <td style="vertical-align:middle;text-align:right;padding-left:20px;white-space:nowrap;">
                  <span style="display:inline-block;background-color:#CC2229;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:7px 14px;border-radius:20px;">${role || 'Not specified'}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Red accent bar -->
        <tr><td style="background-color:#CC2229;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Applicant Details -->
        <tr>
          <td style="background-color:#ffffff;padding:36px 40px 0;" class="email-card email-pad">
            <p style="margin:0 0 20px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Applicant Details</p>
          </td>
        </tr>

        <tr>
          <td style="background-color:#ffffff;padding:0 40px;" class="email-card email-pad">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;" class="field-row">
              ${field('Full Name', fullName)}
              ${field('Position Applied For', role)}
              ${field('Email', email, email ? `mailto:${email}` : null)}
              ${field('Phone', phone, phone ? `tel:${phone}` : null)}
              ${field('Years of Experience', experience)}
              ${field('Preferred Start Date', startFormatted)}
            </table>
          </td>
        </tr>

        <!-- Eligibility -->
        <tr>
          <td style="background-color:#ffffff;padding:24px 40px 0;" class="email-card email-pad">
            <p style="margin:0 0 14px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Eligibility</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
              <tr class="eligibility-row">
                <td style="padding:13px 20px;font-size:13px;color:#334155;background-color:#ffffff;border-bottom:1px solid #e2e8f0;width:80%;" class="body-text">Has required license / certification for the position</td>
                <td style="padding:13px 20px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;text-align:center;">${yesNo(licensed)}</td>
              </tr>
              <tr class="eligibility-row">
                <td style="padding:13px 20px;font-size:13px;color:#334155;background-color:#ffffff;border-bottom:1px solid #e2e8f0;" class="body-text">Willing to undergo a background check</td>
                <td style="padding:13px 20px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;text-align:center;">${yesNo(bgcheck)}</td>
              </tr>
              <tr class="eligibility-row">
                <td style="padding:13px 20px;font-size:13px;color:#334155;background-color:#ffffff;border-bottom:1px solid #e2e8f0;" class="body-text">Willing to take a drug test</td>
                <td style="padding:13px 20px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;text-align:center;">${yesNo(drugtest)}</td>
              </tr>
              <tr class="eligibility-row">
                <td style="padding:13px 20px;font-size:13px;color:#334155;background-color:#ffffff;border-bottom:1px solid #e2e8f0;" class="body-text">Legally authorized to work in the United States</td>
                <td style="padding:13px 20px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;text-align:center;">${yesNo(workauth)}</td>
              </tr>
              <tr class="eligibility-row">
                <td style="padding:13px 20px;font-size:13px;color:#334155;background-color:#ffffff;" class="body-text">Will require visa sponsorship (now or in the future)</td>
                <td style="padding:13px 20px;background-color:#ffffff;text-align:center;">${yesNo(sponsorship)}</td>
              </tr>
            </table>
          </td>
        </tr>

        ${resume_filename ? `
        <!-- Resume -->
        <tr>
          <td style="background-color:#ffffff;padding:24px 40px 0;" class="email-card email-pad">
            <p style="margin:0 0 12px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Resume</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-left:4px solid #CC2229;border-radius:0 8px 8px 0;background-color:#fafafa;" class="resume-box">
              <tr><td style="padding:16px 20px;background-color:#fafafa;" class="resume-box">
                <p style="margin:0;font-size:14px;color:#334155;" class="body-text">File: <strong style="color:#0f172a;" class="strong-text">${resume_filename}</strong> — attached below.</p>
              </td></tr>
            </table>
          </td>
        </tr>
        ` : ''}

        <!-- Action buttons -->
        <tr>
          <td style="background-color:#ffffff;padding:32px 40px 40px;text-align:center;" class="email-card email-pad">
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;" class="btn-group">
              <tr>
                <td style="padding-right:8px;">
                  <a href="mailto:${email}?subject=Re: Your Application at Accucare Nurse Staffing" style="display:inline-block;background-color:#CC2229;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 28px;border-radius:6px;">Reply to ${firstname || 'Applicant'}</a>
                </td>
                <td style="padding-left:8px;">
                  <a href="tel:${phone}" class="call-btn" style="display:inline-block;background-color:#ffffff;color:#1B3068;font-size:14px;font-weight:600;text-decoration:none;padding:11px 28px;border-radius:6px;border:2px solid #1B3068;">Call ${firstname || 'Applicant'}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#0e1e44;padding:22px 40px;text-align:center;" class="email-footer">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#ffffff;letter-spacing:0.5px;">Accucare Nurse Staffing</p>
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.45);">Sent by TRK Agency &nbsp;&bull;&nbsp; <a href="${source_page || 'https://accucare.netlify.app'}" style="color:rgba(255,255,255,0.45);text-decoration:underline;">View source page</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;

  /* ── Confirmation email to the applicant ── */
  const confirmHtml = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>We received your application</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; padding: 0; background-color: #f0f4f8 !important; }
    [data-ogsc] body, [data-ogsc] .email-bg { background-color: #f0f4f8 !important; }
    [data-ogsc] .email-card { background-color: #ffffff !important; }
    [data-ogsc] .email-header { background-color: #1B3068 !important; }
    [data-ogsc] .email-footer { background-color: #0e1e44 !important; }
    [data-ogsc] .email-logo-bar { background-color: #ffffff !important; }
    [data-ogsc] .summary-box { background-color: #f8fafc !important; }
    [data-ogsc] .body-text { color: #334155 !important; }
    [data-ogsc] .strong-text { color: #0f172a !important; }
    @media only screen and (max-width: 620px) {
      .email-wrapper { width: 100% !important; }
      .email-pad { padding-left: 24px !important; padding-right: 24px !important; }
    }
    @media (prefers-color-scheme: dark) {
      body, .email-bg { background-color: #0d1117 !important; }
      .email-header { background-color: #1B3068 !important; }
      .header-eyebrow { color: rgba(255,255,255,0.85) !important; }
      .header-sub { color: rgba(255,255,255,0.92) !important; }
      .email-logo-bar { background-color: #161b22 !important; border-bottom-color: #30363d !important; }
      .email-card { background-color: #161b22 !important; }
      .body-text { color: #8b949e !important; }
      .strong-text { color: #e6edf3 !important; }
      .summary-box, .summary-box td { background-color: #161b22 !important; border-color: #30363d !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;" class="email-bg">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;" class="email-bg">
    <tr><td align="center" style="padding:32px 16px 48px;">

      <table class="email-wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- Logo bar -->
        <tr>
          <td style="background-color:#ffffff;padding:24px 40px;border-bottom:1px solid #e2e8f0;" class="email-logo-bar">
            <img src="${LOGO_URL}" alt="Accucare Nurse Staffing" width="160" style="display:block;height:auto;max-height:48px;object-fit:contain;" />
          </td>
        </tr>

        <!-- Header -->
        <tr>
          <td style="background-color:#1B3068;padding:40px 40px 34px;" class="email-header email-pad">
            <p class="header-eyebrow" style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.5);">Accucare Nurse Staffing</p>
            <h1 style="margin:0 0 12px;font-size:26px;font-weight:400;color:#ffffff;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">We received your application, ${firstName}.</h1>
            <p class="header-sub" style="margin:0;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.65;">Our team will review it and be in touch with you soon. If you have any questions, give us a call.</p>
          </td>
        </tr>

        <!-- Red accent bar -->
        <tr><td style="background-color:#CC2229;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#ffffff;padding:36px 40px 0;" class="email-card email-pad">
            <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.75;" class="body-text">Thank you for applying to Accucare. We have received your application and a member of our team will be in touch within one business day.</p>

            <!-- Summary box -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-top:4px solid #CC2229;border-radius:0 0 8px 8px;background-color:#f8fafc;" class="summary-box">
              <tr><td style="padding:22px 24px;background-color:#f8fafc;" class="summary-box">
                <p style="margin:0 0 14px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Your Application</p>
                <p style="margin:0 0 8px;font-size:14px;color:#334155;" class="body-text"><strong style="color:#0f172a;" class="strong-text">Position:</strong> ${role || 'Not specified'}</p>
                <p style="margin:0 0 8px;font-size:14px;color:#334155;" class="body-text"><strong style="color:#0f172a;" class="strong-text">Preferred Start Date:</strong> ${startFormatted}</p>
                <p style="margin:0;font-size:14px;color:#334155;" class="body-text"><strong style="color:#0f172a;" class="strong-text">Submitted:</strong> ${submittedFormatted}</p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background-color:#ffffff;padding:28px 40px 40px;" class="email-card email-pad">
            <p style="margin:0 0 18px;font-size:15px;color:#334155;" class="body-text">If you have questions in the meantime, feel free to give us a call.</p>
            <a href="tel:7137779969" style="display:inline-block;background-color:#CC2229;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 30px;border-radius:6px;">Call (713) 777-9969</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#0e1e44;padding:22px 40px;text-align:center;" class="email-footer">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#ffffff;letter-spacing:0.5px;">Accucare Nurse Staffing</p>
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.45);">9894 Bissonnet St, Suite 430, Houston TX 77036 &nbsp;&bull;&nbsp; (713) 777-9969</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;

  const SENDER = 'careers@accucarestaffing.com';

  const internalMessage = {
    subject: `New Applicant: ${fullName} — ${role || 'Job Application'}`,
    body: { contentType: 'HTML', content: internalHtml },
    from: { emailAddress: { name: 'Accucare Nurse Staffing', address: SENDER } },
    toRecipients: [{ emailAddress: { address: 'careers@accucarestaffing.com' } }],
    replyTo: [{ emailAddress: { address: email || 'careers@accucarestaffing.com' } }]
  };

  if (resume_content && resume_filename) {
    internalMessage.attachments = [{
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: resume_filename,
      contentBytes: resume_content,
      contentType: 'application/octet-stream'
    }];
  }

  try {
    const accessToken = await getAccessToken();

    // Send internal notification
    await sendMail(accessToken, SENDER, internalMessage);

    // Send confirmation to applicant
    if (email) {
      try {
        await sendMail(accessToken, SENDER, {
          subject: 'We received your application — Accucare Nurse Staffing',
          body: { contentType: 'HTML', content: confirmHtml },
          from: { emailAddress: { name: 'Accucare Nurse Staffing', address: SENDER } },
          toRecipients: [{ emailAddress: { address: email } }]
        });
      } catch (err) {
        console.error('Confirm email error:', err.message);
      }
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    console.error('Function error:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
