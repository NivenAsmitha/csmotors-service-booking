import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export type AuthenticatedUser = Omit<
  User,
  | 'password_hash'
  | 'email_verification_token'
  | 'email_verification_expires_at'
  | 'password_reset_token'
  | 'password_reset_expires_at'
>;

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  must_change_password: boolean;
}

export function withoutPasswordHash(user: User): AuthenticatedUser {
  const {
    password_hash,
    email_verification_token,
    email_verification_expires_at,
    password_reset_token,
    password_reset_expires_at,
    ...safeUser
  } = user;
  void password_hash;
  void email_verification_token;
  void email_verification_expires_at;
  void password_reset_token;
  void password_reset_expires_at;

  return safeUser;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.toLowerCase();
    const password_hash = await bcrypt.hash(registerDto.password, 12);
    const otp = generateOtp();
    const email_verification_token = await bcrypt.hash(otp, 12);

    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          name: registerDto.name,
          email,
          phone: registerDto.phone,
          password_hash,
          role: UserRole.client,
          is_active: true,
          must_change_password: false,
          email_verified: false,
          email_verification_token,
          email_verification_expires_at: expiresInTenMinutes(),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A user with this email already exists');
      }

      throw error;
    }

    await this.auditService.log({
      userId: user.id,
      action: 'USER_CREATED',
      entity: 'user',
      entityId: user.id,
      metadata: {
        source: 'public_registration',
        email: user.email,
        role: user.role,
      },
    });
    await this.sendVerificationEmail(user, otp);

    return {
      message:
        'Registration successful. Please check your email for verification code.',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email.toLowerCase(),
      },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.email_verified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      must_change_password: user.must_change_password,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: withoutPasswordHash(user),
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: verifyEmailDto.email.toLowerCase(),
      },
    });

    if (!user) {
      throw new BadRequestException('Verification code is invalid or expired');
    }

    if (user.email_verified) {
      return {
        message: 'Email is already verified.',
      };
    }

    await assertValidOtp(
      verifyEmailDto.otp,
      user.email_verification_token,
      user.email_verification_expires_at,
      'Verification code is invalid or expired',
    );

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        email_verified: true,
        email_verification_token: null,
        email_verification_expires_at: null,
      },
    });

    return {
      message: 'Email verified successfully. You can now log in.',
    };
  }

  async resendVerification(resendVerificationDto: ResendVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: resendVerificationDto.email.toLowerCase(),
      },
    });

    if (!user) {
      return verificationResendMessage();
    }

    if (user.email_verified) {
      return {
        message: 'Email is already verified.',
      };
    }

    const otp = generateOtp();
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        email_verification_token: await bcrypt.hash(otp, 12),
        email_verification_expires_at: expiresInTenMinutes(),
      },
    });
    await this.sendVerificationEmail(user, otp);

    return verificationResendMessage();
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: forgotPasswordDto.email.toLowerCase(),
      },
    });

    if (user) {
      const otp = generateOtp();
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password_reset_token: await bcrypt.hash(otp, 12),
          password_reset_expires_at: expiresInTenMinutes(),
        },
      });
      await this.auditService.log({
        userId: user.id,
        action: 'password_reset.requested',
        entity: 'user',
        entityId: user.id,
      });

      try {
        await this.emailService.sendPasswordResetOtp(
          user.email,
          user.name,
          otp,
        );
      } catch {
        this.logger.error('Password reset email failed');
      }
    }

    return {
      message: 'If that email exists, a password reset code has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: resetPasswordDto.email.toLowerCase(),
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Password reset code is invalid or expired',
      );
    }

    await assertValidOtp(
      resetPasswordDto.otp,
      user.password_reset_token,
      user.password_reset_expires_at,
      'Password reset code is invalid or expired',
    );

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password_hash: await bcrypt.hash(resetPasswordDto.newPassword, 12),
        password_reset_token: null,
        password_reset_expires_at: null,
        must_change_password: false,
      },
    });

    return {
      message: 'Password reset successfully. You can now log in.',
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User account is not available');
    }

    const passwordMatches = await bcrypt.compare(
      changePasswordDto.old_password,
      user.password_hash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const password_hash = await bcrypt.hash(changePasswordDto.new_password, 12);
    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password_hash,
        must_change_password: false,
      },
    });

    return {
      user: withoutPasswordHash(updatedUser),
    };
  }

  private async sendVerificationEmail(user: User, otp: string) {
    try {
      await this.emailService.sendEmailVerificationOtp(
        user.email,
        user.name,
        otp,
      );
      await this.auditService.log({
        userId: user.id,
        action: 'email.verification_sent',
        entity: 'user',
        entityId: user.id,
      });
    } catch {
      this.logger.error('Email verification email failed');
    }
  }
}

function generateOtp() {
  return randomInt(100000, 1000000).toString();
}

function expiresInTenMinutes() {
  return new Date(Date.now() + 10 * 60 * 1000);
}

async function assertValidOtp(
  otp: string,
  hashedOtp: string | null,
  expiresAt: Date | null,
  errorMessage: string,
) {
  const valid =
    hashedOtp &&
    expiresAt &&
    expiresAt > new Date() &&
    (await bcrypt.compare(otp, hashedOtp));

  if (!valid) {
    throw new BadRequestException(errorMessage);
  }
}

function verificationResendMessage() {
  return {
    message: 'If that email exists, a verification code has been sent.',
  };
}
