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
  const firstName = name ? name.split(' ')[0] : 'there';

  const submittedFormatted = submitted_at
    ? new Date(submitted_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    : 'N/A';

  /* ── Internal notification to Accucare ── */
  const internalHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
    <tr><td style="padding:32px 24px 0;">

      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f2744;border-radius:10px 10px 0 0;">
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);">Accucare Nurse Staffing</p>
            <h1 style="margin:0 0 6px;font-size:28px;font-weight:700;color:#ffffff;line-height:1.2;">New Staffing Request</h1>
            <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6);">Submitted ${submittedFormatted}</p>
          </td>
          <td style="padding:36px 40px 28px;text-align:right;vertical-align:top;">
            <span style="display:inline-block;background:#1d6fb8;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:7px 18px;border-radius:50px;">${service || 'Not specified'}</span>
          </td>
        </tr>
      </table>

      <!-- Divider bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1d6fb8;">
        <tr><td style="height:4px;"></td></tr>
      </table>

      <!-- Body -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
        <tr><td style="padding:36px 40px 0;">
          <p style="margin:0 0 20px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Contact Details</p>
        </td></tr>

        <!-- Row 1: Name + Location -->
        <tr>
          <td width="50%" style="padding:0 0 0 40px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:8px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;">Name</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;">${name || 'N/A'}</p>
              </td></tr>
            </table>
          </td>
          <td width="50%" style="padding:0 40px 0 12px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:8px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;">${facilityLabel}</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;">${facility || 'N/A'}</p>
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
                <p style="margin:0;font-size:15px;"><a href="mailto:${email}" style="color:#1d6fb8;font-weight:600;text-decoration:none;">${email || 'N/A'}</a></p>
              </td></tr>
            </table>
          </td>
          <td width="50%" style="padding:0 40px 0 12px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:8px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;">Phone</p>
                <p style="margin:0;font-size:15px;"><a href="tel:${phone}" style="color:#1d6fb8;font-weight:600;text-decoration:none;">${phone || 'N/A'}</a></p>
              </td></tr>
            </table>
          </td>
        </tr>

        ${message ? `
        <!-- Message -->
        <tr><td colspan="2" style="padding:8px 40px 0;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Message</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-left:4px solid #1d6fb8;border-radius:0 8px 8px 0;margin-bottom:12px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0;font-size:15px;color:#334155;line-height:1.7;">${message}</p>
            </td></tr>
          </table>
        </td></tr>
        ` : ''}

        <!-- Action buttons -->
        <tr><td colspan="2" style="padding:28px 40px 40px;text-align:center;">
          <a href="mailto:${email}?subject=Re: Your Staffing Request" style="display:inline-block;background:#0f2744;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;margin:4px;">Reply to ${firstName}</a>
          <a href="tel:${phone}" style="display:inline-block;background:#ffffff;color:#0f2744;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;margin:4px;border:2px solid #0f2744;">Call ${firstName}</a>
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

  /* ── Confirmation email to the lead ── */
  const confirmHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
    <tr><td style="padding:32px 24px 0;">

      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f2744;border-radius:10px 10px 0 0;">
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);">Accucare Nurse Staffing</p>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.2;">We got your request, ${firstName}.</h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;">Our team will follow up with you shortly. If your need is urgent, give us a call right now.</p>
        </td></tr>
      </table>

      <!-- Accent bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1d6fb8;">
        <tr><td style="height:4px;"></td></tr>
      </table>

      <!-- Body -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
        <tr><td style="padding:36px 40px;">

          <p style="margin:0 0 24px;font-size:16px;color:#334155;line-height:1.7;">Thanks for reaching out. We received your staffing request and someone from our team will be in touch within one business hour during regular hours. For after-hours needs, we're available around the clock.</p>

          <!-- Summary box -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:8px;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Your Request</p>
              <p style="margin:0 0 6px;font-size:14px;color:#64748b;"><strong style="color:#0f172a;">Service:</strong> ${service || 'Not specified'}</p>
              <p style="margin:0 0 6px;font-size:14px;color:#64748b;"><strong style="color:#0f172a;">${facilityLabel}:</strong> ${facility || 'N/A'}</p>
              <p style="margin:0;font-size:14px;color:#64748b;"><strong style="color:#0f172a;">Submitted:</strong> ${submittedFormatted}</p>
            </td></tr>
          </table>

          <!-- Call to action -->
          <p style="margin:0 0 16px;font-size:15px;color:#334155;">Need to talk to someone right now?</p>
          <a href="tel:7137779969" style="display:inline-block;background:#0f2744;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">Call (713) 777-9969</a>

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

  try {
    // Send internal notification
    const notifyRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: resendHeaders,
      body: JSON.stringify({
        from:     'TRK Team <donotreply@trkaiagency.com>',
        reply_to: email || 'tanush@trkaiagency.com',
        to:       ['tanush@trkaiagency.com'],
        subject:  `New Lead: ${name || 'Unknown'} — ${service || 'Staffing Request'}`,
        html:     internalHtml
      })
    });

    const notifyData = await notifyRes.json();
    if (!notifyRes.ok) {
      console.error('Resend error (notify):', notifyData);
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to send notification email.', detail: notifyData }) };
    }

    // Send confirmation to lead
    if (email) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: resendHeaders,
          body: JSON.stringify({
            from:    'Accucare Nurse Staffing <donotreply@trkaiagency.com>',
            to:      [email],
            subject: 'We received your request — Accucare Nurse Staffing',
            html:    confirmHtml
          })
        });
      } catch (err) {
        console.error('Confirm email error:', err.message);
      }
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, id: notifyData.id }) };

  } catch (err) {
    console.error('Function error:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
