import { Module } from '@nestjs/common';
import { BarController } from './bar.controller';
import { BarService } from './bar.service';
import { AppGuardModule } from '../app-guard/app-guard.module';
import { TelegramModule } from '../../telegram/telegram.module';

@Module({
  imports: [AppGuardModule, TelegramModule],
  controllers: [BarController],
  providers: [BarService],
  exports: [BarService],
})
export class BarModule {}
