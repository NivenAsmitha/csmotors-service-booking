import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: safeUserSelect,
      orderBy: {
        created_at: 'desc',
      },
    });
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
    if (updateUserDto.role) {
      this.assertCanUpdateRole(currentUserRole, updateUserDto.role);
    }

    const previousUser = await this.findOne(id);

    const user = await this.prisma.user.update({
      where: {
        id,
      },
      data: updateUserDto,
      select: safeUserSelect,
    });

    await this.auditService.log({
      userId: currentUserId,
      action: 'USER_UPDATED',
      entity: 'user',
      entityId: user.id,
      metadata: {
        old: previousUser,
        new: user,
      },
    });

    return user;
  }

  async remove(currentUserId: string, id: string) {
    const previousUser = await this.findOne(id);

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

    if (
      targetUser.role === UserRole.developer &&
      targetUser.id !== currentUserId
    ) {
      throw new ForbiddenException(
        'You cannot reset another developer password',
      );
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

  private assertCanCreateRole(currentUserRole: UserRole, role: UserRole) {
    const allowedRoles: UserRole[] =
      currentUserRole === UserRole.developer
        ? [UserRole.admin, UserRole.it_support, UserRole.employee]
        : [UserRole.it_support, UserRole.employee];

    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException('You cannot create a user with this role');
    }
  }

  private assertCanUpdateRole(currentUserRole: UserRole, role: UserRole) {
    const allowedRoles: UserRole[] = [
      UserRole.admin,
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
