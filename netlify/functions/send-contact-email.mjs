/**
 * Netlify Serverless Function: /.netlify/functions/send-contact-email
 *
 * Forwards contact form submissions to harskumar46433@gmail.com
 */

const TARGET_EMAIL = 'harskumar46433@gmail.com';

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { from_name, from_email, subject, message } = payload;

    console.log(`[Contact Email Notification] Sending message to ${TARGET_EMAIL}`);
    console.log(`From: ${from_name} <${from_email}> | Subject: ${subject}`);
    console.log(`Message: ${message}`);

    // If RESEND_API_KEY environment variable is configured in Netlify, send via Resend API
    if (process.env.RESEND_API_KEY) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SiteProof Contact <onboarding@resend.dev>',
          to: [TARGET_EMAIL],
          reply_to: from_email,
          subject: `[SiteProof Bug/Contact] ${subject || 'New Submission'}`,
          html: `
            <h3>New Contact Form Submission</h3>
            <p><strong>Name:</strong> ${from_name}</p>
            <p><strong>Email:</strong> ${from_email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background: #f4f4f4; padding: 10px; border-left: 3px solid #00F5A0;">
              ${(message || '').replace(/\n/g, '<br/>')}
            </blockquote>
          `,
        }),
      });

      if (!resendRes.ok) {
        const errText = await resendRes.text();
        console.warn('[Contact Email Notification] Resend API error:', errText);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        recipient: TARGET_EMAIL,
        message: 'Notification processed successfully',
      }),
    };
  } catch (err) {
    console.error('[Contact Email Notification] Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: err.message }),
    };
  }
};
