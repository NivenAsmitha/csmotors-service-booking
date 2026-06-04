import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(currentUserRole: UserRole) {
    const users = await this.prisma.user.findMany({
      where: {
        role: {
          in: this.getVisibleManagementRoles(currentUserRole),
        },
      },
      select: safeUserSelect,
    });

    return users.sort(
      (firstUser, secondUser) =>
        roleSortOrder[firstUser.role] - roleSortOrder[secondUser.role],
    );
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: safeUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOneForManagement(id: string, currentUserRole: UserRole) {
    const user = await this.findOne(id);
    this.assertCanViewManagementUser(currentUserRole, user.role);

    return user;
  }

  async findActiveEmployees() {
    return this.prisma.user.findMany({
      where: {
        role: UserRole.employee,
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(
    currentUserId: string,
    currentUserRole: UserRole,
    createUserDto: CreateUserDto,
  ) {
    this.assertCanCreateRole(currentUserRole, createUserDto.role);

    const password_hash = await bcrypt.hash(createUserDto.password, 12);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: createUserDto.name,
          email: createUserDto.email.toLowerCase(),
          phone: createUserDto.phone,
          password_hash,
          role: createUserDto.role,
          is_active: true,
          must_change_password: createUserDto.role !== UserRole.admin,
          email_verified: true,
        },
        select: safeUserSelect,
      });

      await this.auditService.log({
        userId: currentUserId,
        action: 'USER_CREATED',
        entity: 'user',
        entityId: user.id,
        metadata: {
          email: user.email,
          role: user.role,
        },
      });

      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A user with this email already exists');
      }

      throw error;
    }
  }

  async update(
    currentUserId: string,
    currentUserRole: UserRole,
    id: string,
    updateUserDto: UpdateUserDto,
  ) {
    const previousUser = await this.findOne(id);
    this.assertCanManageUser(currentUserRole, previousUser.role);

    if (updateUserDto.role) {
      this.assertCanUpdateRole(currentUserRole, previousUser.role, updateUserDto.role);
    }

    const user = await this.prisma.user.update({
      where: {
        id,
      },
      data: updateUserDto,
      select: safeUserSelect,
    });

    await this.auditService.log({
      userId: currentUserId,
      action: 'USER_MANAGEMENT_UPDATED',
      entity: 'user',
      entityId: user.id,
      metadata: {
        old: previousUser,
        new: user,
      },
    });

    return user;
  }

  async remove(currentUserId: string, currentUserRole: UserRole, id: string) {
    const previousUser = await this.findOne(id);
    this.assertCanManageUser(currentUserRole, previousUser.role);

    const user = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        is_active: false,
      },
      select: safeUserSelect,
    });

    await this.auditService.log({
      userId: currentUserId,
      action: 'USER_DEACTIVATED',
      entity: 'user',
      entityId: user.id,
      metadata: {
        old: {
          is_active: previousUser.is_active,
        },
        new: {
          is_active: user.is_active,
        },
      },
    });

    return user;
  }

  async resetPasswordByDeveloper(
    currentUserId: string,
    id: string,
    resetUserPasswordDto: ResetUserPasswordDto,
  ) {
    const targetUser = await this.findOne(id);

    if (targetUser.role === UserRole.developer) {
      throw new ForbiddenException('Developer accounts are protected.');
    }

    const password_hash = await bcrypt.hash(
      resetUserPasswordDto.newPassword,
      12,
    );
    const shouldForcePasswordChange =
      targetUser.role === UserRole.employee ||
      targetUser.role === UserRole.it_support;
    const must_change_password =
      resetUserPasswordDto.must_change_password ?? shouldForcePasswordChange;
    const user = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        password_hash,
        must_change_password,
        password_reset_token: null,
        password_reset_expires_at: null,
      },
      select: safeUserSelect,
    });

    await this.auditService.log({
      userId: currentUserId,
      action: 'USER_PASSWORD_RESET_BY_DEVELOPER',
      entity: 'user',
      entityId: user.id,
      metadata: {
        email: user.email,
        role: user.role,
      },
    });

    return user;
  }

  async updateMyProfile(
    currentUserId: string,
    updateMyProfileDto: UpdateMyProfileDto,
  ) {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: currentUserId,
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const data: Prisma.UserUpdateInput = {};
    const metadata: Record<string, Prisma.InputJsonValue> = {};
    const requestedEmail = updateMyProfileDto.email?.trim().toLowerCase();
    const emailChanged = requestedEmail && requestedEmail !== currentUser.email;

    if (typeof updateMyProfileDto.name === 'string') {
      data.name = updateMyProfileDto.name.trim();
      metadata.name = {
        old: currentUser.name,
        new: data.name,
      };
    }

    if (typeof updateMyProfileDto.phone === 'string') {
      data.phone = updateMyProfileDto.phone.trim();
      metadata.phone = {
        old: currentUser.phone,
        new: data.phone,
      };
    }

    let otp: string | null = null;

    if (emailChanged) {
      const existingUser = await this.prisma.user.findUnique({
        where: {
          email: requestedEmail,
        },
      });

      if (existingUser && existingUser.id !== currentUser.id) {
        throw new ConflictException('A user with this email already exists');
      }

      otp = generateOtp();
      data.email = requestedEmail;
      data.email_verified = false;
      data.email_verification_token = await bcrypt.hash(otp, 12);
      data.email_verification_expires_at = expiresInTenMinutes();
      metadata.email = {
        old: currentUser.email,
        new: requestedEmail,
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data,
      select: safeUserSelect,
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'USER_PROFILE_UPDATED',
      entity: 'user',
      entityId: currentUser.id,
      metadata: metadata as Prisma.InputJsonValue,
    });

    if (emailChanged && otp) {
      await this.auditService.log({
        userId: currentUser.id,
        action: 'USER_EMAIL_CHANGED',
        entity: 'user',
        entityId: currentUser.id,
        metadata: {
          old_email: currentUser.email,
          new_email: requestedEmail,
        },
      });
      try {
        await this.emailService.sendEmailVerificationOtp(
          updatedUser.email,
          updatedUser.name,
          otp,
        );
      } catch {
        this.logger.error('Profile email verification email failed');
      }
    }

    return {
      message: emailChanged
        ? 'Profile updated. Please verify your new email address with the code we sent.'
        : 'Profile updated successfully.',
      user: updatedUser,
    };
  }

  private assertCanCreateRole(currentUserRole: UserRole, role: UserRole) {
    if (role === UserRole.developer) {
      throw new ForbiddenException('Developer accounts are protected.');
    }

    if (role === UserRole.admin && currentUserRole !== UserRole.developer) {
      throw new ForbiddenException(
        'Admins cannot manage Admin or Developer accounts.',
      );
    }

    if (role === UserRole.client) {
      throw new ForbiddenException(
        'Clients cannot be created from User Management.',
      );
    }

    const allowedRoles: UserRole[] =
      currentUserRole === UserRole.developer
        ? [UserRole.admin, UserRole.it_support, UserRole.employee]
        : [UserRole.it_support, UserRole.employee];

    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException(
        currentUserRole === UserRole.admin
          ? 'Admins cannot manage Admin or Developer accounts.'
          : 'You cannot create a user with this role',
      );
    }
  }

  private assertCanViewManagementUser(
    currentUserRole: UserRole,
    targetRole: UserRole,
  ) {
    if (!this.getVisibleManagementRoles(currentUserRole).includes(targetRole)) {
      if (targetRole === UserRole.developer) {
        throw new ForbiddenException('Developer accounts are protected.');
      }

      throw new ForbiddenException(
        'Admins cannot manage Admin or Developer accounts.',
      );
    }
  }

  private assertCanManageUser(currentUserRole: UserRole, targetRole: UserRole) {
    if (targetRole === UserRole.developer) {
      throw new ForbiddenException('Developer accounts are protected.');
    }

    if (currentUserRole === UserRole.admin) {
      if (targetRole === UserRole.admin) {
        throw new ForbiddenException(
          'Admins cannot manage Admin or Developer accounts.',
        );
      }

      if (
        targetRole !== UserRole.employee &&
        targetRole !== UserRole.it_support &&
        targetRole !== UserRole.client
      ) {
        throw new ForbiddenException(
          'Admins cannot manage Admin or Developer accounts.',
        );
      }
    }
  }

  private assertCanUpdateRole(
    currentUserRole: UserRole,
    targetRole: UserRole,
    role: UserRole,
  ) {
    this.assertCanManageUser(currentUserRole, targetRole);

    if (role === UserRole.developer) {
      throw new ForbiddenException('Developer accounts are protected.');
    }

    if (role === UserRole.admin && currentUserRole !== UserRole.developer) {
      throw new ForbiddenException(
        'Admins cannot manage Admin or Developer accounts.',
      );
    }

    if (
      currentUserRole === UserRole.admin &&
      role !== UserRole.employee &&
      role !== UserRole.it_support &&
      role !== UserRole.client
    ) {
      throw new ForbiddenException(
        'Admins cannot manage Admin or Developer accounts.',
      );
    }

    const allowedRoles: UserRole[] = [
      UserRole.admin,
      UserRole.client,
      UserRole.it_support,
      UserRole.employee,
    ];

    if (
      currentUserRole !== UserRole.developer ||
      !allowedRoles.includes(role)
    ) {
      throw new ForbiddenException('You cannot update a user to this role');
    }
  }

  private getVisibleManagementRoles(currentUserRole: UserRole): UserRole[] {
    return currentUserRole === UserRole.developer
      ? [
          UserRole.admin,
          UserRole.it_support,
          UserRole.employee,
          UserRole.client,
        ]
      : [UserRole.it_support, UserRole.employee, UserRole.client];
  }
}

function generateOtp() {
  return randomInt(100000, 1000000).toString();
}

function expiresInTenMinutes() {
  return new Date(Date.now() + 10 * 60 * 1000);
}

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  is_active: true,
  must_change_password: true,
  email_verified: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.UserSelect;

const roleSortOrder: Record<UserRole, number> = {
  [UserRole.admin]: 1,
  [UserRole.it_support]: 2,
  [UserRole.employee]: 3,
  [UserRole.client]: 4,
  [UserRole.developer]: 5,
};
