import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { BarService } from './bar.service';
import { TelegramAuthGuard } from '../../shared/guards/telegram-auth.guard';
import { CurrentUser } from '../../shared/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('bar')
export class BarController {
  constructor(private barService: BarService) {}

  @Get('menu')
  async getMenu(@Query('lang') lang = 'ru') {
    return this.barService.getMenu(lang);
  }

  @Post('orders')
  @UseGuards(TelegramAuthGuard)
  async createOrder(
    @CurrentUser() user: User,
    @Body() dto: { items: Array<{ itemId: string; quantity: number }> },
  ) {
    return this.barService.createOrder(user.id, dto.items);
  }

  @Get('orders')
  @UseGuards(TelegramAuthGuard)
  async getMyOrders(@CurrentUser() user: User) {
    return this.barService.getUserOrders(user.id);
  }
}
