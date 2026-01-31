import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AppAuthGuard } from '../../shared/guards/app-auth.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || config.get('APP_JWT_SECRET') || 'app-secret-key-change-in-production',
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  providers: [AppAuthGuard],
  exports: [AppAuthGuard, JwtModule],
})
export class AppGuardModule {}
