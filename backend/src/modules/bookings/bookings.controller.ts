import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { TelegramAuthGuard } from '../../shared/guards/telegram-auth.guard';
import { CurrentUser } from '../../shared/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('bookings')
@UseGuards(TelegramAuthGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() dto: { slotId: string; comment?: string },
  ) {
    return this.bookingsService.create({
      userId: user.id,
      slotId: dto.slotId,
      comment: dto.comment,
    });
  }

  @Get()
  async findMy(@CurrentUser() user: User) {
    return this.bookingsService.findByUser(user.id);
  }

  @Delete(':id')
  async cancel(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bookingsService.cancelByUser(id, user.id);
  }
}
