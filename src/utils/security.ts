// Security & Data Integrity Validation (Phase 2 Baseline)
import { StorageDataPayload } from './indexedDB';

/**
 * Compute SHA-256 checksum for JSON backup data payloads
 */
export async function computePayloadChecksum(payload: Omit<StorageDataPayload, 'checksum'>): Promise<string> {
  try {
    const raw = JSON.stringify({
      roadmaps: payload.roadmaps || [],
      tasks: payload.tasks || [],
      notes: payload.notes || [],
      files: payload.files || []
    });
    
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(raw);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback lightweight hash calculation
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `crc32_${Math.abs(hash).toString(16)}`;
  } catch {
    return `fallback_${Date.now()}`;
  }
}

/**
 * Validates structure and types of an imported backup JSON payload
 */
export function validateBackupSchema(data: any): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Backup payload must be a valid JSON object.' };
  }

  if (data.tasks && !Array.isArray(data.tasks)) {
    return { isValid: false, error: 'Field "tasks" must be an array.' };
  }

  if (data.roadmaps && !Array.isArray(data.roadmaps)) {
    return { isValid: false, error: 'Field "roadmaps" must be an array.' };
  }

  if (data.notes && !Array.isArray(data.notes)) {
    return { isValid: false, error: 'Field "notes" must be an array.' };
  }

  if (data.files && !Array.isArray(data.files)) {
    return { isValid: false, error: 'Field "files" must be an array.' };
  }

  return { isValid: true };
}

/**
 * Sanitizes rich text note input against script execution vulnerabilities
 */
export function sanitizeRichText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}
