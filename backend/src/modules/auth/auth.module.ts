import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { AppGuardModule } from '../app-guard/app-guard.module';

@Module({
  imports: [UsersModule, AppGuardModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
