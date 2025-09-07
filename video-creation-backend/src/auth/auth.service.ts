import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserSettings } from '../users/user-settings.entity';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSettings)
    private userSettingsRepository: Repository<UserSettings>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    const { username, email, password } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      username,
      email,
      password_hash,
    });

    const savedUser = await this.userRepository.save(user);

    // Create default user settings
    const userSettings = this.userSettingsRepository.create({
      user_id: savedUser.id,
      brand_color: '#3B82F6',
      font: 'Inter',
      default_voice_style: 'professional',
      default_music_style: 'upbeat',
      default_template: 'modern',
    });

    await this.userSettingsRepository.save(userSettings);

    // Return user without password
    const { password_hash: _, ...result } = savedUser;
    return this.login(result);
  }
}

