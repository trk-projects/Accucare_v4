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
<body style="margin:0;padding:0;background:#EEF2F8;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF2F8;">
    <tr><td style="padding:32px 0 0;">

      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#1B3068 0%,#0e1e44 100%);">
        <tr>
          <td style="padding:40px 48px 32px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);">Accucare Nurse Staffing</p>
            <h1 style="margin:0 0 6px;font-size:30px;font-weight:400;color:#ffffff;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">New Staffing Request</h1>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);">Received ${submittedFormatted}</p>
          </td>
          <td style="padding:40px 48px 32px;text-align:right;vertical-align:middle;">
            <span style="display:inline-block;background:#CC2229;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:6px 16px;border-radius:6px;">${service || 'Not specified'}</span>
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
          <p style="margin:0 0 24px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Contact Details</p>
        </td></tr>

        <!-- Row 1: Name + Location -->
        <tr>
          <td width="50%" style="padding:0 0 0 48px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8EF;border-radius:6px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 5px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Name</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#1A1A2E;">${name || 'N/A'}</p>
              </td></tr>
            </table>
          </td>
          <td width="50%" style="padding:0 48px 0 12px;vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8EF;border-radius:6px;margin-bottom:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 5px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">${facilityLabel}</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#1A1A2E;">${facility || 'N/A'}</p>
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

        ${message ? `
        <!-- Message -->
        <tr><td colspan="2" style="padding:8px 48px 0;">
          <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Message</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8EF;border-left:4px solid #CC2229;border-radius:0 6px 6px 0;margin-bottom:12px;">
            <tr><td style="padding:18px 20px;">
              <p style="margin:0;font-size:15px;color:#475569;line-height:1.7;">${message}</p>
            </td></tr>
          </table>
        </td></tr>
        ` : ''}

        <!-- Action buttons -->
        <tr><td colspan="2" style="padding:32px 48px 44px;text-align:center;">
          <a href="mailto:${email}?subject=Re: Your Staffing Request" style="display:inline-block;background:#CC2229;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 30px;border-radius:6px;margin:4px;">Reply to ${firstName}</a>
          <a href="tel:${phone}" style="display:inline-block;background:#ffffff;color:#1B3068;font-size:14px;font-weight:600;text-decoration:none;padding:12px 30px;border-radius:6px;margin:4px;border:2px solid #1B3068;">Call ${firstName}</a>
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

  /* ── Confirmation email to the lead ── */
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
          <h1 style="margin:0 0 10px;font-size:28px;font-weight:400;color:#ffffff;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">We received your request, ${firstName}.</h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;">Someone from our team will be in touch with you shortly. For urgent needs, we are available by phone at any hour.</p>
        </td></tr>
      </table>

      <!-- Red accent bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#CC2229;">
        <tr><td style="height:4px;"></td></tr>
      </table>

      <!-- Body -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
        <tr><td style="padding:40px 48px;">

          <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.75;">Thank you for contacting Accucare. We have received your staffing request and a member of our team will follow up within one business hour during regular hours.</p>

          <!-- Summary box -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8EF;border-top:4px solid #CC2229;border-radius:0 0 6px 6px;margin-bottom:32px;">
            <tr><td style="padding:22px 24px;">
              <p style="margin:0 0 14px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#CC2229;">Your Request</p>
              <p style="margin:0 0 8px;font-size:14px;color:#475569;"><strong style="color:#1A1A2E;">Service:</strong> ${service || 'Not specified'}</p>
              <p style="margin:0 0 8px;font-size:14px;color:#475569;"><strong style="color:#1A1A2E;">${facilityLabel}:</strong> ${facility || 'N/A'}</p>
              <p style="margin:0;font-size:14px;color:#475569;"><strong style="color:#1A1A2E;">Submitted:</strong> ${submittedFormatted}</p>
            </td></tr>
          </table>

          <p style="margin:0 0 18px;font-size:15px;color:#475569;">Prefer to speak with someone directly?</p>
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
