import {
  createSessionCookie,
  isSameOriginRequest,
  passwordMatches,
  sendJson,
} from '../lib/auth.js';

export default function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Método não permitido.' });
  }

  if (!isSameOriginRequest(request)) {
    return sendJson(response, 403, { error: 'Origem não permitida.' });
  }

  const password = request.body?.password;

  if (typeof password !== 'string' || password.length > 1024) {
    return sendJson(response, 400, { error: 'Senha inválida.' });
  }

  try {
    if (!passwordMatches(password)) {
      return sendJson(response, 401, { error: 'Senha incorreta.' });
    }

    response.setHeader(
      'Set-Cookie',
      createSessionCookie(process.env.NODE_ENV === 'production'),
    );
    return sendJson(response, 200, { authenticated: true });
  } catch (error) {
    console.error('Login configuration error:', error);
    return sendJson(response, 500, { error: 'O acesso não está configurado.' });
  }
}
