import { Module, forwardRef } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AppGuardModule } from '../app-guard/app-guard.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [AppGuardModule, forwardRef(() => MembershipsModule)],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
