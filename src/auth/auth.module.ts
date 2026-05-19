import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommonModule } from '@/common/common.module';
import { JwtAuthModule } from '@/auth/jwt-auth.module';

import { AuthResolver } from '@/auth/auth.resolver';

import { AuthService } from '@/auth/auth.service';
import { AuthTokenService } from '@/auth/auth-token.service';

import { GqlAuthGuard, RolesGuard } from '@/auth/guards';
import { AuthToken } from '@/auth/entities';

import { User } from '@/users/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuthToken]),
    CommonModule,
    JwtAuthModule,
  ],
  providers: [AuthService, AuthResolver, AuthTokenService, GqlAuthGuard, RolesGuard],
  exports: [AuthService, AuthTokenService, GqlAuthGuard, RolesGuard],
})
export class AuthModule {}
