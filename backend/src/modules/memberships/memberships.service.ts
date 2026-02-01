import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Получить все активные тарифы (для Mini App)
   */
  async getPlans(language = 'ru') {
    const plans = await this.prisma.membershipPlan.findMany({
      where: { isActive: true },
      include: {
        includedServices: {
          include: { service: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return plans.map((plan) => ({
      id: plan.id,
      name: language === 'uz' && plan.nameUz ? plan.nameUz : plan.nameRu,
      type: plan.type,
      durationDays: plan.durationDays,
      totalVisits: plan.totalVisits,
      price: plan.price,
      includedServices: plan.includedServices.map((ps) => ({
        id: ps.service.id,
        name: language === 'uz' && ps.service.nameUz ? ps.service.nameUz : ps.service.nameRu,
      })),
    }));
  }

  /**
   * Получить активный абонемент пользователя
   */
  async getUserActiveMembership(userId: string) {
    // Сначала проверим и обновим статусы истёкших абонементов
    await this.checkAndExpireMemberships(userId);

    const membership = await this.prisma.userMembership.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'FROZEN'] },
      },
      include: {
        plan: {
          include: {
            includedServices: {
              include: { service: true },
            },
          },
        },
        freezes: {
          where: { freezeEnd: null },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!membership) return null;

    return {
      id: membership.id,
      plan: {
        id: membership.plan.id,
        name: membership.plan.nameRu,
        type: membership.plan.type,
        durationDays: membership.plan.durationDays,
        totalVisits: membership.plan.totalVisits,
        maxFreezeDays: membership.plan.maxFreezeDays,
      },
      startDate: membership.startDate,
      endDate: membership.endDate,
      remainingVisits: membership.remainingVisits,
      usedFreezeDays: membership.usedFreezeDays,
      status: membership.status,
      isFrozen: membership.status === 'FROZEN',
      currentFreeze: membership.freezes[0] || null,
      includedServiceIds: membership.plan.includedServices.map((ps) => ps.serviceId),
    };
  }

  /**
   * Проверить и обновить истёкшие абонементы
   */
  private async checkAndExpireMemberships(userId: string) {
    const now = new Date();
    await this.prisma.userMembership.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });
  }

  /**
   * Заморозить абонемент
   */
  async freezeMembership(userId: string) {
    const membership = await this.prisma.userMembership.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
    });

    if (!membership) {
      throw new NotFoundException('Активный абонемент не найден');
    }

    // Проверка лимита заморозки
    if (membership.usedFreezeDays >= membership.plan.maxFreezeDays) {
      throw new BadRequestException(
        `Лимит заморозки исчерпан (${membership.plan.maxFreezeDays} дней)`,
      );
    }

    // Создаём запись о заморозке
    await this.prisma.membershipFreeze.create({
      data: {
        membershipId: membership.id,
        freezeStart: new Date(),
      },
    });

    // Обновляем статус абонемента
    await this.prisma.userMembership.update({
      where: { id: membership.id },
      data: { status: 'FROZEN' },
    });

    return { success: true, message: 'Абонемент заморожен' };
  }

  /**
   * Разморозить абонемент
   */
  async unfreezeMembership(userId: string) {
    const membership = await this.prisma.userMembership.findFirst({
      where: { userId, status: 'FROZEN' },
      include: {
        plan: true,
        freezes: {
          where: { freezeEnd: null },
          take: 1,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Замороженный абонемент не найден');
    }

    const activeFreeze = membership.freezes[0];
    if (!activeFreeze) {
      throw new BadRequestException('Активная заморозка не найдена');
    }

    const now = new Date();
    const freezeStart = new Date(activeFreeze.freezeStart);
    const daysFrozen = Math.ceil((now.getTime() - freezeStart.getTime()) / (1000 * 60 * 60 * 24));

    // Обновляем запись о заморозке
    await this.prisma.membershipFreeze.update({
      where: { id: activeFreeze.id },
      data: {
        freezeEnd: now,
        daysFrozen,
      },
    });

    // Продлеваем абонемент на количество дней заморозки
    const newEndDate = new Date(membership.endDate);
    newEndDate.setDate(newEndDate.getDate() + daysFrozen);

    // Обновляем абонемент
    await this.prisma.userMembership.update({
      where: { id: membership.id },
      data: {
        status: 'ACTIVE',
        endDate: newEndDate,
        usedFreezeDays: membership.usedFreezeDays + daysFrozen,
      },
    });

    return {
      success: true,
      message: `Абонемент разморожен. Продлён на ${daysFrozen} дней.`,
      daysFrozen,
      newEndDate,
    };
  }

  /**
   * Проверить, входит ли услуга в абонемент пользователя
   */
  async isServiceCoveredByMembership(userId: string, serviceId: string): Promise<{
    isCovered: boolean;
    membership: { id: string; type: string; remainingVisits: number | null } | null;
  }> {
    const membership = await this.getUserActiveMembership(userId);

    if (!membership || membership.status !== 'ACTIVE') {
      return { isCovered: false, membership: null };
    }

    const isCovered = membership.includedServiceIds.includes(serviceId);

    if (isCovered && membership.plan.type === 'VISITS' && (membership.remainingVisits || 0) <= 0) {
      return { isCovered: false, membership: null };
    }

    return {
      isCovered,
      membership: isCovered ? {
        id: membership.id,
        type: membership.plan.type,
        remainingVisits: membership.remainingVisits,
      } : null,
    };
  }

  /**
   * Покупка абонемента пользователем (Mini App)
   */
  async purchase(userId: string, planId: string, paymentType = 'OFFLINE') {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Тариф не найден');
    }

    if (!plan.isActive) {
      throw new BadRequestException('Тариф недоступен для покупки');
    }

    await this.checkAndExpireMemberships(userId);

    const existing = await this.prisma.userMembership.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'FROZEN'] },
      },
    });

    if (existing) {
      throw new BadRequestException('У вас уже есть активный абонемент');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const membership = await this.prisma.userMembership.create({
      data: {
        userId,
        planId: plan.id,
        startDate,
        endDate,
        remainingVisits: plan.type === 'VISITS' ? plan.totalVisits : null,
        paymentType,
      },
      include: {
        plan: {
          include: {
            includedServices: {
              include: { service: true },
            },
          },
        },
      },
    });

    return {
      id: membership.id,
      plan: {
        id: membership.plan.id,
        name: membership.plan.nameRu,
        type: membership.plan.type,
        durationDays: membership.plan.durationDays,
        totalVisits: membership.plan.totalVisits,
      },
      startDate: membership.startDate,
      endDate: membership.endDate,
      remainingVisits: membership.remainingVisits,
      status: membership.status,
    };
  }

  /**
   * Списать визит (для абонемента по визитам)
   */
  async decrementVisit(membershipId: string) {
    const membership = await this.prisma.userMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership || membership.remainingVisits === null || membership.remainingVisits <= 0) {
      throw new BadRequestException('Нет доступных визитов');
    }

    await this.prisma.userMembership.update({
      where: { id: membershipId },
      data: { remainingVisits: membership.remainingVisits - 1 },
    });
  }
}
