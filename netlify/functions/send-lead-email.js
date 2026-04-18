'use strict';

exports.handler = async (event) => {
  console.log('[send-lead-email] Function invoked');
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
    console.error('[send-lead-email] Missing env vars — MS_TENANT_ID:', !!MS_TENANT_ID, 'MS_CLIENT_ID:', !!MS_CLIENT_ID, 'MS_CLIENT_SECRET:', !!MS_CLIENT_SECRET);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Microsoft 365 credentials not configured.' }) };
  }
  console.log('[send-lead-email] Env vars present, acquiring token...');

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

  const { name, care_type, facility, email, phone, service, message, submitted_at, source_page } = JSON.parse(event.body || '{}');
  const facilityLabel = care_type === 'home' ? 'Home Address' : 'Facility / Organization';
  const firstName = name ? name.split(' ')[0] : 'there';

  const submittedFormatted = submitted_at
    ? new Date(submitted_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    : 'N/A';

  // Update this URL once the custom domain is connected
  const LOGO_URL = 'https://accucare.netlify.app/brandTheme/accucare-logo-email.png';

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
  <title>New Staffing Request</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; padding: 0; background-color: #f0f4f8 !important; }
    [data-ogsc] body, [data-ogsc] .email-bg { background-color: #f0f4f8 !important; }
    [data-ogsc] .email-card { background-color: #ffffff !important; }
    [data-ogsc] .email-header { background-color: #1B3068 !important; }
    [data-ogsc] .email-footer { background-color: #0e1e44 !important; }
    [data-ogsc] .email-logo-bar { background-color: #ffffff !important; }
    [data-ogsc] .field-row { background-color: #ffffff !important; }
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
      .message-box { background-color: #161b22 !important; }
      .message-box td { background-color: #161b22 !important; }
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
          <td style="background-color:#1B3068;padding:36px 40px 30px;" class="email-header">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;">
                  <p class="header-eyebrow" style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.5);">New Request</p>
                  <h1 style="margin:0;font-size:26px;font-weight:400;color:#ffffff;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">New Staffing Request</h1>
                  <p class="header-meta" style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.55);">${submittedFormatted}</p>
                </td>
                <td style="vertical-align:middle;text-align:right;padding-left:20px;white-space:nowrap;">
                  <span style="display:inline-block;background-color:#CC2229;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:7px 14px;border-radius:20px;">${service || 'Not specified'}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Red accent bar -->
        <tr><td style="background-color:#CC2229;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#ffffff;padding:36px 40px 0;" class="email-card email-pad">
            <p style="margin:0 0 20px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Contact Details</p>
          </td>
        </tr>

        <tr>
          <td style="background-color:#ffffff;padding:0 40px;" class="email-card email-pad">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;" class="field-row">
              ${field('Name', name)}
              ${field(facilityLabel, facility)}
              ${field('Email', email, email ? `mailto:${email}` : null)}
              ${field('Phone', phone, phone ? `tel:${phone}` : null)}
            </table>
          </td>
        </tr>

        ${message ? `
        <tr>
          <td style="background-color:#ffffff;padding:24px 40px 0;" class="email-card email-pad">
            <p style="margin:0 0 12px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Message</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-left:4px solid #CC2229;border-radius:0 8px 8px 0;background-color:#fafafa;" class="message-box">
              <tr><td style="padding:18px 20px;background-color:#fafafa;" class="message-box">
                <p style="margin:0;font-size:15px;color:#334155;line-height:1.75;" class="body-text">${message}</p>
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
                  <a href="mailto:${email}?subject=Re: Your Staffing Request" style="display:inline-block;background-color:#CC2229;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 28px;border-radius:6px;">Reply to ${firstName}</a>
                </td>
                <td style="padding-left:8px;">
                  <a href="tel:${phone}" class="call-btn" style="display:inline-block;background-color:#ffffff;color:#1B3068;font-size:14px;font-weight:600;text-decoration:none;padding:11px 28px;border-radius:6px;border:2px solid #1B3068;">Call ${firstName}</a>
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

  /* ── Confirmation email to the lead ── */
  const confirmHtml = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>We received your request</title>
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
            <h1 style="margin:0 0 12px;font-size:26px;font-weight:400;color:#ffffff;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">We received your request, ${firstName}.</h1>
            <p class="header-sub" style="margin:0;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.65;">Someone from our team will be in touch shortly. For urgent needs, we are available by phone at any hour.</p>
          </td>
        </tr>

        <!-- Red accent bar -->
        <tr><td style="background-color:#CC2229;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#ffffff;padding:36px 40px 0;" class="email-card email-pad">
            <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.75;" class="body-text">Thank you for contacting Accucare. We have received your staffing request and a member of our team will follow up within one business hour during regular hours.</p>

            <!-- Summary box -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-top:4px solid #CC2229;border-radius:0 0 8px 8px;background-color:#f8fafc;" class="summary-box">
              <tr><td style="padding:22px 24px;background-color:#f8fafc;" class="summary-box">
                <p style="margin:0 0 14px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Your Request</p>
                <p style="margin:0 0 8px;font-size:14px;color:#334155;" class="body-text"><strong style="color:#0f172a;" class="strong-text">Service:</strong> ${service || 'Not specified'}</p>
                <p style="margin:0 0 8px;font-size:14px;color:#334155;" class="body-text"><strong style="color:#0f172a;" class="strong-text">${facilityLabel}:</strong> ${facility || 'N/A'}</p>
                <p style="margin:0;font-size:14px;color:#334155;" class="body-text"><strong style="color:#0f172a;" class="strong-text">Submitted:</strong> ${submittedFormatted}</p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background-color:#ffffff;padding:28px 40px 40px;" class="email-card email-pad">
            <p style="margin:0 0 18px;font-size:15px;color:#334155;" class="body-text">Prefer to speak with someone directly?</p>
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

  const SENDER = 'contact@accucarestaffing.com';

  try {
    const accessToken = await getAccessToken();
    console.log('[send-lead-email] Token acquired, sending internal notification...');

    // Send internal notification
    await sendMail(accessToken, SENDER, {
      subject: `New Lead: ${name || 'Unknown'} — ${service || 'Staffing Request'}`,
      body: { contentType: 'HTML', content: internalHtml },
      from: { emailAddress: { name: 'Accucare Nurse Staffing', address: SENDER } },
      toRecipients: [{ emailAddress: { address: 'contact@accucarestaffing.com' } }],
      replyTo: [{ emailAddress: { address: email || 'contact@accucarestaffing.com' } }]
    });

    console.log('[send-lead-email] Internal notification sent OK');

    // Send confirmation to lead
    if (email) {
      try {
        await sendMail(accessToken, SENDER, {
          subject: 'We received your request — Accucare Nurse Staffing',
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
    console.error('[send-lead-email] Function error:', err.message);
    console.error('[send-lead-email] Stack:', err.stack);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
