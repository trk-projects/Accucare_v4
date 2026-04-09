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

  if (!process.env.RESEND_API_KEY) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'RESEND_API_KEY not configured.' }) };
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

  function yesNo(val) {
    if (!val) return '<span style="color:#94a3b8;">N/A</span>';
    return val === 'Yes'
      ? '<span style="color:#2E7D5E;font-weight:700;">Yes</span>'
      : '<span style="color:#CC2229;font-weight:700;">No</span>';
  }

  /* ── Internal notification to Accucare ── */
  const internalHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#EEF2F8;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF2F8;">
    <tr><td style="padding:32px 0 0;">

      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#1B3068 0%,#0e1e44 100%);">
        <tr>
          <td style="padding:40px 48px 32px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);">Accucare Nurse Staffing</p>
            <h1 style="margin:0 0 6px;font-size:30px;font-weight:400;color:#ffffff;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">New Job Applicant</h1>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);">Received ${submittedFormatted}</p>
          </td>
          <td style="padding:40px 48px 32px;text-align:right;vertical-align:middle;">
            <span style="display:inline-block;background:#CC2229;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:6px 16px;border-radius:6px;">${role || 'Not specified'}</span>
          </td>
        </tr>
      </table>

      <!-- Red accent bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#CC2229;">
        <tr><td style="height:4px;"></td></tr>
      </table>

      <!-- Body -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
        <tr><td style="padding:40px 48px 0;">
          <p style="margin:0 0 24px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Applicant Details</p>
        </td></tr>

        <!-- Row 1: Name + Role -->
        <tr>
          <td width="50%" style="padding:0 0 0 48px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8EF;border-radius:6px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 5px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Full Name</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#1A1A2E;">${fullName}</p>
              </td></tr>
            </table>
          </td>
          <td width="50%" style="padding:0 48px 0 12px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8EF;border-radius:6px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 5px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Position Applied For</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#1A1A2E;">${role || 'N/A'}</p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Row 2: Email + Phone -->
        <tr>
          <td width="50%" style="padding:0 0 0 48px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8EF;border-radius:6px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 5px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Email</p>
                <p style="margin:0;font-size:15px;"><a href="mailto:${email}" style="color:#1B3068;font-weight:600;text-decoration:none;">${email || 'N/A'}</a></p>
              </td></tr>
            </table>
          </td>
          <td width="50%" style="padding:0 48px 0 12px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8EF;border-radius:6px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 5px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Phone</p>
                <p style="margin:0;font-size:15px;"><a href="tel:${phone}" style="color:#1B3068;font-weight:600;text-decoration:none;">${phone || 'N/A'}</a></p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Row 3: Experience + Start Date -->
        <tr>
          <td width="50%" style="padding:0 0 0 48px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8EF;border-radius:6px;margin-bottom:20px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 5px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Years of Experience</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#1A1A2E;">${experience || 'N/A'}</p>
              </td></tr>
            </table>
          </td>
          <td width="50%" style="padding:0 48px 0 12px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8EF;border-radius:6px;margin-bottom:20px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 5px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Preferred Start Date</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#1A1A2E;">${startFormatted}</p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Eligibility Questions -->
        <tr><td colspan="2" style="padding:0 48px 0;">
          <p style="margin:0 0 14px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Eligibility</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8EF;border-radius:6px;margin-bottom:20px;">
            <tr style="border-bottom:1px solid #E2E8EF;">
              <td style="padding:13px 20px;font-size:13px;color:#475569;border-bottom:1px solid #E2E8EF;width:78%;">Has required license/certification for the position</td>
              <td style="padding:13px 20px;font-size:14px;border-bottom:1px solid #E2E8EF;text-align:center;">${yesNo(licensed)}</td>
            </tr>
            <tr>
              <td style="padding:13px 20px;font-size:13px;color:#475569;border-bottom:1px solid #E2E8EF;">Willing to undergo a background check</td>
              <td style="padding:13px 20px;font-size:14px;border-bottom:1px solid #E2E8EF;text-align:center;">${yesNo(bgcheck)}</td>
            </tr>
            <tr>
              <td style="padding:13px 20px;font-size:13px;color:#475569;border-bottom:1px solid #E2E8EF;">Willing to take a drug test</td>
              <td style="padding:13px 20px;font-size:14px;border-bottom:1px solid #E2E8EF;text-align:center;">${yesNo(drugtest)}</td>
            </tr>
            <tr>
              <td style="padding:13px 20px;font-size:13px;color:#475569;border-bottom:1px solid #E2E8EF;">Legally authorized to work in the United States</td>
              <td style="padding:13px 20px;font-size:14px;border-bottom:1px solid #E2E8EF;text-align:center;">${yesNo(workauth)}</td>
            </tr>
            <tr>
              <td style="padding:13px 20px;font-size:13px;color:#475569;">Will require visa sponsorship (now or in the future)</td>
              <td style="padding:13px 20px;font-size:14px;text-align:center;">${yesNo(sponsorship)}</td>
            </tr>
          </table>
        </td></tr>

        ${resume_filename ? `
        <!-- Resume -->
        <tr><td colspan="2" style="padding:0 48px 0;">
          <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Resume</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8EF;border-left:4px solid #CC2229;border-radius:0 6px 6px 0;margin-bottom:20px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0;font-size:14px;color:#475569;">File: <strong style="color:#1A1A2E;">${resume_filename}</strong> — attached below, scroll down to view.</p>
            </td></tr>
          </table>
        </td></tr>
        ` : ''}

        <!-- Action buttons -->
        <tr><td colspan="2" style="padding:32px 48px 44px;text-align:center;">
          <a href="mailto:${email}?subject=Re: Your Application at Accucare Nurse Staffing" style="display:inline-block;background:#CC2229;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 30px;border-radius:6px;margin:4px;">Reply to ${firstname || 'Applicant'}</a>
          <a href="tel:${phone}" style="display:inline-block;background:#ffffff;color:#1B3068;font-size:14px;font-weight:600;text-decoration:none;padding:12px 30px;border-radius:6px;margin:4px;border:2px solid #1B3068;">Call ${firstname || 'Applicant'}</a>
        </td></tr>
      </table>

      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0e1e44;">
        <tr><td style="padding:20px 48px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#ffffff;font-family:Georgia,'Times New Roman',serif;">Accucare Nurse Staffing</p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.45);">Sent by TRK Agency &nbsp;&bull;&nbsp; <a href="${source_page || 'https://accucarenursestaffing.com'}" style="color:rgba(255,255,255,0.45);text-decoration:underline;">View source page</a></p>
        </td></tr>
      </table>

    </td></tr>
    <tr><td style="height:32px;"></td></tr>
  </table>

</body>
</html>`;

  /* ── Confirmation email to the applicant ── */
  const confirmHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#EEF2F8;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF2F8;">
    <tr><td style="padding:32px 0 0;">

      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#1B3068 0%,#0e1e44 100%);">
        <tr><td style="padding:44px 48px 36px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);">Accucare Nurse Staffing</p>
          <h1 style="margin:0 0 10px;font-size:28px;font-weight:400;color:#ffffff;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">We received your application, ${firstName}.</h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;">Our team will review it and be in touch with you soon. If you have questions, give us a call.</p>
        </td></tr>
      </table>

      <!-- Red accent bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#CC2229;">
        <tr><td style="height:4px;"></td></tr>
      </table>

      <!-- Body -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
        <tr><td style="padding:40px 48px;">

          <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.75;">Thank you for applying to Accucare. We have received your application and a member of our team will be in touch within one business day.</p>

          <!-- Summary box -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8EF;border-top:4px solid #CC2229;border-radius:0 0 6px 6px;margin-bottom:32px;">
            <tr><td style="padding:22px 24px;">
              <p style="margin:0 0 14px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Your Application</p>
              <p style="margin:0 0 8px;font-size:14px;color:#475569;"><strong style="color:#1A1A2E;">Position:</strong> ${role || 'Not specified'}</p>
              <p style="margin:0 0 8px;font-size:14px;color:#475569;"><strong style="color:#1A1A2E;">Preferred Start Date:</strong> ${startFormatted}</p>
              <p style="margin:0;font-size:14px;color:#475569;"><strong style="color:#1A1A2E;">Submitted:</strong> ${submittedFormatted}</p>
            </td></tr>
          </table>

          <p style="margin:0 0 18px;font-size:15px;color:#475569;">If you have questions in the meantime, feel free to give us a call.</p>
          <a href="tel:7137779969" style="display:inline-block;background:#CC2229;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:6px;">Call (713) 777-9969</a>

        </td></tr>
      </table>

      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0e1e44;">
        <tr><td style="padding:24px 48px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#ffffff;font-family:Georgia,'Times New Roman',serif;">Accucare Nurse Staffing</p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.45);">9894 Bissonnet St, Suite 430, Houston TX 77036 &nbsp;&bull;&nbsp; (713) 777-9969</p>
        </td></tr>
      </table>

    </td></tr>
    <tr><td style="height:32px;"></td></tr>
  </table>

</body>
</html>`;

  const resendHeaders = {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json'
  };

  const emailPayload = {
    from:     'TRK Team <donotreply@trkaiagency.com>',
    reply_to: email || 'tanush@trkaiagency.com',
    to:       ['tanush@trkaiagency.com'],
    subject:  `New Applicant: ${fullName} — ${role || 'Job Application'}`,
    html:     internalHtml
  };

  if (resume_content && resume_filename) {
    emailPayload.attachments = [{ filename: resume_filename, content: resume_content }];
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: resendHeaders,
      body: JSON.stringify(emailPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', data);
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to send email.', detail: data }) };
    }

    // Send confirmation to applicant
    if (email) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: resendHeaders,
          body: JSON.stringify({
            from:    'Accucare Nurse Staffing <donotreply@trkaiagency.com>',
            to:      [email],
            subject: 'We received your application — Accucare Nurse Staffing',
            html:    confirmHtml
          })
        });
      } catch (err) {
        console.error('Confirm email error:', err.message);
      }
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, id: data.id }) };

  } catch (err) {
    console.error('Function error:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
