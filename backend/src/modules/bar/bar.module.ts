import { Module } from '@nestjs/common';
import { BarController } from './bar.controller';
import { BarService } from './bar.service';
import { TelegramAuthGuard } from '../../shared/guards/telegram-auth.guard';

@Module({
  controllers: [BarController],
  providers: [BarService, TelegramAuthGuard],
  exports: [BarService],
})
export class BarModule {}
