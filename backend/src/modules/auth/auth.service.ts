import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async loginByPhone(phone: string): Promise<{ token: string; user: User }> {
    const user = await this.usersService.findOrCreateByPhone(phone);
    const token = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '30d' },
    );
    return { token, user };
  }
}
