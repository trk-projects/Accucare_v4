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
    if (!val) return 'N/A';
    return val === 'Yes'
      ? '<span style="color:#16a34a;font-weight:700;">Yes</span>'
      : '<span style="color:#dc2626;font-weight:700;">No</span>';
  }

  /* ── Internal notification to Accucare ── */
  const internalHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
    <tr><td style="padding:32px 24px 0;">

      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0e4d4c;border-radius:10px 10px 0 0;">
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);">Accucare Nurse Staffing</p>
            <h1 style="margin:0 0 6px;font-size:28px;font-weight:700;color:#ffffff;line-height:1.2;">New Job Applicant</h1>
            <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6);">Submitted ${submittedFormatted}</p>
          </td>
          <td style="padding:36px 40px 28px;text-align:right;vertical-align:top;">
            <span style="display:inline-block;background:#0E7C7B;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:7px 18px;border-radius:50px;">${role || 'Not specified'}</span>
          </td>
        </tr>
      </table>

      <!-- Divider bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0E7C7B;">
        <tr><td style="height:4px;"></td></tr>
      </table>

      <!-- Body -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
        <tr><td style="padding:36px 40px 0;">
          <p style="margin:0 0 20px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Contact Details</p>
        </td></tr>

        <!-- Row 1: Name + Role -->
        <tr>
          <td width="50%" style="padding:0 0 0 40px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:8px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;">Full Name</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;">${fullName}</p>
              </td></tr>
            </table>
          </td>
          <td width="50%" style="padding:0 40px 0 12px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:8px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;">Position Applied For</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;">${role || 'N/A'}</p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Row 2: Email + Phone -->
        <tr>
          <td width="50%" style="padding:0 0 0 40px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:8px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;">Email</p>
                <p style="margin:0;font-size:15px;"><a href="mailto:${email}" style="color:#0E7C7B;font-weight:600;text-decoration:none;">${email || 'N/A'}</a></p>
              </td></tr>
            </table>
          </td>
          <td width="50%" style="padding:0 40px 0 12px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:8px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;">Phone</p>
                <p style="margin:0;font-size:15px;"><a href="tel:${phone}" style="color:#0E7C7B;font-weight:600;text-decoration:none;">${phone || 'N/A'}</a></p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Row 3: Experience + Start Date -->
        <tr>
          <td width="50%" style="padding:0 0 0 40px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:8px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;">Years of Experience</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;">${experience || 'N/A'}</p>
              </td></tr>
            </table>
          </td>
          <td width="50%" style="padding:0 40px 0 12px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:8px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;">Preferred Start Date</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;">${startFormatted}</p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Eligibility Questions -->
        <tr><td colspan="2" style="padding:8px 40px 0;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Eligibility</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:8px;margin-bottom:12px;">
            <tr>
              <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;width:75%;">Has required license/certification for the position</td>
              <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;text-align:center;">${yesNo(licensed)}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">Willing to undergo a background check</td>
              <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;text-align:center;">${yesNo(bgcheck)}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">Willing to take a drug test</td>
              <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;text-align:center;">${yesNo(drugtest)}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">Legally authorized to work in the United States</td>
              <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;text-align:center;">${yesNo(workauth)}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;font-size:13px;color:#334155;">Will require visa sponsorship (now or in the future)</td>
              <td style="padding:12px 20px;text-align:center;">${yesNo(sponsorship)}</td>
            </tr>
          </table>
        </td></tr>

        ${resume_filename ? `
        <!-- Resume -->
        <tr><td colspan="2" style="padding:8px 40px 0;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Resume</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf9;border-left:4px solid #0E7C7B;border-radius:0 8px 8px 0;margin-bottom:12px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0;font-size:14px;color:#334155;">Resume file: <strong>${resume_filename}</strong> — attached below, scroll down to view it.</p>
            </td></tr>
          </table>
        </td></tr>
        ` : ''}

        <!-- Action buttons -->
        <tr><td colspan="2" style="padding:28px 40px 40px;text-align:center;">
          <a href="mailto:${email}?subject=Re: Your Application at Accucare Nurse Staffing" style="display:inline-block;background:#0e4d4c;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;margin:4px;">Reply to ${firstname || 'Applicant'}</a>
          <a href="tel:${phone}" style="display:inline-block;background:#ffffff;color:#0e4d4c;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;margin:4px;border:2px solid #0e4d4c;">Call ${firstname || 'Applicant'}</a>
        </td></tr>
      </table>

      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 10px 10px;">
        <tr><td style="padding:16px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Sent by TRK Agency on behalf of Accucare &nbsp;&bull;&nbsp; <a href="${source_page || 'https://accucarenursestaffing.com'}" style="color:#94a3b8;text-decoration:underline;">View source page</a></p>
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
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
    <tr><td style="padding:32px 24px 0;">

      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0e4d4c;border-radius:10px 10px 0 0;">
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);">Accucare Nurse Staffing</p>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.2;">We got your application, ${firstName}.</h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;">Our team will review it and reach out to you soon. If you have any questions, give us a call.</p>
        </td></tr>
      </table>

      <!-- Accent bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0E7C7B;">
        <tr><td style="height:4px;"></td></tr>
      </table>

      <!-- Body -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
        <tr><td style="padding:36px 40px;">

          <p style="margin:0 0 24px;font-size:16px;color:#334155;line-height:1.7;">Thanks for applying at Accucare. We received your application and someone from our team will follow up with you within one business day. We look forward to connecting with you.</p>

          <!-- Summary box -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:8px;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Your Application</p>
              <p style="margin:0 0 6px;font-size:14px;color:#64748b;"><strong style="color:#0f172a;">Position:</strong> ${role || 'Not specified'}</p>
              <p style="margin:0 0 6px;font-size:14px;color:#64748b;"><strong style="color:#0f172a;">Preferred Start Date:</strong> ${startFormatted}</p>
              <p style="margin:0;font-size:14px;color:#64748b;"><strong style="color:#0f172a;">Submitted:</strong> ${submittedFormatted}</p>
            </td></tr>
          </table>

          <!-- Call to action -->
          <p style="margin:0 0 16px;font-size:15px;color:#334155;">Have a question in the meantime?</p>
          <a href="tel:7137779969" style="display:inline-block;background:#0e4d4c;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">Call (713) 777-9969</a>

        </td></tr>
      </table>

      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 10px 10px;">
        <tr><td style="padding:20px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a;">Accucare Nurse Staffing</p>
          <p style="margin:0;font-size:12px;color:#94a3b8;">9894 Bissonnet St, Suite 430, Houston TX 77036 &nbsp;&bull;&nbsp; (713) 777-9969</p>
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

    // Send confirmation to applicant (fire-and-forget, best effort)
    if (email) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: resendHeaders,
        body: JSON.stringify({
          from:    'Accucare Nurse Staffing <donotreply@trkaiagency.com>',
          to:      [email],
          subject: 'We received your application — Accucare Nurse Staffing',
          html:    confirmHtml
        })
      }).catch(err => console.error('Confirm email error:', err.message));
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, id: data.id }) };

  } catch (err) {
    console.error('Function error:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
