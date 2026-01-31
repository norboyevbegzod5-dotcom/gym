import { Module } from '@nestjs/common';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { TelegramAuthGuard } from '../../shared/guards/telegram-auth.guard';

@Module({
  imports: [PrismaModule],
  controllers: [MembershipsController],
  providers: [MembershipsService, TelegramAuthGuard],
  exports: [MembershipsService],
})
export class MembershipsModule {}
