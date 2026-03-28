import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: { id: user.id, email: user.email, role: user.role },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.usersService.verifyPassword(
      user.passwordHash,
      dto.password,
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: { id: user.id, email: user.email, role: user.role },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = await argon2.hash(refreshToken, { type: argon2.argon2id });

    const storedTokens = await this.refreshTokenRepo.find({
      where: { userId: undefined },
      relations: ['user'],
    });

    // Find matching token
    let matchedToken: RefreshToken | null = null;
    for (const stored of await this.refreshTokenRepo.find({ relations: ['user'] })) {
      try {
        if (await argon2.verify(stored.tokenHash, refreshToken)) {
          matchedToken = stored;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!matchedToken || matchedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotation: delete old token, create new pair
    await this.refreshTokenRepo.delete(matchedToken.id);

    const user = matchedToken.user;
    return this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async logout(userId: string) {
    await this.refreshTokenRepo.delete({ userId });
  }

  private async generateTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(
      { ...payload },
      { expiresIn: (this.config.get<string>('jwt.expiration') || '15m') as any },
    );

    const refreshTokenRaw = uuidv4();
    const refreshTokenHash = await argon2.hash(refreshTokenRaw, {
      type: argon2.argon2id,
    });

    const refreshToken = this.refreshTokenRepo.create({
      userId: payload.sub,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await this.refreshTokenRepo.save(refreshToken);

    return { accessToken, refreshToken: refreshTokenRaw };
  }
}
