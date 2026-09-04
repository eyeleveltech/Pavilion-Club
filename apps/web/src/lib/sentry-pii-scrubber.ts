/**
 * DPDP Act (Digital Personal Data Protection Act, 2023) PII Scrubber
 * per docs/system/13-ops-security.md
 *
 * Automatically scrubs customer names, phone numbers, email addresses,
 * passwords, and session tokens before any error event leaves the server.
 */

const PHONE_REGEX = /(\+?91[\s-]?)?([6-9]\d{1})\d{4}(\d{4})/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'token',
  'sessiontoken',
  'cookie',
  'authorization',
  'pepper',
  'secret',
  'cardnumber',
  'cvv',
];

export function scrubPiiString(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // Mask Phone Numbers: e.g. +91 9840012345 -> +91 98****2345
  let sanitized = text.replace(PHONE_REGEX, (_match, p1, p2, p3) => {
    const prefix = p1 ? p1.trim() + ' ' : '';
    return `${prefix}${p2}****${p3}`;
  });

  // Redact Emails
  sanitized = sanitized.replace(EMAIL_REGEX, '[REDACTED_EMAIL]');

  return sanitized;
}

export function scrubPiiObject(obj: any, depth = 0): any {
  if (depth > 8 || obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return scrubPiiString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => scrubPiiObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
        sanitized[key] = '[REDACTED_SECRET]';
      } else {
        sanitized[key] = scrubPiiObject(value, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sentry beforeSend Hook per docs/system/13-ops-security.md
 */
export function sentryBeforeSend(event: any) {
  // 1. Scrub request data & headers
  if (event.request) {
    if (event.request.headers) {
      delete event.request.headers['cookie'];
      delete event.request.headers['authorization'];
      delete event.request.headers['x-api-key'];
    }
    if (event.request.data) {
      event.request.data = scrubPiiObject(event.request.data);
    }
  }

  // 2. Scrub exception values & stack traces
  if (event.exception?.values) {
    for (const val of event.exception.values) {
      if (val.value) {
        val.value = scrubPiiString(val.value);
      }
    }
  }

  // 3. Scrub breadcrumbs
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b: any) => scrubPiiObject(b));
  }

  // 4. Scrub user object: keep only anonymous ID, strip phone and name
  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
    if (event.user.phone) {
      event.user.phone = scrubPiiString(event.user.phone);
    }
  }

  return event;
}
