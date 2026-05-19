import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { AuthService } from '@/auth/auth.service';
import { AuthTokenService } from '@/auth/auth-token.service';
import { GqlAuthGuard, RolesGuard } from '@/auth/guards';
import { CurrentUser, Roles } from '@/auth/decorators';

import { User, UserRole } from '@/users/entities';
import { AuthToken } from '@/auth/entities';
import { ResponseBuilder } from '@/common/response';

import {
  LoginInput,
  ResetPasswordInput,
  RequestEmailChangeInput,
  ConfirmEmailChangeInput,
  ChangePasswordInput,
  SeedAdminInput,
  VerifyEmailInput,
  AuthResponse,
  AuthMessageResponse,
} from '@/auth/dto';
import { UserResponse } from '@/users/dto';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  @Mutation(() => UserResponse)
  async seedAdmin(@Args('input') input: SeedAdminInput): Promise<UserResponse> {
    const result = await this.authService.seedAdmin(input);
    return { ...ResponseBuilder.created(result, 'Admin user seeded successfully. Please check your email to verify your account.'), data: result };
  }

  @Mutation(() => UserResponse)
  async verifyEmail(@Args('input') input: VerifyEmailInput): Promise<UserResponse> {
    const result = await this.authService.verifyEmail(input);
    return { ...ResponseBuilder.success(result, 'Email verified successfully'), data: result };
  }

  @Mutation(() => AuthResponse)
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    const result = await this.authService.login(input);
    return { ...ResponseBuilder.success(result, 'Login successful'), data: result };
  }

  @Mutation(() => AuthMessageResponse)
  @UseGuards(GqlAuthGuard)
  async logout(
    @CurrentUser() user: User,
    @Context() ctx: any,
  ): Promise<AuthMessageResponse> {
    const authHeader = ctx.req?.headers?.authorization || '';
    const token = authHeader.split(' ')[1] || '';
    const result = await this.authService.logout(user.id, token);
    return { ...ResponseBuilder.success(null, result.message), data: result.message };
  }

  @Mutation(() => AuthMessageResponse)
  async requestPasswordChange(@Args('email') email: string): Promise<AuthMessageResponse> {
    const result = await this.authService.requestPasswordChange(email);
    return { ...ResponseBuilder.emailSent(result.message), data: result.message };
  }

  @Mutation(() => UserResponse)
  async confirmPasswordChange(@Args('input') input: ResetPasswordInput): Promise<UserResponse> {
    const result = await this.authService.confirmPasswordChange(input);
    return { ...ResponseBuilder.passwordReset(result, 'Password reset successfully'), data: result };
  }

  @Mutation(() => AuthMessageResponse)
  @UseGuards(GqlAuthGuard)
  async requestEmailChange(
    @CurrentUser() user: User,
    @Args('input') input: RequestEmailChangeInput,
  ): Promise<AuthMessageResponse> {
    const result = await this.authService.requestEmailChange(user.id, input);
    return { ...ResponseBuilder.emailSent(result.message), data: result.message };
  }

  @Mutation(() => UserResponse)
  async confirmEmailChange(@Args('input') input: ConfirmEmailChangeInput): Promise<UserResponse> {
    const result = await this.authService.confirmEmailChange(input);
    return { ...ResponseBuilder.emailChanged(result, 'Email changed successfully'), data: result };
  }

  @Mutation(() => AuthMessageResponse)
  @UseGuards(GqlAuthGuard)
  async resendEmailChange(
    @CurrentUser() user: User,
  ): Promise<AuthMessageResponse> {
    const result = await this.authService.resendEmailChange(user.id);
    return { ...ResponseBuilder.emailSent(result.message), data: result.message };
  }

  @Mutation(() => AuthMessageResponse)
  @UseGuards(GqlAuthGuard)
  async changePassword(
    @CurrentUser() user: User,
    @Args('input') input: ChangePasswordInput,
  ): Promise<AuthMessageResponse> {
    const result = await this.authService.changePassword(user.id, input);
    return { ...ResponseBuilder.passwordChanged(null, result.message), data: result.message };
  }

  @Query(() => AuthResponse)
  @UseGuards(GqlAuthGuard)
  async me(
    @CurrentUser() user: User,
    @Context() ctx: any,
  ): Promise<AuthResponse> {
    const authHeader = ctx.req?.headers?.authorization || '';
    const token = authHeader.split(' ')[1] || '';
    const result = await this.authService.getSession(user, token);
    return { ...ResponseBuilder.success(result, 'Session retrieved successfully'), data: result };
  }

  @Query(() => [AuthToken])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async sessions(
    @Args('userId', { nullable: true }) userId?: string,
  ): Promise<AuthToken[]> {
    return this.authTokenService.findActiveSessions(userId);
  }
}
