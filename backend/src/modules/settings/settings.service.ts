import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

const KEYS = {
  BOOKINGS_CHAT_ID: 'BOOKINGS_CHAT_ID',
  BAR_ORDERS_CHAT_ID: 'BAR_ORDERS_CHAT_ID',
  FEEDBACK_CHAT_ID: 'FEEDBACK_CHAT_ID',
} as const;

export interface TelegramChatSettings {
  bookingsChatId: string | null;
  barOrdersChatId: string | null;
  feedbackChatId: string | null;
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get(key: string): Promise<string | null> {
    const row = await this.prisma.appSetting.findUnique({
      where: { key },
    });
    return row?.value ?? null;
  }

  async set(key: string, value: string | null): Promise<void> {
    await this.prisma.appSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  async getTelegramChatSettings(): Promise<TelegramChatSettings> {
    const [bookings, barOrders, feedback] = await Promise.all([
      this.get(KEYS.BOOKINGS_CHAT_ID),
      this.get(KEYS.BAR_ORDERS_CHAT_ID),
      this.get(KEYS.FEEDBACK_CHAT_ID),
    ]);
    return {
      bookingsChatId: bookings ?? null,
      barOrdersChatId: barOrders ?? null,
      feedbackChatId: feedback ?? null,
    };
  }

  async updateTelegramChatSettings(data: Partial<TelegramChatSettings>): Promise<TelegramChatSettings> {
    if (data.bookingsChatId !== undefined) {
      await this.set(KEYS.BOOKINGS_CHAT_ID, data.bookingsChatId?.trim() || null);
    }
    if (data.barOrdersChatId !== undefined) {
      await this.set(KEYS.BAR_ORDERS_CHAT_ID, data.barOrdersChatId?.trim() || null);
    }
    if (data.feedbackChatId !== undefined) {
      await this.set(KEYS.FEEDBACK_CHAT_ID, data.feedbackChatId?.trim() || null);
    }
    return this.getTelegramChatSettings();
  }
}
