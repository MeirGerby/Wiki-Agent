import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

export function generateJwt<T extends object>(
  secret: string,
  data: T,
  options: SignOptions = {},
): string {
  return jwt.sign(data, secret, { expiresIn: '24h', ...options });
}

export function decodeJwt(
  secret: string,
  token: string,
): string | JwtPayload | undefined {
  try {
    return jwt.verify(token, secret);
  } catch {
    return undefined;
  }
}
