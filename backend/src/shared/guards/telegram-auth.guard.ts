import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const initData = request.headers['x-telegram-init-data'];

    if (!initData) {
      throw new UnauthorizedException('Telegram init data not provided');
    }

    try {
      // Парсим init data (URL encoded string)
      const params = new URLSearchParams(initData);
      const userString = params.get('user');

      if (!userString) {
        throw new UnauthorizedException('User data not found in init data');
      }

      const telegramUser: TelegramUser = JSON.parse(decodeURIComponent(userString));

      if (!telegramUser.id) {
        throw new UnauthorizedException('Invalid user data');
      }

      // Находим или создаём пользователя в БД
      const user = await this.findOrCreateUser(telegramUser);
      
      // Добавляем пользователя в request
      request.user = user;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Telegram auth error:', error);
      throw new UnauthorizedException('Failed to authenticate');
    }
  }

  private async findOrCreateUser(telegramUser: TelegramUser) {
    const telegramId = telegramUser.id.toString();

    const existing = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (existing) {
      // Обновляем информацию при каждом входе
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        telegramId,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        language: telegramUser.language_code || 'ru',
      },
    });
  }
}
