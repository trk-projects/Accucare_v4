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

  const { name, care_type, facility, email, phone, service, message, submitted_at, source_page } = JSON.parse(event.body || '{}');
  const facilityLabel = care_type === 'home' ? 'Home Address' : 'Facility / Organization';

  const submittedFormatted = submitted_at
    ? new Date(submitted_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    : '—';

  const html = `
  <div style="background:#f0f2f5;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:580px;margin:0 auto;">

      <div style="background:linear-gradient(135deg,#1B4F72 0%,#2E86C1 100%);border-radius:12px 12px 0 0;padding:32px 36px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:1.5px;color:rgba(255,255,255,0.6);text-transform:uppercase;">Accucare Nurse Staffing</p>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;">New Lead Received</h1>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);">A staffing request was just submitted through the website.</p>
      </div>

      <div style="background:#1a3a52;padding:14px 36px;">
        <span style="display:inline-block;background:#2E86C1;color:#fff;font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;padding:5px 14px;border-radius:20px;">${service || 'Not specified'}</span>
        <span style="margin-left:14px;font-size:12px;color:rgba(255,255,255,0.5);">${submittedFormatted}</span>
      </div>

      <div style="background:#ffffff;padding:36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">

        <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:1.2px;color:#94a3b8;text-transform:uppercase;">Contact Information</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
          <tr>
            <td style="padding:12px 16px;background:#f8fafc;border-radius:8px 8px 0 0;border-bottom:1px solid #e2e8f0;width:50%;">
              <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Name</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1e293b;">${name || '—'}</p>
            </td>
            <td style="padding:12px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;border-left:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">${facilityLabel}</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1e293b;">${facility || '—'}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px;background:#fff;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Email</p>
              <p style="margin:4px 0 0;font-size:15px;"><a href="mailto:${email}" style="color:#2E86C1;text-decoration:none;font-weight:500;">${email || '—'}</a></p>
            </td>
            <td style="padding:12px 16px;background:#fff;border-bottom:1px solid #e2e8f0;border-left:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Phone</p>
              <p style="margin:4px 0 0;font-size:15px;"><a href="tel:${phone}" style="color:#2E86C1;text-decoration:none;font-weight:500;">${phone || '—'}</a></p>
            </td>
          </tr>
        </table>

        ${message ? `
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:1.2px;color:#94a3b8;text-transform:uppercase;">Message</p>
        <div style="background:#f8fafc;border-left:3px solid #2E86C1;border-radius:0 6px 6px 0;padding:14px 18px;margin-bottom:28px;">
          <p style="margin:0;font-size:14px;color:#334155;line-height:1.6;">${message}</p>
        </div>
        ` : ''}

        <div style="text-align:center;margin-top:8px;">
          <a href="mailto:${email}?subject=Re: Your Staffing Request at ${facility}" style="display:inline-block;background:linear-gradient(135deg,#1B4F72,#2E86C1);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;letter-spacing:0.5px;margin:4px;">Reply to ${name ? name.split(' ')[0] : 'Lead'}</a>
          <a href="tel:${phone}" style="display:inline-block;background:#ffffff;color:#1B4F72;font-size:14px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;letter-spacing:0.5px;margin:4px;border:2px solid #1B4F72;">Call ${name ? name.split(' ')[0] : 'Lead'}</a>
        </div>

      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:18px 36px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#94a3b8;">Sent by TRK Agency on behalf of Accucare &nbsp;|&nbsp; <a href="${source_page || '#'}" style="color:#94a3b8;">View Source Page</a></p>
      </div>

    </div>
  </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from:     'TRK Team <donotreply@trkaiagency.com>',
        reply_to: 'tanush@trkaiagency.com',
        to:       ['tanush@trkaiagency.com'],
        subject:  'New Lead! ✨',
        html
      })
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
