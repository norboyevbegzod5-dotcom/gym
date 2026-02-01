import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Booking } from '@prisma/client';
import { MembershipsService } from '../memberships/memberships.service';

// Статусы бронирования (SQLite не поддерживает enum)
const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED_BY_USER: 'CANCELLED_BY_USER',
  CANCELLED_BY_ADMIN: 'CANCELLED_BY_ADMIN',
  COMPLETED: 'COMPLETED',
} as const;

interface CreateBookingDto {
  userId: string;
  slotId: string;
  comment?: string;
  useMembership?: boolean; // попытаться использовать абонемент
}

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => MembershipsService))
    private membershipsService: MembershipsService,
  ) {}

  /**
   * Создать бронирование
   */
  async create(dto: CreateBookingDto): Promise<Booking & { isMembership: boolean }> {
    // Проверяем доступность слота
    const slot = await this.prisma.slot.findUnique({
      where: { id: dto.slotId },
      include: { service: true },
    });

    if (!slot) {
      throw new BadRequestException('Слот не найден');
    }

    if (slot.bookedCount >= slot.capacity) {
      throw new BadRequestException('Все места заняты');
    }

    // Проверяем, нет ли уже записи у пользователя на этот слот
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        userId: dto.userId,
        slotId: dto.slotId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
    });

    if (existingBooking) {
      throw new BadRequestException('Вы уже записаны на это время');
    }

    // Проверяем абонемент пользователя
    let isMembership = false;
    let membershipInfo: { id: string; type: string; remainingVisits: number | null } | null = null;

    if (dto.useMembership !== false) {
      const coverageCheck = await this.membershipsService.isServiceCoveredByMembership(
        dto.userId,
        slot.serviceId,
      );
      
      if (coverageCheck.isCovered && coverageCheck.membership) {
        isMembership = true;
        membershipInfo = coverageCheck.membership;
      }
    }

    // Создаём бронь и увеличиваем счётчик
    const [booking] = await this.prisma.$transaction([
      this.prisma.booking.create({
        data: {
          userId: dto.userId,
          slotId: dto.slotId,
          comment: dto.comment,
          status: BookingStatus.PENDING,
          isMembership,
        },
        include: {
          slot: { include: { service: true } },
          user: true,
        },
      }),
      this.prisma.slot.update({
        where: { id: dto.slotId },
        data: { bookedCount: { increment: 1 } },
      }),
    ]);

    // Списываем визит, если абонемент по визитам
    if (isMembership && membershipInfo && membershipInfo.type === 'VISITS') {
      await this.membershipsService.decrementVisit(membershipInfo.id);
    }

    return { ...booking, isMembership };
  }

  /**
   * Получить записи пользователя (с флагом наличия отзыва)
   */
  async findByUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        slot: { include: { service: true } },
        feedback: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Создать отзыв после занятия (только для COMPLETED, один раз на бронирование)
   */
  async createFeedback(
    userId: string,
    dto: { bookingId: string; rating: number; comment?: string },
  ) {
    const { bookingId, rating, comment } = dto;

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Оценка должна быть от 1 до 5');
    }
    if (comment != null && comment.length > 1000) {
      throw new BadRequestException('Комментарий не более 1000 символов');
    }

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: { feedback: true },
    });

    if (!booking) {
      throw new BadRequestException('Запись не найдена');
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Отзыв можно оставить только после завершённого занятия');
    }
    if (booking.feedback) {
      throw new BadRequestException('Отзыв по этому занятию уже оставлен');
    }

    return this.prisma.sessionFeedback.create({
      data: {
        bookingId,
        rating,
        comment: comment?.trim() || null,
      },
    });
  }

  /**
   * Отменить запись (пользователем)
   */
  async cancelByUser(id: string, userId: string): Promise<Booking> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, userId },
    });

    if (!booking) {
      throw new BadRequestException('Запись не найдена');
    }

    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Эту запись нельзя отменить');
    }

    // Отменяем и уменьшаем счётчик
    const [updated] = await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id },
        data: { status: BookingStatus.CANCELLED_BY_USER },
      }),
      this.prisma.slot.update({
        where: { id: booking.slotId },
        data: { bookedCount: { decrement: 1 } },
      }),
    ]);

    return updated;
  }

  /**
   * Подтвердить запись (админом)
   */
  async confirm(id: string): Promise<Booking> {
    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CONFIRMED },
    });
  }

  /**
   * Отменить запись (админом)
   */
  async cancelByAdmin(id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new BadRequestException('Запись не найдена');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id },
        data: { status: BookingStatus.CANCELLED_BY_ADMIN },
      }),
      this.prisma.slot.update({
        where: { id: booking.slotId },
        data: { bookedCount: { decrement: 1 } },
      }),
    ]);

    // TODO: Уведомить пользователя об отмене

    return updated;
  }
}
