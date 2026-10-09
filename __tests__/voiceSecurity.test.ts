import { describe, it, expect } from 'vitest';

describe('Voice Iframe postMessage Security & Nonce Validation', () => {
  interface VoiceMessage {
    type: 'VOICE_RESULT' | 'VOICE_VOLUME' | 'VOICE_ERROR';
    nonce: string;
    payload?: any;
  }

  function validateIncomingMessage(
    origin: string,
    expectedOrigin: string,
    message: VoiceMessage,
    activeNonce: string
  ): boolean {
    if (origin !== expectedOrigin) return false;
    if (!message || message.nonce !== activeNonce) return false;
    return true;
  }

  it('accepts messages matching expected origin and active session nonce', () => {
    const valid = validateIncomingMessage(
      'chrome-extension://abcdefghijklmnop',
      'chrome-extension://abcdefghijklmnop',
      { type: 'VOICE_RESULT', nonce: 'nonce-12345', payload: 'Buy milk' },
      'nonce-12345'
    );
    expect(valid).toBe(true);
  });

  it('rejects messages from untrusted host origins', () => {
    const invalid = validateIncomingMessage(
      'https://malicious-site.com',
      'chrome-extension://abcdefghijklmnop',
      { type: 'VOICE_RESULT', nonce: 'nonce-12345', payload: 'Hacked task' },
      'nonce-12345'
    );
    expect(invalid).toBe(false);
  });

  it('rejects messages with forged or stale nonces', () => {
    const invalid = validateIncomingMessage(
      'chrome-extension://abcdefghijklmnop',
      'chrome-extension://abcdefghijklmnop',
      { type: 'VOICE_RESULT', nonce: 'stale-nonce', payload: 'Buy milk' },
      'nonce-12345'
    );
    expect(invalid).toBe(false);
  });
});
