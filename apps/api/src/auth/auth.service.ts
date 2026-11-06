import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

export const BCRYPT_ROUNDS = 10;

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** FR-07: đăng ký - mật khẩu được băm bằng bcrypt, không bao giờ lưu plain text. */
  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.prisma.user.create({
        data: { email: dto.email, passwordHash, fullName: dto.fullName },
      });
      return this.issueToken(user);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new DomainError('EMAIL_TAKEN', 'Email đã được sử dụng', HttpStatus.CONFLICT);
      }
      throw e;
    }
  }

  /** FR-08: đăng nhập - trả JWT. Thông báo lỗi chung để không lộ email nào tồn tại. */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const ok = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;
    if (!user || !ok) {
      throw new DomainError('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng', HttpStatus.UNAUTHORIZED);
    }
    return this.issueToken(user);
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, role: true, loyaltyPoints: true, createdAt: true },
    });
    if (!user) throw new DomainError('USER_NOT_FOUND', 'Tài khoản không tồn tại', HttpStatus.UNAUTHORIZED);
    return user;
  }

  private issueToken(user: User) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
      },
    };
  }
}
