import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

import { AuthToken, TokenType } from '@/auth/entities';

@Injectable()
export class AuthTokenService {
  constructor(
    @InjectRepository(AuthToken)
    private readonly repo: Repository<AuthToken>,
    private readonly jwtService: JwtService,
  ) {}

  async createToken(
    userId: string,
    type: TokenType,
    expiresInHours = 1,
    metadata?: Record<string, any>,
  ): Promise<string> {
    const jti = randomUUID();
    const payload = { sub: userId, type, metadata, jti };
    const token = this.jwtService.sign(payload, {
      expiresIn: `${expiresInHours}h`,
    });

    const entity = this.repo.create({
      userId,
      tokenHash: jti,
      tokenPrefix: token.slice(0, 8),
      type,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
      metadata: metadata || null,
    });
    await this.repo.save(entity);
    return token;
  }

  async validateToken(rawToken: string, type: TokenType): Promise<AuthToken | null> {
    let decoded: any;
    try {
      decoded = this.jwtService.verify(rawToken);
    } catch {
      return null;
    }

    if (decoded.type !== type) {
      return null;
    }

    const jti = decoded.jti as string;
    const token = await this.repo.findOne({
      where: { tokenHash: jti, type, revokedAt: IsNull() },
      relations: ['user'],
    });

    if (!token || token.expiresAt < new Date()) {
      return null;
    }

    return token;
  }

  async revokeToken(tokenId: string): Promise<void> {
    await this.repo.update(tokenId, { revokedAt: new Date() });
  }

  async getLastSession(userId: string): Promise<AuthToken | null> {
    return this.repo.findOne({
      where: { userId, type: TokenType.SESSION, revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async findActiveSessions(userId?: string): Promise<AuthToken[]> {
    const where: any = { type: TokenType.SESSION, revokedAt: IsNull() };
    if (userId) {
      where.userId = userId;
    }
    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async findUnrevokedTokenByType(userId: string, type: TokenType): Promise<AuthToken | null> {
    return this.repo.findOne({
      where: { userId, type, revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.repo.update(
      { userId, type: TokenType.SESSION, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}
