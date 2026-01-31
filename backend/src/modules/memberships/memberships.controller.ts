import { Controller, Get, Post, Query, Headers, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { TelegramAuthGuard } from '../../shared/guards/telegram-auth.guard';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@Controller('memberships')
export class MembershipsController {
  constructor(private membershipsService: MembershipsService) {}

  /**
   * Получить список доступных тарифов
   */
  @Get('plans')
  async getPlans(@Headers('accept-language') language?: string) {
    return this.membershipsService.getPlans(language || 'ru');
  }

  /**
   * Получить активный абонемент текущего пользователя
   */
  @Get('my')
  @UseGuards(TelegramAuthGuard)
  async getMyMembership(@CurrentUser() user: { id: string }) {
    return this.membershipsService.getUserActiveMembership(user.id);
  }

  /**
   * Заморозить абонемент
   */
  @Post('my/freeze')
  @UseGuards(TelegramAuthGuard)
  async freezeMembership(@CurrentUser() user: { id: string }) {
    return this.membershipsService.freezeMembership(user.id);
  }

  /**
   * Разморозить абонемент
   */
  @Post('my/unfreeze')
  @UseGuards(TelegramAuthGuard)
  async unfreezeMembership(@CurrentUser() user: { id: string }) {
    return this.membershipsService.unfreezeMembership(user.id);
  }

  /**
   * Проверить, покрывается ли услуга абонементом
   */
  @Get('check-service')
  @UseGuards(TelegramAuthGuard)
  async checkService(
    @CurrentUser() user: { id: string },
    @Query('serviceId') serviceId: string,
  ) {
    return this.membershipsService.isServiceCoveredByMembership(user.id, serviceId);
  }
}
