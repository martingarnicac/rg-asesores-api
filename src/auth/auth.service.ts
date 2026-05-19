import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CryptoService } from '@/common/crypto/crypto.service';
import { MailService } from '@/common/mail/mail.service';
import { AuthTokenService } from '@/auth/auth-token.service';
import { IdentifierService } from '@/common/identifier/identifier.service';

import { Availability } from '@/common/availability/entities';
import { User, UserRole } from '@/users/entities';
import { AuthToken, TokenType } from '@/auth/entities';
import {
  LoginInput,
  ResetPasswordInput,
  RequestEmailChangeInput,
  ConfirmEmailChangeInput,
  ChangePasswordInput,
  AuthPayload,
  SeedAdminInput,
  VerifyEmailInput,
} from '@/auth/dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AuthToken)
    private readonly tokenRepo: Repository<AuthToken>,
    private readonly mailService: MailService,
    private readonly authTokenService: AuthTokenService,
    private readonly cryptoService: CryptoService,
    private readonly identifierService: IdentifierService,
  ) {}

  async sendVerificationEmail(user: User): Promise<void> {
    const rawToken = await this.authTokenService.createToken(
      user.id,
      TokenType.EMAIL_VERIFICATION,
      24,
    );
    const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${rawToken}`;
    await this.mailService.sendEmailVerification(user.email, user.name, verifyUrl);
  }

  async seedAdmin(input: SeedAdminInput): Promise<User> {
    const userCount = await this.userRepo.count();
    if (userCount > 0) {
      throw new ForbiddenException('Users already exist in the database');
    }

    const identifier = await this.identifierService.generateNextIdentifier<User>(
      this.userRepo,
      'USRIO',
    );

    const passwordHash = await this.cryptoService.hashPassword(input.password);
    const user = this.userRepo.create({
      identifier,
      email: input.email,
      passwordHash,
      name: input.name,
      lastname: input.lastname ?? null,
      role: UserRole.ADMIN,
      availability: Availability.INACTIVE,
    });
    await this.userRepo.save(user);

    await this.sendVerificationEmail(user);

    return user;
  }

  async verifyEmail(input: VerifyEmailInput): Promise<User> {
    const token = await this.authTokenService.validateToken(
      input.token,
      TokenType.EMAIL_VERIFICATION,
    );
    if (!token) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.userRepo.findOne({ where: { id: token.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.availability = Availability.ACTIVE;
    user.emailVerified = true;
    await this.userRepo.save(user);
    await this.authTokenService.revokeToken(token.id);

    return user;
  }

  async login(input: LoginInput): Promise<AuthPayload> {
    const user = await this.userRepo.findOne({ where: { email: input.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await this.cryptoService.comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.availability !== Availability.ACTIVE) {
      throw new UnauthorizedException('Account not verified. Please verify your email before logging in.');
    }

    // Create session token in auth_tokens
    const sessionToken = await this.authTokenService.createToken(
      user.id,
      TokenType.SESSION,
      168, // 7 days in hours
    );

    return this.buildAuthPayload(user, sessionToken);
  }

  async logout(userId: string, sessionToken: string): Promise<{ message: string }> {
    const token = await this.authTokenService.validateToken(sessionToken, TokenType.SESSION);
    if (token && token.userId === userId) {
      await this.authTokenService.revokeToken(token.id);
    }

    return { message: 'Logout successful' };
  }

  async requestPasswordChange(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, you will receive instructions' };
    }

    const rawToken = await this.authTokenService.createToken(user.id, TokenType.PASSWORD_RESET, 1);
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;
    await this.mailService.sendPasswordResetEmail(user.email, user.name, resetUrl);

    return { message: 'If the email exists, you will receive instructions' };
  }

  async confirmPasswordChange(input: ResetPasswordInput): Promise<User> {
    const token = await this.authTokenService.validateToken(input.token, TokenType.PASSWORD_RESET);
    if (!token) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.userRepo.findOne({ where: { id: token.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.passwordHash = await this.cryptoService.hashPassword(input.newPassword);
    await this.userRepo.save(user);
    await this.authTokenService.revokeToken(token.id);
    await this.authTokenService.revokeAllUserSessions(user.id);

    await this.mailService.sendPasswordChangeConfirmation(user.email, user.name);

    return user;
  }

  async requestEmailChange(userId: string, input: RequestEmailChangeInput): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.userRepo.findOne({ where: { email: input.newEmail } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const rawToken = await this.authTokenService.createToken(user.id, TokenType.EMAIL_CHANGE, 1, {
      newEmail: input.newEmail,
    });
    const confirmUrl = `${process.env.APP_URL || 'http://localhost:3000'}/confirm-email?token=${rawToken}`;
    await this.mailService.sendEmailChangeRequest(input.newEmail, user.name, confirmUrl);

    return { message: 'A confirmation email has been sent' };
  }

  async confirmEmailChange(input: ConfirmEmailChangeInput): Promise<User> {
    const token = await this.authTokenService.validateToken(input.token, TokenType.EMAIL_CHANGE);
    if (!token) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.userRepo.findOne({ where: { id: token.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newEmail = token.metadata?.newEmail;
    if (!newEmail) {
      throw new BadRequestException('Corrupt token: missing email metadata');
    }

    const existing = await this.userRepo.findOne({ where: { email: newEmail } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const oldEmail = user.email;
    user.email = newEmail;
    await this.userRepo.save(user);
    await this.authTokenService.revokeToken(token.id);
    await this.authTokenService.revokeAllUserSessions(user.id);

    await this.mailService.sendEmailChangeConfirmation(oldEmail, user.name, newEmail);

    return user;
  }

  async resendEmailChange(userId: string): Promise<{ message: string }> {
    const token = await this.authTokenService.findUnrevokedTokenByType(userId, TokenType.EMAIL_CHANGE);
    if (!token) {
      throw new BadRequestException('No pending email change request');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newEmail = token.metadata?.newEmail;
    if (!newEmail) {
      throw new BadRequestException('Corrupt token: missing email metadata');
    }

    await this.authTokenService.revokeToken(token.id);

    const rawToken = await this.authTokenService.createToken(user.id, TokenType.EMAIL_CHANGE, 1, {
      newEmail,
    });
    const confirmUrl = `${process.env.APP_URL || 'http://localhost:3000'}/confirm-email?token=${rawToken}`;
    await this.mailService.sendEmailChangeRequest(newEmail, user.name, confirmUrl);

    return { message: 'A confirmation email has been resent' };
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await this.cryptoService.comparePassword(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.passwordHash = await this.cryptoService.hashPassword(input.newPassword);
    await this.userRepo.save(user);

    await this.mailService.sendPasswordChangeConfirmation(user.email, user.name);

    return { message: 'Password updated successfully' };
  }

  async getSession(user: User, token: string): Promise<AuthPayload> {
    return this.buildAuthPayload(user, token);
  }

  private buildAuthPayload(user: User, token: string): AuthPayload {
    return {
      token,
      user,
    };
  }
}
