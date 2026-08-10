import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emailService } from './email.service';

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('sends contact notification successfully via Web3Forms', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const contactData = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Bug Report',
      message: 'This is a test bug report.'
    };

    const result = await emailService.sendContactNotification(contactData);

    expect(global.fetch).toHaveBeenCalledWith('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_key: '127a9009-05ce-4079-90b0-d5c5c3666247',
        name: contactData.name,
        email: contactData.email,
        subject: `[SiteProof Contact] ${contactData.subject}`,
        message: contactData.message,
        from_name: 'SiteProof App'
      })
    });
    
    expect(result).toEqual({ success: true, method: 'web3forms' });
  });

  it('returns failure if Web3Forms fetch returns not ok', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'API Error'
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await emailService.sendContactNotification({
      name: 'Test',
      email: 'test@test.com',
      subject: 'Test',
      message: 'Test'
    });

    expect(result).toEqual({ success: false, method: 'web3forms' });
    expect(consoleSpy).toHaveBeenCalledWith(
      '[EmailService] Web3Forms dispatch error:',
      'API Error'
    );
    
    consoleSpy.mockRestore();
  });

  it('returns failure and error message on network exception', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network disconnected'));

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await emailService.sendContactNotification({
      name: 'Test',
      email: 'test@test.com',
      subject: 'Test',
      message: 'Test'
    });

    expect(result).toEqual({ success: false, error: 'Network disconnected' });
    expect(consoleSpy).toHaveBeenCalledWith(
      '[EmailService] Web3Forms dispatch exception:',
      'Network disconnected'
    );
    
    consoleSpy.mockRestore();
  });
});
