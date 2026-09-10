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

/**
 * Security Audit Log Entry Definition
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  severity: 'info' | 'warn' | 'error';
}

const AUDIT_LOG_KEY = 'daymark.auditLogs';

export function getSecurityAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logSecurityEvent(action: string, details: string, severity: 'info' | 'warn' | 'error' = 'info') {
  try {
    const logs = getSecurityAuditLogs();
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      details,
      severity
    };
    const updated = [entry, ...logs].slice(0, 100); // Retain last 100 security events
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to record security audit log:', err);
  }
}

export function clearAuditLogs() {
  localStorage.removeItem(AUDIT_LOG_KEY);
}

/**
 * Web Crypto AES-GCM Encryption Helper for local private notes/vault
 */
export async function encryptLocalText(plainText: string, passphrase: string): Promise<string> {
  if (!plainText) return '';
  if (!passphrase) return plainText;

  try {
    const enc = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plainText)
    );

    const combined = new Uint8Array(salt.length + iv.length + cipherBuffer.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(cipherBuffer), salt.length + iv.length);

    return `DAYMARK_ENC::` + btoa(String.fromCharCode(...combined));
  } catch (err) {
    logSecurityEvent('Encryption Failed', String(err), 'error');
    throw new Error('Encryption failed');
  }
}

/**
 * Web Crypto AES-GCM Decryption Helper
 */
export async function decryptLocalText(encryptedPayload: string, passphrase: string): Promise<string> {
  if (!encryptedPayload || !encryptedPayload.startsWith('DAYMARK_ENC::')) return encryptedPayload;
  if (!passphrase) throw new Error('Passphrase required to decrypt content');

  try {
    const base64Data = encryptedPayload.replace('DAYMARK_ENC::', '');
    const binary = atob(base64Data);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));

    const salt = bytes.slice(0, 16);
    const iv = bytes.slice(16, 28);
    const ciphertext = bytes.slice(28);

    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    logSecurityEvent('Decryption Failed', String(err), 'warn');
    throw new Error('Invalid passphrase or corrupted encrypted text');
  }
}
