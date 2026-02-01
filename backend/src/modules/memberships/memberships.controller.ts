import { Controller, Get, Post, Body, Query, Headers, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { AppAuthGuard } from '../../shared/guards/app-auth.guard';
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
  @UseGuards(AppAuthGuard)
  async getMyMembership(@CurrentUser() user: { id: string }) {
    return this.membershipsService.getUserActiveMembership(user.id);
  }

  /**
   * Заморозить абонемент
   */
  @Post('my/freeze')
  @UseGuards(AppAuthGuard)
  async freezeMembership(@CurrentUser() user: { id: string }) {
    return this.membershipsService.freezeMembership(user.id);
  }

  /**
   * Разморозить абонемент
   */
  @Post('my/unfreeze')
  @UseGuards(AppAuthGuard)
  async unfreezeMembership(@CurrentUser() user: { id: string }) {
    return this.membershipsService.unfreezeMembership(user.id);
  }

  /**
   * Покупка абонемента
   */
  @Post('purchase')
  @UseGuards(AppAuthGuard)
  async purchase(
    @CurrentUser() user: { id: string },
    @Body() body: { planId: string; paymentType?: string },
  ) {
    return this.membershipsService.purchase(
      user.id,
      body.planId,
      body.paymentType || 'OFFLINE',
    );
  }

  /**
   * Проверить, покрывается ли услуга абонементом
   */
  @Get('check-service')
  @UseGuards(AppAuthGuard)
  async checkService(
    @CurrentUser() user: { id: string },
    @Query('serviceId') serviceId: string,
  ) {
    return this.membershipsService.isServiceCoveredByMembership(user.id, serviceId);
  }
}
