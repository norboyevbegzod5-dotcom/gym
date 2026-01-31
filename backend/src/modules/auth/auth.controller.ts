import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('phone')
  async loginByPhone(@Body() body: { phone: string }) {
    return this.authService.loginByPhone(body.phone ?? '');
  }
}
