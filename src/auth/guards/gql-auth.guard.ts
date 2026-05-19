import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { AuthTokenService } from '@/auth/auth-token.service';
import { TokenType } from '@/auth/entities';
import { User } from '@/users/entities';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(
    private readonly authTokenService: AuthTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato de token inválido');
    }

    try {
      const authToken = await this.authTokenService.validateToken(token, TokenType.SESSION);
      if (!authToken || !authToken.user) {
        throw new UnauthorizedException('Token inválido o expirado');
      }

      const user = authToken.user;
      if (user.availability !== 'ACTIVE') {
        throw new UnauthorizedException('Usuario no encontrado o inactivo');
      }

      req.user = user;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
