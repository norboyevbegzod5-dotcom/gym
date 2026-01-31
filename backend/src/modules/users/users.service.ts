import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { User } from '@prisma/client';

interface CreateUserDto {
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  language?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Найти или создать пользователя по Telegram ID
   */
  async findOrCreate(dto: CreateUserDto): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { telegramId: dto.telegramId },
    });

    if (existing) {
      // Обновляем информацию при каждом входе
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          username: dto.username,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        telegramId: dto.telegramId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
        language: dto.language || 'ru',
      },
    });
  }

  /**
   * Получить пользователя по ID (для JWT guard)
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Нормализовать номер телефона (только цифры)
   */
  normalizePhone(phone: string): string {
    return (phone || '').replace(/\D/g, '');
  }

  /**
   * Найти или создать пользователя по номеру телефона (без OTP).
   * Для пользователей «только по телефону» telegramId = "phone-{normalized}".
   */
  async findOrCreateByPhone(phone: string): Promise<User> {
    const normalized = this.normalizePhone(phone);
    if (!normalized) {
      throw new BadRequestException('Invalid phone number');
    }
    const existing = await this.prisma.user.findUnique({
      where: { phone: normalized },
    });
    if (existing) {
      return existing;
    }
    const telegramId = `phone-${normalized}`;
    return this.prisma.user.create({
      data: {
        telegramId,
        phone: normalized,
        language: 'ru',
      },
    });
  }

  /**
   * Получить пользователя по Telegram ID
   */
  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { telegramId },
    });
  }

  /**
   * Обновить язык пользователя
   */
  async updateLanguage(telegramId: string, language: string): Promise<User> {
    return this.prisma.user.update({
      where: { telegramId },
      data: { language },
    });
  }

  /**
   * Обновить телефон пользователя
   */
  async updatePhone(telegramId: string, phone: string): Promise<User> {
    return this.prisma.user.update({
      where: { telegramId },
      data: { phone },
    });
  }
}
