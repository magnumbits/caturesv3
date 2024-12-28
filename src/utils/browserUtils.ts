// Browser capability detection
export function checkWebShareSupport(): boolean {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare
  );
}

export function checkSecureContext(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    window.isSecureContext
  );
}

// File type validation
export function isValidImageType(type: string): boolean {
  return /^image\/(jpeg|png|webp)$/.test(type);
}

// Error handling utilities
export class ShareError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ShareError';
  }
}