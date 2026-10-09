import { ChromeStorageAdapter } from '@/lib/storageAdapter';

export const extensionStorageAdapter = new ChromeStorageAdapter();

export interface VoiceMessagePayload {
  type: 'VOICE_RESULT' | 'VOICE_VOLUME' | 'VOICE_ERROR' | 'VOICE_STATE';
  nonce: string;
  payload?: any;
}

export function createSessionNonce(): string {
  return 'nonce_' + Math.random().toString(36).substring(2, 12);
}

export function isValidExtensionMessage(
  event: MessageEvent,
  expectedNonce: string,
  extensionId: string
): boolean {
  // Check extension origin
  const expectedOrigin = `chrome-extension://${extensionId}`;
  if (event.origin !== expectedOrigin) {
    return false;
  }
  const data = event.data as VoiceMessagePayload;
  if (!data || data.nonce !== expectedNonce) {
    return false;
  }
  return true;
}
