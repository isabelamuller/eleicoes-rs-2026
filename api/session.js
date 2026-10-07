import { hasValidSession, sendJson } from '../lib/auth.js';

export default function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return sendJson(response, 405, { error: 'Método não permitido.' });
  }

  try {
    return sendJson(response, 200, {
      authenticated: hasValidSession(request),
    });
  } catch (error) {
    console.error('Session configuration error:', error);
    return sendJson(response, 500, { error: 'O acesso não está configurado.' });
  }
}
