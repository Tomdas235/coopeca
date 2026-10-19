import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaService } from '../database/prisma.service';
import { AccessTokenClaims } from './auth.types';

const scrypt = promisify(scryptCallback);
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const TOKEN_TTL_SECONDS = 15 * 60;
const TOKEN_ISSUER = 'coopeca-api';

export type CreateSessionResult = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.jwtSecret = config.getOrThrow<string>('app.jwtSecret');
  }

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = await this.deriveKey(password, salt);
    return [
      'scrypt',
      SCRYPT_N,
      SCRYPT_R,
      SCRYPT_P,
      salt.toString('hex'),
      derivedKey.toString('hex'),
    ].join('$');
  }

  async verifyPassword(password: string, encodedHash: string): Promise<boolean> {
    const parts = encodedHash.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

    const [algorithm, n, r, p, saltHex, hashHex] = parts;
    if (
      algorithm !== 'scrypt' ||
      n !== String(SCRYPT_N) ||
      r !== String(SCRYPT_R) ||
      p !== String(SCRYPT_P) ||
      !/^[0-9a-f]{32}$/i.test(saltHex) ||
      !/^[0-9a-f]{128}$/i.test(hashHex)
    ) {
      return false;
    }

    const expected = Buffer.from(hashHex, 'hex');
    const actual = await this.deriveKey(password, Buffer.from(saltHex, 'hex'));
    return timingSafeEqual(actual, expected);
  }

  async createSession(username: string, password: string): Promise<CreateSessionResult> {
    const user = await this.prisma.appUser.findUnique({
      where: { username },
      select: { id: true, passwordHash: true, isActive: true },
    });

    if (
      !user ||
      !user.isActive ||
      !(await this.verifyPassword(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    await this.prisma.appUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: { id: true },
    });

    const now = Math.floor(Date.now() / 1000);
    const claims: AccessTokenClaims = {
      sub: user.id,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
      iss: TOKEN_ISSUER,
    };

    return {
      accessToken: this.signClaims(claims),
      tokenType: 'Bearer',
      expiresIn: TOKEN_TTL_SECONDS,
    };
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    const parts = token.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Jeton invalide.');

    const [headerPart, payloadPart, signaturePart] = parts;
    const signingInput = `${headerPart}.${payloadPart}`;
    const expectedSignature = this.sign(signingInput);
    const suppliedSignature = Buffer.from(signaturePart, 'base64url');

    if (
      suppliedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(suppliedSignature, expectedSignature)
    ) {
      throw new UnauthorizedException('Jeton invalide.');
    }

    try {
      const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8')) as {
        alg?: string;
        typ?: string;
      };
      const claims = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as Partial<AccessTokenClaims>;
      const now = Math.floor(Date.now() / 1000);

      if (
        header.alg !== 'HS256' ||
        header.typ !== 'JWT' ||
        typeof claims.sub !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(claims.sub) ||
        claims.iss !== TOKEN_ISSUER ||
        typeof claims.exp !== 'number' ||
        claims.exp <= now ||
        typeof claims.iat !== 'number' ||
        claims.iat > now + 60
      ) {
        throw new UnauthorizedException('Jeton invalide ou expiré.');
      }

      return claims as AccessTokenClaims;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Jeton invalide.');
    }
  }

  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return (await scrypt(password, salt, KEY_LENGTH, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      maxmem: 64 * 1024 * 1024,
    })) as Buffer;
  }

  private signClaims(claims: AccessTokenClaims): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const signingInput = `${header}.${payload}`;
    return `${signingInput}.${this.sign(signingInput).toString('base64url')}`;
  }

  private sign(value: string): Buffer {
    return createHmac('sha256', this.jwtSecret).update(value).digest();
  }
}