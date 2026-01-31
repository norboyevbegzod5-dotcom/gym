import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './shared/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ServicesModule } from './modules/services/services.module';
import { BarModule } from './modules/bar/bar.module';
import { AdminModule } from './modules/admin/admin.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { TelegramModule } from './telegram/telegram.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppGuardModule } from './modules/app-guard/app-guard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AppGuardModule,
    AuthModule,
    UsersModule,
    BookingsModule,
    ServicesModule,
    BarModule,
    AdminModule,
    MembershipsModule,
    TelegramModule,
  ],
})
export class AppModule {}
