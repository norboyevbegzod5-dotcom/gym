import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AppAuthGuard } from '../../shared/guards/app-auth.guard';
import { CurrentUser } from '../../shared/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('users')
@UseGuards(AppAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: User) {
    return user;
  }

  @Patch('language')
  async updateLanguage(
    @CurrentUser() user: User,
    @Body('language') language: string,
  ) {
    return this.usersService.updateLanguage(user.telegramId, language);
  }
}
