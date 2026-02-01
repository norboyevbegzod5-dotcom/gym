import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TelegramService } from '../../telegram/telegram.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private telegramService: TelegramService,
  ) {}

  // ==================== AUTH ====================

  async login(email: string, password: string) {
    try {
      const admin = await this.prisma.adminUser.findUnique({
        where: { email: email?.trim?.() || email },
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const hash = admin.password;
      if (!hash || typeof hash !== 'string') {
        console.error('Admin user has invalid password hash');
        throw new UnauthorizedException('Invalid credentials');
      }

      const isValid = await bcrypt.compare(String(password || ''), hash);
      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const token = this.jwtService.sign({
        sub: admin.id,
        email: admin.email,
        role: admin.role,
      });

      return { token, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      console.error('Admin login error:', err);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return { valid: true, payload };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // ==================== STATS ====================

  async getPendingCounts() {
    const [pendingBookings, pendingOrders] = await Promise.all([
      this.prisma.booking.count({ where: { status: 'PENDING' } }),
      this.prisma.barOrder.count({ where: { status: 'PENDING' } }),
    ]);

    return { pendingBookings, pendingOrders };
  }

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      totalBookings,
      totalOrders,
      todayBookings,
      todayOrders,
      monthOrders,
      usersWithMembershipsRows,
      activeMembershipsCount,
      completedVisits,
      todayVisits,
      bookingsForServiceStats,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.booking.count(),
      this.prisma.barOrder.count(),
      this.prisma.booking.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      this.prisma.barOrder.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      this.prisma.barOrder.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: { total: true },
      }),
      // Число уникальных пользователей, у которых есть/был абонемент
      this.prisma.userMembership.groupBy({
        by: ['userId'],
      }),
      // Число активных абонементов (ACTIVE + FROZEN)
      this.prisma.userMembership.count({
        where: { status: { in: ['ACTIVE', 'FROZEN'] } },
      }),
      // Посещения (завершённые записи) — всего
      this.prisma.booking.count({
        where: { status: 'COMPLETED' },
      }),
      // Посещения сегодня
      this.prisma.booking.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfDay },
        },
      }),
      // Бронирования с услугой для группировки по названию
      this.prisma.booking.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: {
          slot: {
            select: {
              service: {
                select: { id: true, nameRu: true },
              },
            },
          },
        },
      }),
    ]);

    const revenue = monthOrders.reduce((sum, o) => sum + o.total, 0);
    const usersWithMemberships = usersWithMembershipsRows.length;

    // По названию услуг: количество записей за месяц
    const serviceCountMap = new Map<string, { name: string; count: number }>();
    for (const b of bookingsForServiceStats) {
      const serviceId = b.slot?.service?.id;
      const name = b.slot?.service?.nameRu ?? 'Без услуги';
      if (serviceId) {
        const existing = serviceCountMap.get(serviceId);
        if (existing) {
          existing.count += 1;
        } else {
          serviceCountMap.set(serviceId, { name, count: 1 });
        }
      }
    }
    const bookingsByService = Array.from(serviceCountMap.values())
      .sort((a, b) => b.count - a.count)
      .map(({ name, count }) => ({ serviceName: name, count }));

    // Записи по дням (последние 7 дней)
    const bookingsByDay = await this.getBookingsByDay(7);

    // Посещения по дням (последние 7 дней) — для графика посещаемости
    const visitsByDay = await this.getVisitsByDay(7);

    return {
      totalUsers,
      totalBookings,
      totalOrders,
      todayBookings,
      todayOrders,
      revenue,
      bookingsByDay,
      usersWithMemberships,
      activeMembershipsCount,
      completedVisits,
      todayVisits,
      bookingsByService,
      visitsByDay,
    };
  }

  private async getBookingsByDay(days: number) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await this.prisma.booking.count({
        where: {
          createdAt: { gte: date, lt: nextDay },
        },
      });

      result.push({
        date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        count,
      });
    }
    return result;
  }

  /** Посещения (COMPLETED) по дням */
  private async getVisitsByDay(days: number) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await this.prisma.booking.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: date, lt: nextDay },
        },
      });

      result.push({
        date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        count,
      });
    }
    return result;
  }

  // ==================== CATEGORIES ====================

  async getCategories() {
    return this.prisma.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(data: { slug: string; nameRu: string; nameUz?: string; icon?: string }) {
    return this.prisma.serviceCategory.create({ data });
  }

  async updateCategory(id: string, data: Partial<{ nameRu: string; nameUz: string; icon: string; isActive: boolean }>) {
    return this.prisma.serviceCategory.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.serviceCategory.delete({ where: { id } });
  }

  // ==================== SERVICES ====================

  async getServices() {
    return this.prisma.service.findMany({
      include: { category: true },
      orderBy: { nameRu: 'asc' },
    });
  }

  async createService(data: {
    categoryId: string;
    nameRu: string;
    nameUz?: string;
    descriptionRu?: string;
    price: number;
    duration?: number;
    capacity?: number;
  }) {
    return this.prisma.service.create({ data });
  }

  async updateService(id: string, data: Partial<{
    nameRu: string;
    nameUz: string;
    descriptionRu: string;
    price: number;
    duration: number;
    capacity: number;
    isActive: boolean;
  }>) {
    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async deleteService(id: string) {
    return this.prisma.service.delete({ where: { id } });
  }

  // ==================== SLOTS ====================

  async getSlots(date?: string, serviceId?: string) {
    const where: Record<string, unknown> = {};
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = { gte: startOfDay, lte: endOfDay };
    }
    
    if (serviceId) {
      where.serviceId = serviceId;
    }

    return this.prisma.slot.findMany({
      where,
      include: { service: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createSlot(data: {
    serviceId: string;
    date: string;
    startTime: string;
    endTime: string;
    specialist?: string;
    capacity?: number;
  }) {
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);
    
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(startHour, startMin, 0, 0);
    
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    const endTime = new Date(date);
    endTime.setHours(endHour, endMin, 0, 0);

    return this.prisma.slot.create({
      data: {
        serviceId: data.serviceId,
        date,
        startTime,
        endTime,
        specialist: data.specialist,
        capacity: data.capacity || 1,
      },
    });
  }

  async createBulkSlots(data: {
    serviceId: string;
    dates: string[];
    timeSlots: { startTime: string; endTime: string }[];
    specialist?: string;
    capacity?: number;
  }) {
    const slots = [];
    
    for (const dateStr of data.dates) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      
      for (const timeSlot of data.timeSlots) {
        const [startHour, startMin] = timeSlot.startTime.split(':').map(Number);
        const startTime = new Date(date);
        startTime.setHours(startHour, startMin, 0, 0);
        
        const [endHour, endMin] = timeSlot.endTime.split(':').map(Number);
        const endTime = new Date(date);
        endTime.setHours(endHour, endMin, 0, 0);
        
        slots.push({
          serviceId: data.serviceId,
          date,
          startTime,
          endTime,
          specialist: data.specialist || null,
          capacity: data.capacity || 1,
        });
      }
    }
    
    const result = await this.prisma.slot.createMany({
      data: slots,
    });
    
    return { created: result.count };
  }

  async updateSlot(id: string, data: Partial<{ specialist: string; capacity: number; status: string }>) {
    return this.prisma.slot.update({
      where: { id },
      data,
    });
  }

  async deleteSlot(id: string) {
    return this.prisma.slot.delete({ where: { id } });
  }

  // ==================== BOOKINGS ====================

  async getBookings(status?: string, date?: string) {
    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        user: true,
        slot: {
          include: { service: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBookingStatus(id: string, status: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status },
    });
  }

  // ==================== FEEDBACKS (ОТЗЫВЫ) ====================

  async getFeedbacks() {
    return this.prisma.sessionFeedback.findMany({
      include: {
        booking: {
          include: {
            user: true,
            slot: { include: { service: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== BAR ORDERS ====================

  async getBarOrders(status?: string) {
    const where = status ? { status } : {};

    return this.prisma.barOrder.findMany({
      where,
      include: {
        user: true,
        items: {
          include: { item: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBarOrderStatus(id: string, status: string) {
    const order = await this.prisma.barOrder.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.barOrder.update({
      where: { id },
      data: { status },
    });
  }

  // ==================== BAR CATEGORIES ====================

  async getBarCategories() {
    return this.prisma.barCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createBarCategory(data: {
    slug: string;
    nameRu: string;
    nameUz?: string;
    icon?: string;
  }) {
    return this.prisma.barCategory.create({ data });
  }

  async updateBarCategory(id: string, data: Partial<{
    nameRu: string;
    nameUz: string;
    icon: string;
    isActive: boolean;
    sortOrder: number;
  }>) {
    return this.prisma.barCategory.update({
      where: { id },
      data,
    });
  }

  async deleteBarCategory(id: string) {
    return this.prisma.barCategory.delete({ where: { id } });
  }

  // ==================== BAR ITEMS ====================

  async getBarItems() {
    return this.prisma.barItem.findMany({
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
  }

  async createBarItem(data: {
    categoryId: string;
    nameRu: string;
    nameUz?: string;
    descriptionRu?: string;
    descriptionUz?: string;
    price: number;
    imageUrl?: string;
    volume?: string;
    calories?: number;
    proteins?: number;
    fats?: number;
    carbs?: number;
  }) {
    return this.prisma.barItem.create({ 
      data,
      include: { category: true },
    });
  }

  async updateBarItem(id: string, data: Partial<{
    categoryId: string;
    nameRu: string;
    nameUz: string;
    descriptionRu: string;
    descriptionUz: string;
    price: number;
    imageUrl: string;
    volume: string;
    calories: number;
    proteins: number;
    fats: number;
    carbs: number;
    isAvailable: boolean;
    sortOrder: number;
  }>) {
    return this.prisma.barItem.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async deleteBarItem(id: string) {
    return this.prisma.barItem.delete({ where: { id } });
  }

  // ==================== CLIENTS ====================

  async getClients(search?: string) {
    const where = search ? {
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { username: { contains: search } },
        { phone: { contains: search } },
      ],
    } : {};

    const clients = await this.prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            bookings: true,
            barOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clients.map(client => ({
      id: client.id,
      telegramId: client.telegramId,
      firstName: client.firstName,
      lastName: client.lastName,
      username: client.username,
      phone: client.phone,
      language: client.language,
      createdAt: client.createdAt,
      bookingsCount: client._count.bookings,
      ordersCount: client._count.barOrders,
    }));
  }

  async getClientDetails(id: string) {
    const client = await this.prisma.user.findUnique({
      where: { id },
      include: {
        bookings: {
          include: { slot: { include: { service: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        barOrders: {
          include: { items: { include: { item: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  /** Создать клиента вручную (без Telegram). telegramId = manual-{uuid} */
  async createClient(data: {
    firstName: string;
    lastName?: string;
    phone?: string;
  }) {
    const { randomUUID } = await import('crypto');
    const telegramId = `manual-${randomUUID()}`;

    return this.prisma.user.create({
      data: {
        telegramId,
        firstName: data.firstName,
        lastName: data.lastName ?? null,
        phone: data.phone ?? null,
        language: 'ru',
      },
    });
  }

  /** Нормализовать телефон (только цифры) */
  private normalizePhone(phone: string | null): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    return digits.length > 0 ? digits : null;
  }

  /**
   * Объединить дубликаты по номеру телефона: один номер — один клиент.
   * Оставляем пользователя с «настоящим» telegramId (не phone-xxx), переносим на него записи и заказы, остальных удаляем.
   */
  async mergeDuplicatePhones(): Promise<{ merged: number; mergedPhones: string[] }> {
    const users = await this.prisma.user.findMany({
      where: { phone: { not: null } },
      include: {
        _count: { select: { bookings: true, barOrders: true, memberships: true } },
      },
    });

    const byPhone = new Map<string, typeof users>();
    for (const u of users) {
      const normalized = this.normalizePhone(u.phone);
      if (!normalized) continue;
      if (!byPhone.has(normalized)) byPhone.set(normalized, []);
      byPhone.get(normalized)!.push(u);
    }

    let merged = 0;
    const mergedPhones: string[] = [];

    for (const [phone, group] of byPhone) {
      if (group.length < 2) continue;

      // Оставляем того, у кого telegramId не "phone-..." (предпочтительно «настоящий» пользователь Telegram)
      const sorted = [...group].sort((a, b) => {
        const aIsPhone = a.telegramId.startsWith('phone-') ? 1 : 0;
        const bIsPhone = b.telegramId.startsWith('phone-') ? 1 : 0;
        if (aIsPhone !== bIsPhone) return aIsPhone - bIsPhone;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      const keep = sorted[0];
      const toRemove = sorted.slice(1);

      for (const dup of toRemove) {
        await this.prisma.booking.updateMany({ where: { userId: dup.id }, data: { userId: keep.id } });
        await this.prisma.barOrder.updateMany({ where: { userId: dup.id }, data: { userId: keep.id } });
        await this.prisma.userMembership.updateMany({ where: { userId: dup.id }, data: { userId: keep.id } });
        await this.prisma.user.delete({ where: { id: dup.id } });
        merged++;
      }

      if (toRemove.length > 0) {
        mergedPhones.push(phone);
        if (!keep.phone || this.normalizePhone(keep.phone) !== phone) {
          await this.prisma.user.update({
            where: { id: keep.id },
            data: { phone: phone },
          });
        }
      }
    }

    return { merged, mergedPhones };
  }

  // ==================== BROADCAST ====================

  async sendBroadcast(message: string, userIds?: string[]) {
    let users;
    
    if (userIds && userIds.length > 0) {
      // Send to specific users
      users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { telegramId: true, firstName: true },
      });
    } else {
      // Send to all users
      users = await this.prisma.user.findMany({
        select: { telegramId: true, firstName: true },
      });
    }

    const results = { sent: 0, failed: 0 };

    for (const user of users) {
      // Пропускаем клиентов, добавленных вручную (без Telegram)
      if (user.telegramId.startsWith('manual-')) {
        continue;
      }
      try {
        await this.telegramService.sendMessage(user.telegramId, message);
        results.sent++;
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error(`Failed to send message to ${user.telegramId}:`, error);
        results.failed++;
      }
    }

    return results;
  }

  // ==================== MEMBERSHIP PLANS ====================

  async getMembershipPlans() {
    return this.prisma.membershipPlan.findMany({
      include: {
        includedServices: {
          include: { service: true },
        },
        _count: {
          select: { userMemberships: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createMembershipPlan(data: {
    nameRu: string;
    nameUz?: string;
    type: string;
    durationDays: number;
    totalVisits?: number;
    maxFreezeDays?: number;
    price: number;
    serviceIds?: string[];
  }) {
    const { serviceIds, ...planData } = data;

    const plan = await this.prisma.membershipPlan.create({
      data: planData,
    });

    // Add services if provided
    if (serviceIds && serviceIds.length > 0) {
      await this.prisma.planService.createMany({
        data: serviceIds.map((serviceId) => ({
          planId: plan.id,
          serviceId,
        })),
      });
    }

    return this.getMembershipPlanById(plan.id);
  }

  async getMembershipPlanById(id: string) {
    return this.prisma.membershipPlan.findUnique({
      where: { id },
      include: {
        includedServices: {
          include: { service: true },
        },
      },
    });
  }

  async updateMembershipPlan(
    id: string,
    data: Partial<{
      nameRu: string;
      nameUz: string;
      type: string;
      durationDays: number;
      totalVisits: number;
      maxFreezeDays: number;
      price: number;
      isActive: boolean;
      sortOrder: number;
      serviceIds: string[];
    }>,
  ) {
    const { serviceIds, ...planData } = data;

    // Update plan data
    await this.prisma.membershipPlan.update({
      where: { id },
      data: planData,
    });

    // Update services if provided
    if (serviceIds !== undefined) {
      // Remove existing services
      await this.prisma.planService.deleteMany({
        where: { planId: id },
      });

      // Add new services
      if (serviceIds.length > 0) {
        await this.prisma.planService.createMany({
          data: serviceIds.map((serviceId) => ({
            planId: id,
            serviceId,
          })),
        });
      }
    }

    return this.getMembershipPlanById(id);
  }

  async deleteMembershipPlan(id: string) {
    return this.prisma.membershipPlan.delete({ where: { id } });
  }

  // ==================== USER MEMBERSHIPS ====================

  async getUserMemberships(status?: string) {
    const where = status ? { status } : {};

    return this.prisma.userMembership.findMany({
      where,
      include: {
        user: true,
        plan: true,
        freezes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignMembership(data: {
    userId: string;
    planId: string;
    paymentType?: string;
  }) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: data.planId },
    });

    if (!plan) {
      throw new NotFoundException('Тариф не найден');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    return this.prisma.userMembership.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        startDate,
        endDate,
        remainingVisits: plan.type === 'VISITS' ? plan.totalVisits : null,
        paymentType: data.paymentType || 'OFFLINE',
      },
      include: {
        user: true,
        plan: true,
      },
    });
  }

  async updateUserMembershipStatus(id: string, status: string) {
    return this.prisma.userMembership.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        plan: true,
      },
    });
  }

  async freezeUserMembership(id: string) {
    const membership = await this.prisma.userMembership.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new NotFoundException('Активный абонемент не найден');
    }

    if (membership.usedFreezeDays >= membership.plan.maxFreezeDays) {
      throw new NotFoundException('Лимит заморозки исчерпан');
    }

    await this.prisma.membershipFreeze.create({
      data: {
        membershipId: id,
        freezeStart: new Date(),
      },
    });

    return this.prisma.userMembership.update({
      where: { id },
      data: { status: 'FROZEN' },
      include: { user: true, plan: true },
    });
  }

  async unfreezeUserMembership(id: string) {
    const membership = await this.prisma.userMembership.findUnique({
      where: { id },
      include: {
        plan: true,
        freezes: {
          where: { freezeEnd: null },
          take: 1,
        },
      },
    });

    if (!membership || membership.status !== 'FROZEN') {
      throw new NotFoundException('Замороженный абонемент не найден');
    }

    const activeFreeze = membership.freezes[0];
    if (!activeFreeze) {
      throw new NotFoundException('Активная заморозка не найдена');
    }

    const now = new Date();
    const freezeStart = new Date(activeFreeze.freezeStart);
    const daysFrozen = Math.ceil((now.getTime() - freezeStart.getTime()) / (1000 * 60 * 60 * 24));

    await this.prisma.membershipFreeze.update({
      where: { id: activeFreeze.id },
      data: {
        freezeEnd: now,
        daysFrozen,
      },
    });

    const newEndDate = new Date(membership.endDate);
    newEndDate.setDate(newEndDate.getDate() + daysFrozen);

    return this.prisma.userMembership.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        endDate: newEndDate,
        usedFreezeDays: membership.usedFreezeDays + daysFrozen,
      },
      include: { user: true, plan: true },
    });
  }

  // ==================== SEED ADMIN ====================

  async seedAdmin() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await this.prisma.adminUser.upsert({
      where: { email: 'admin@centrisfit.com' },
      create: {
        email: 'admin@centrisfit.com',
        password: hashedPassword,
        name: 'Administrator',
        role: 'SUPER_ADMIN',
      },
      update: {
        password: hashedPassword,
        name: 'Administrator',
        isActive: true,
      },
    });
    console.log('✅ Admin: admin@centrisfit.com / admin123');
  }
}
