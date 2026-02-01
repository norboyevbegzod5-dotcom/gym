import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { PrismaService } from '../shared/prisma/prisma.service';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (token) {
      this.bot = new Telegraf(token);
    }
  }

  async onModuleInit() {
    if (!this.bot) {
      console.warn('⚠️ TELEGRAM_BOT_TOKEN not set, bot disabled');
      return;
    }

    const webAppUrl = this.config.get<string>('WEBAPP_URL') || '';
    const isHttps = webAppUrl.startsWith('https://');

    // Команда /start
    this.bot.command('start', async (ctx) => {
      const telegramId = ctx.from?.id?.toString();
      const firstName = ctx.from?.first_name || 'Пользователь';
      
      if (!telegramId) return;

      // Check if user exists and has phone
      let user = await this.prisma.user.findUnique({
        where: { telegramId },
      });

      // Create user if doesn't exist
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            telegramId,
            firstName: ctx.from?.first_name,
            lastName: ctx.from?.last_name,
            username: ctx.from?.username,
            language: ctx.from?.language_code || 'ru',
          },
        });
      }

      // If user doesn't have phone, ask for it
      if (!user.phone) {
        await ctx.reply(
          `Привет, ${firstName}! 👋\n\n` +
          `Добро пожаловать в наш фитнес-клуб!\n\n` +
          `📱 Пожалуйста, поделитесь своим номером телефона для записи на услуги:`,
          {
            reply_markup: {
              keyboard: [[
                { text: '📱 Отправить номер телефона', request_contact: true }
              ]],
              resize_keyboard: true,
              one_time_keyboard: true,
            }
          }
        );
        return;
      }

      // User has phone, show main menu
      await this.showMainMenu(ctx, firstName, webAppUrl, isHttps);
    });

    // Handle contact (phone number)
    this.bot.on('contact', async (ctx) => {
      const contact = ctx.message?.contact;
      const telegramId = ctx.from?.id?.toString();
      const firstName = ctx.from?.first_name || 'Пользователь';

      if (!contact || !telegramId) return;

      // Verify contact belongs to the user
      if (contact.user_id?.toString() !== telegramId) {
        await ctx.reply('❌ Пожалуйста, отправьте свой собственный номер телефона.');
        return;
      }

      // Save phone to database
      await this.prisma.user.upsert({
        where: { telegramId },
        update: { phone: contact.phone_number },
        create: {
          telegramId,
          firstName: ctx.from?.first_name,
          lastName: ctx.from?.last_name,
          username: ctx.from?.username,
          phone: contact.phone_number,
          language: ctx.from?.language_code || 'ru',
        },
      });

      // Remove keyboard and show success
      await ctx.reply(
        `✅ Спасибо! Ваш номер ${contact.phone_number} сохранён.\n\n` +
        `Теперь вы можете пользоваться всеми услугами клуба!`,
        { reply_markup: { remove_keyboard: true } }
      );

      // Show main menu
      await this.showMainMenu(ctx, firstName, webAppUrl, isHttps);
    });

    // Callback для кнопок
    this.bot.action('services', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply(
        `🏋️ *Наши услуги:*\n\n` +
        `💳 Абонементы\n` +
        `👥 Групповые занятия (йога, аэробика)\n` +
        `🏃 Персональные тренировки\n` +
        `💆 Массаж\n` +
        `🧖 Сауна\n` +
        `☀️ Солярий\n` +
        `🍹 Фитнес-бар\n\n` +
        `Для записи откройте приложение или позвоните нам!`,
        { parse_mode: 'Markdown' }
      );
    });

    this.bot.action('contacts', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply(
        `📞 *Контакты:*\n\n` +
        `📍 Адрес: ул. Фитнесная, 1\n` +
        `📱 Телефон: +998 XX XXX XX XX\n` +
        `🕐 Режим работы: 6:00 - 23:00\n\n` +
        `Ждём вас!`,
        { parse_mode: 'Markdown' }
      );
    });

    // Обработка ошибок
    this.bot.catch((err, ctx) => {
      console.error('Telegram bot error:', err);
    });

    // Запуск бота (без блокировки приложения)
    // dropPendingUpdates сбрасывает очередь и помогает при конфликтах
    this.bot.launch({ dropPendingUpdates: true })
      .then(() => {
        console.log('🤖 Telegram bot started successfully!');
        if (!isHttps) {
          console.log('⚠️  Mini App requires HTTPS. Current URL:', webAppUrl);
          console.log('💡 Use ngrok or cloudflare tunnel for testing');
        }
      })
      .catch((error) => {
        console.error('❌ Failed to start Telegram bot:', error.message || error);
      });
    
    console.log('🔄 Telegram bot connecting to:', webAppUrl);
  }

  private async showMainMenu(ctx: any, firstName: string, webAppUrl: string, isHttps: boolean) {
    try {
      if (isHttps) {
        // Продакшн режим — кнопка Mini App
        await ctx.reply(
          `🏋️ Добро пожаловать, ${firstName}!\n\nНажмите кнопку ниже, чтобы открыть приложение:`,
          {
            reply_markup: {
              inline_keyboard: [[
                { text: '🏋️ Открыть приложение', web_app: { url: webAppUrl } }
              ]]
            }
          }
        );
      } else {
        // Локальная разработка — обычная ссылка
        await ctx.reply(
          `🏋️ Добро пожаловать, ${firstName}!\n\n` +
          `🔧 *Режим разработки*\n` +
          `Mini App доступен по адресу:\n${webAppUrl}\n\n` +
          `_Для работы в Telegram нужен HTTPS (ngrok/cloudflare tunnel)_`,
          { 
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                { text: '📋 Наши услуги', callback_data: 'services' },
                { text: '📞 Контакты', callback_data: 'contacts' }
              ]]
            }
          }
        );
      }
    } catch (error) {
      console.error('Error showing main menu:', error);
      await ctx.reply(
        `Привет, ${firstName}! 👋\n\nДобро пожаловать в наш фитнес-клуб!\n\nСвяжитесь с нами для записи.`
      );
    }
  }

  async onModuleDestroy() {
    if (this.bot) {
      this.bot.stop('SIGTERM');
    }
  }

  /**
   * Отправить сообщение пользователю
   */
  async sendMessage(chatId: string | number, message: string) {
    if (!this.bot) return;
    try {
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  /**
   * Chat ID для уведомлений о записях (бронированиях)
   */
  private getBookingsChatId(): string | undefined {
    return this.config.get<string>('BOOKINGS_CHAT_ID') || this.config.get<string>('ADMIN_CHAT_ID');
  }

  /**
   * Chat ID для уведомлений о заказах бара
   */
  private getBarOrdersChatId(): string | undefined {
    return this.config.get<string>('BAR_ORDERS_CHAT_ID') || this.config.get<string>('ADMIN_CHAT_ID');
  }

  /**
   * Chat ID для уведомлений об отзывах
   */
  private getFeedbackChatId(): string | undefined {
    return this.config.get<string>('FEEDBACK_CHAT_ID') || this.config.get<string>('ADMIN_CHAT_ID');
  }

  /**
   * Отправить уведомление о новой записи в группу (BOOKINGS_CHAT_ID или ADMIN_CHAT_ID)
   */
  async notifyAdminNewBooking(booking: {
    userName: string;
    serviceName: string;
    dateTime: string;
  }) {
    const chatId = this.getBookingsChatId();
    if (!chatId || !this.bot) return;

    const message = `📝 <b>Новая запись!</b>\n\n` +
      `👤 Клиент: ${booking.userName}\n` +
      `🏷 Услуга: ${booking.serviceName}\n` +
      `📅 Дата/время: ${booking.dateTime}`;

    await this.sendMessage(chatId, message);
  }

  /**
   * Отправить уведомление о новом заказе бара в группу (BAR_ORDERS_CHAT_ID или ADMIN_CHAT_ID)
   */
  async notifyNewBarOrder(order: {
    userName: string;
    itemsSummary: string;
    total: number;
  }) {
    const chatId = this.getBarOrdersChatId();
    if (!chatId || !this.bot) return;

    const message = `🍹 <b>Новый заказ бара!</b>\n\n` +
      `👤 Клиент: ${order.userName}\n` +
      `📋 ${order.itemsSummary}\n` +
      `💰 Итого: ${order.total} UZS`;

    await this.sendMessage(chatId, message);
  }

  /**
   * Отправить уведомление о новом отзыве в группу (FEEDBACK_CHAT_ID или ADMIN_CHAT_ID)
   */
  async notifyNewFeedback(feedback: {
    userName: string;
    serviceName: string;
    date: string;
    rating: number;
    comment?: string | null;
  }) {
    const chatId = this.getFeedbackChatId();
    if (!chatId || !this.bot) return;

    let message = `⭐ <b>Новый отзыв!</b>\n\n` +
      `👤 Клиент: ${feedback.userName}\n` +
      `🏷 Занятие: ${feedback.serviceName}\n` +
      `📅 Дата: ${feedback.date}\n` +
      `⭐ Оценка: ${feedback.rating}/5`;

    if (feedback.comment?.trim()) {
      message += `\n\n💬 Комментарий: ${feedback.comment.trim()}`;
    }

    await this.sendMessage(chatId, message);
  }

  /**
   * Отправить подтверждение записи пользователю
   */
  async notifyUserBookingConfirmed(
    chatId: string | number,
    serviceName: string,
    dateTime: string,
  ) {
    const message = `✅ <b>Ваша запись подтверждена!</b>\n\n` +
      `🏷 Услуга: ${serviceName}\n` +
      `📅 Дата/время: ${dateTime}\n\n` +
      `Ждём вас в нашем клубе!`;

    await this.sendMessage(chatId, message);
  }

  /**
   * Отправить уведомление об отмене записи
   */
  async notifyUserBookingCancelled(
    chatId: string | number,
    serviceName: string,
    dateTime: string,
    reason?: string,
  ) {
    let message = `❌ <b>Запись отменена</b>\n\n` +
      `🏷 Услуга: ${serviceName}\n` +
      `📅 Дата/время: ${dateTime}`;

    if (reason) {
      message += `\n\n📝 Причина: ${reason}`;
    }

    await this.sendMessage(chatId, message);
  }
}
