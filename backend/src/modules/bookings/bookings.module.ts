import { Module, forwardRef } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { TelegramAuthGuard } from '../../shared/guards/telegram-auth.guard';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [forwardRef(() => MembershipsModule)],
  controllers: [BookingsController],
  providers: [BookingsService, TelegramAuthGuard],
  exports: [BookingsService],
})
export class BookingsModule {}
