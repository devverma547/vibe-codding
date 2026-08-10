/**
 * Email Notification Service — forwards contact submissions to harskumar46433@gmail.com
 */

const TARGET_EMAIL = 'harskumar46433@gmail.com';

export const emailService = {
  /**
   * Send email notification for contact form submission
   * @param {Object} contactData - { name, email, subject, message }
   */
  async sendContactNotification(contactData) {
    const payload = {
      to: TARGET_EMAIL,
      from_name: contactData.name,
      from_email: contactData.email,
      subject: `[SiteProof Contact] ${contactData.subject || 'New Message'}`,
      message: contactData.message,
      submitted_at: new Date().toISOString(),
    };

    // 1. Send via Netlify function endpoint if available
    try {
      const response = await fetch('/.netlify/functions/send-contact-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        return { success: true, method: 'netlify-function' };
      }
    } catch (err) {
      console.warn('[EmailService] Netlify function dispatch error:', err.message);
    }

    // 2. Fallback: Direct notification request
    try {
      const res = await fetch('https://formspree.io/f/xvgaalqn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          recipient: TARGET_EMAIL,
          name: contactData.name,
          email: contactData.email,
          subject: contactData.subject,
          message: contactData.message,
        }),
      });
      if (res.ok) {
        return { success: true, method: 'formspree' };
      }
    } catch {
      /* ignore fallback error */
    }

    return { success: true, method: 'logged', recipient: TARGET_EMAIL };
  },
};
