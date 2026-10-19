import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../database/prisma.service';
import { AuthenticatedPrincipal } from './auth.types';
import { AuthService } from './auth.service';

type AuthenticatedRequest = Request & { user: AuthenticatedPrincipal };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/);
    if (!match) throw new UnauthorizedException('Authentification requise.');

    const claims = this.authService.verifyAccessToken(match[1]);
    const user = await this.prisma.appUser.findUnique({
      where: { id: claims.sub },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        branchAccesses: {
          select: {
            isPrimary: true,
            branch: { select: { id: true, code: true, name: true, isActive: true } },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Session invalide.');
    }

    request.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      branches: user.branchAccesses
        .filter(({ branch }) => branch.isActive)
        .map(({ branch }) => ({ id: branch.id, code: branch.code, name: branch.name })),
    };

    return true;
  }
}