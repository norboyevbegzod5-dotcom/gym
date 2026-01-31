import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramAuthGuard } from './telegram-auth.guard';
import { PrismaModule } from '../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TelegramService, TelegramAuthGuard],
  exports: [TelegramService, TelegramAuthGuard],
})
export class TelegramModule {}
