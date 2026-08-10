/**
 * Email Notification Service — forwards contact submissions via Web3Forms
 */

export const emailService = {
  /**
   * Send email notification for contact form submission
   * @param {Object} contactData - { name, email, subject, message }
   */
  async sendContactNotification(contactData) {
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: '127a9009-05ce-4079-90b0-d5c5c3666247',
          name: contactData.name,
          email: contactData.email,
          Topic: contactData.subject || 'Not specified',
          subject: `[SiteProof Contact] ${contactData.subject || 'New Message'}`,
          message: contactData.message,
          from_name: 'SiteProof App'
        }),
      });

      if (response.ok) {
        return { success: true, method: 'web3forms' };
      } else {
        console.warn('[EmailService] Web3Forms dispatch error:', await response.text());
        return { success: false, method: 'web3forms' };
      }
    } catch (err) {
      console.warn('[EmailService] Web3Forms dispatch exception:', err.message);
      return { success: false, error: err.message };
    }
  },
};

