import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TelegramAuthGuard } from '../../shared/guards/telegram-auth.guard';

@Module({
  controllers: [UsersController],
  providers: [UsersService, TelegramAuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
