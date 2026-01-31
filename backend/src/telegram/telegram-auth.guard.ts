import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const initData = request.headers['x-telegram-init-data'];

    if (!initData) {
      throw new UnauthorizedException('Telegram init data missing');
    }

    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new UnauthorizedException('Bot token not configured');
    }

    const userData = this.validateInitData(initData, botToken);
    if (!userData) {
      throw new UnauthorizedException('Invalid Telegram init data');
    }

    // Добавляем данные пользователя в request
    request.telegramUser = userData;
    return true;
  }

  /**
   * Валидация initData по алгоритму Telegram
   * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
   */
  private validateInitData(initData: string, botToken: string): TelegramUser | null {
    try {
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      
      if (!hash) return null;

      urlParams.delete('hash');

      // Сортируем параметры и формируем строку для проверки
      const dataCheckString = [...urlParams.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Вычисляем secret_key = HMAC-SHA256(bot_token, "WebAppData")
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      // Вычисляем hash = HMAC-SHA256(data_check_string, secret_key)
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      if (calculatedHash !== hash) {
        return null;
      }

      // Проверяем время (данные действительны 1 час)
      const authDate = urlParams.get('auth_date');
      if (authDate) {
        const timestamp = parseInt(authDate, 10);
        const now = Math.floor(Date.now() / 1000);
        if (now - timestamp > 3600) {
          return null; // Данные устарели
        }
      }

      // Извлекаем данные пользователя
      const userStr = urlParams.get('user');
      if (!userStr) return null;

      return JSON.parse(userStr) as TelegramUser;
    } catch {
      return null;
    }
  }
}
