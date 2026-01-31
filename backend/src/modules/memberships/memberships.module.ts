import { Module } from '@nestjs/common';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AppGuardModule } from '../app-guard/app-guard.module';

@Module({
  imports: [PrismaModule, AppGuardModule],
  controllers: [MembershipsController],
  providers: [MembershipsService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
