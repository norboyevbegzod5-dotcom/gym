import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Получить все категории услуг
   */
  async getCategories(language = 'ru') {
    const categories = await this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          where: { isActive: true },
        },
      },
    });

    // Возвращаем название на нужном языке
    return categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: this.getLocalizedField(cat, 'name', language),
      icon: cat.icon,
      servicesCount: cat.services.length,
    }));
  }

  /**
   * Получить услуги категории
   */
  async getServicesByCategory(categorySlug: string, language = 'ru') {
    const services = await this.prisma.service.findMany({
      where: {
        category: { slug: categorySlug },
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    return services.map((service) => ({
      id: service.id,
      name: this.getLocalizedField(service, 'name', language),
      description: this.getLocalizedField(service, 'description', language),
      price: service.price,
      durationMinutes: service.duration || 60,
      capacity: service.capacity,
    }));
  }

  /**
   * Получить доступные слоты для услуги
   */
  async getAvailableSlots(serviceId: string, date: Date) {
    // Нормализуем дату (убираем время)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const slots = await this.prisma.slot.findMany({
      where: {
        serviceId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'ACTIVE',
      },
      orderBy: { startTime: 'asc' },
    });

    // Фильтруем слоты где есть свободные места
    const availableSlots = slots.filter((slot) => slot.bookedCount < slot.capacity);

    return availableSlots.map((slot) => ({
      id: slot.id,
      date: slot.date.toISOString().split('T')[0],
      startTime: slot.startTime.toISOString().split('T')[1],
      endTime: slot.endTime.toISOString().split('T')[1],
      status: 'available',
      trainer: slot.specialist,
    }));
  }

  /**
   * Хелпер для получения локализованного поля
   */
  private getLocalizedField(
    obj: Record<string, unknown>,
    field: string,
    language: string,
  ): string {
    const langSuffix = language.charAt(0).toUpperCase() + language.slice(1);
    const localizedKey = `${field}${langSuffix}`;
    
    // Пробуем найти локализованное значение
    if (obj[localizedKey]) {
      return obj[localizedKey] as string;
    }
    
    // Fallback на русский
    if (obj[`${field}Ru`]) {
      return obj[`${field}Ru`] as string;
    }
    
    return '';
  }
}
