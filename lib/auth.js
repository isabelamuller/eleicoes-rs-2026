import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'eleicoes_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 bytes.');
  }

  return secret;
}

export function passwordMatches(password) {
  const configuredPassword = process.env.SITE_PASSWORD;

  if (!configuredPassword) {
    throw new Error('SITE_PASSWORD is not configured.');
  }

  const expected = createHash('sha256').update(configuredPassword).digest();
  const received = createHash('sha256').update(password).digest();
  return timingSafeEqual(expected, received);
}

export function createSessionCookie(isProduction) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const nonce = randomBytes(16).toString('hex');
  const payload = `${expiresAt}.${nonce}`;
  const signature = createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('hex');
  const secure = isProduction ? '; Secure' : '';

  return `${COOKIE_NAME}=${payload}.${signature}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secure}`;
}

export function hasValidSession(request) {
  const cookieHeader = request.headers.cookie || '';
  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));

  if (!cookie) {
    return false;
  }

  const token = cookie.slice(COOKIE_NAME.length + 1);
  const [expiresAtText, nonce, providedSignature, ...extra] = token.split('.');

  if (
    extra.length ||
    !/^\d+$/.test(expiresAtText) ||
    !/^[a-f0-9]{32}$/.test(nonce) ||
    !/^[a-f0-9]{64}$/.test(providedSignature)
  ) {
    return false;
  }

  const expiresAt = Number(expiresAtText);

  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() / 1000) {
    return false;
  }

  const payload = `${expiresAtText}.${nonce}`;
  const expectedSignature = createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest();
  const receivedSignature = Buffer.from(providedSignature, 'hex');

  return timingSafeEqual(expectedSignature, receivedSignature);
}

export function isSameOriginRequest(request) {
  const origin = request.headers.origin;

  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).host.toLowerCase() === request.headers.host?.toLowerCase();
  } catch {
    return false;
  }
}

export function sendJson(response, status, body) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.status(status).json(body);
}
