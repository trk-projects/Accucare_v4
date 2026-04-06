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

  const html = `
  <div style="background:#f0f2f5;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;">

      <div style="background:linear-gradient(135deg,#0E7C7B 0%,#14a89f 100%);border-radius:12px 12px 0 0;padding:32px 36px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:1.5px;color:rgba(255,255,255,0.6);text-transform:uppercase;">Accucare Nurse Staffing</p>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;">New Job Applicant!</h1>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);">A new career application was just submitted through the website.</p>
      </div>

      <div style="background:#0a5a59;padding:14px 36px;">
        <span style="display:inline-block;background:#0E7C7B;color:#fff;font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;padding:5px 14px;border-radius:20px;">${role || 'Not specified'}</span>
        <span style="margin-left:14px;font-size:12px;color:rgba(255,255,255,0.5);">${submittedFormatted}</span>
      </div>

      <div style="background:#ffffff;padding:36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">

        <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:1.2px;color:#94a3b8;text-transform:uppercase;">Contact Information</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
          <tr>
            <td style="padding:12px 16px;background:#f8fafc;border-radius:8px 8px 0 0;border-bottom:1px solid #e2e8f0;width:50%;">
              <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Full Name</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1e293b;">${fullName}</p>
            </td>
            <td style="padding:12px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;border-left:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Position Applied For</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1e293b;">${role || 'N/A'}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px;background:#fff;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Email</p>
              <p style="margin:4px 0 0;font-size:15px;"><a href="mailto:${email}" style="color:#0E7C7B;text-decoration:none;font-weight:500;">${email || 'N/A'}</a></p>
            </td>
            <td style="padding:12px 16px;background:#fff;border-bottom:1px solid #e2e8f0;border-left:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Phone</p>
              <p style="margin:4px 0 0;font-size:15px;"><a href="tel:${phone}" style="color:#0E7C7B;text-decoration:none;font-weight:500;">${phone || 'N/A'}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Years of Experience</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1e293b;">${experience || 'N/A'}</p>
            </td>
            <td style="padding:12px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;border-left:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Preferred Start Date</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1e293b;">${startFormatted}</p>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:1.2px;color:#94a3b8;text-transform:uppercase;">Eligibility Questions</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
          <tr>
            <td style="padding:11px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;width:75%;">
              <p style="margin:0;font-size:13px;color:#334155;">Has required license/certification for the position</p>
            </td>
            <td style="padding:11px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;border-left:1px solid #e2e8f0;text-align:center;">${yesNo(licensed)}</td>
          </tr>
          <tr>
            <td style="padding:11px 16px;background:#fff;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:13px;color:#334155;">Willing to undergo a background check</p>
            </td>
            <td style="padding:11px 16px;background:#fff;border-bottom:1px solid #e2e8f0;border-left:1px solid #e2e8f0;text-align:center;">${yesNo(bgcheck)}</td>
          </tr>
          <tr>
            <td style="padding:11px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:13px;color:#334155;">Willing to take a drug test</p>
            </td>
            <td style="padding:11px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;border-left:1px solid #e2e8f0;text-align:center;">${yesNo(drugtest)}</td>
          </tr>
          <tr>
            <td style="padding:11px 16px;background:#fff;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:13px;color:#334155;">Legally authorized to work in the United States</p>
            </td>
            <td style="padding:11px 16px;background:#fff;border-bottom:1px solid #e2e8f0;border-left:1px solid #e2e8f0;text-align:center;">${yesNo(workauth)}</td>
          </tr>
          <tr>
            <td style="padding:11px 16px;background:#f8fafc;border-radius:0 0 0 8px;">
              <p style="margin:0;font-size:13px;color:#334155;">Will require visa sponsorship (now or in the future)</p>
            </td>
            <td style="padding:11px 16px;background:#f8fafc;border-left:1px solid #e2e8f0;border-radius:0 0 8px 0;text-align:center;">${yesNo(sponsorship)}</td>
          </tr>
        </table>

        ${resume_filename ? `
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:1.2px;color:#94a3b8;text-transform:uppercase;">Resume</p>
        <div style="background:#f0fdf9;border-left:3px solid #0E7C7B;border-radius:0 6px 6px 0;padding:14px 18px;margin-bottom:28px;">
          <p style="margin:0;font-size:14px;color:#334155;">📎 ${resume_filename} (attached - scroll down to view it)</p>
        </div>
        ` : ''}

        <div style="text-align:center;margin-top:8px;">
          <a href="mailto:${email}?subject=Re: Your Application at Accucare Nurse Staffing" style="display:inline-block;background:linear-gradient(135deg,#0E7C7B,#14a89f);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;letter-spacing:0.5px;margin:4px;">Reply to ${firstname || 'Applicant'}</a>
          <a href="tel:${phone}" style="display:inline-block;background:#ffffff;color:#0E7C7B;font-size:14px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;letter-spacing:0.5px;margin:4px;border:2px solid #0E7C7B;">Call ${firstname || 'Applicant'}</a>
        </div>

      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:18px 36px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#94a3b8;">Sent by TRK Agency on behalf of Accucare &nbsp;|&nbsp; <a href="${source_page || '#'}" style="color:#94a3b8;">View Source Page</a></p>
      </div>

    </div>
  </div>
  `;

  const emailPayload = {
    from:     'TRK Team <donotreply@trkaiagency.com>',
    reply_to: 'tanush@trkaiagency.com',
    to:       ['tanush@trkaiagency.com'],
    subject:  'New Job Applicant! 🎉',
    html
  };

  if (resume_content && resume_filename) {
    emailPayload.attachments = [{ filename: resume_filename, content: resume_content }];
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', data);
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to send email.', detail: data }) };
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, id: data.id }) };

  } catch (err) {
    console.error('Function error:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
