import { createRemoteJWKSet, jwtVerify } from 'jose';

const keysets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function authenticateAdmin(request: Request, config: { ACCESS_TEAM_DOMAIN?: string; ACCESS_AUD?: string; ADMIN_EMAILS?: string }, verify: typeof jwtVerify = jwtVerify) {
  const domain = config.ACCESS_TEAM_DOMAIN || '';
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain) || !config.ACCESS_AUD) throw new Error('Acceso administrador sin configurar');
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw new Error('Inicia sesión con el correo autorizado');
  const issuer = `https://${domain}`;
  if (!keysets.has(issuer)) keysets.set(issuer, createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)));
  const { payload } = await verify(token, keysets.get(issuer)!, { issuer, audience: config.ACCESS_AUD, algorithms: ['RS256'] });
  const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
  const allowed = (config.ADMIN_EMAILS || 'thaiplast.spa@gmail.com').split(',').map(value => value.trim().toLowerCase());
  if (!email || !allowed.includes(email)) throw new Error('Correo no autorizado');
  return email;
}
