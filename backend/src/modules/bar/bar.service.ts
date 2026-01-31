import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

// Статусы заказа (SQLite не поддерживает enum)
const BarOrderStatus = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

interface OrderItemDto {
  itemId: string;
  quantity: number;
}

@Injectable()
export class BarService {
  constructor(private prisma: PrismaService) {}

  /**
   * Получить категории бара
   */
  async getCategories(language = 'ru') {
    const categories = await this.prisma.barCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: this.getLocalizedField(cat, 'name', language),
      icon: cat.icon,
    }));
  }

  /**
   * Получить меню бара с категориями
   */
  async getMenu(language = 'ru') {
    const categories = await this.prisma.barCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: this.getLocalizedField(cat, 'name', language),
      icon: cat.icon,
      items: cat.items.map((item) => ({
        id: item.id,
        name: this.getLocalizedField(item, 'name', language),
        description: this.getLocalizedField(item, 'description', language),
        price: item.price,
        imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        volume: item.volume,
        calories: item.calories,
        proteins: item.proteins,
        fats: item.fats,
        carbs: item.carbs,
      })),
    }));
  }

  /**
   * Создать заказ
   */
  async createOrder(userId: string, items: OrderItemDto[]) {
    // Получаем информацию о товарах для расчёта суммы
    const itemIds = items.map((i) => i.itemId);
    const barItems = await this.prisma.barItem.findMany({
      where: { id: { in: itemIds } },
    });

    // Рассчитываем итог
    let total = 0;
    const orderItems = items.map((item) => {
      const barItem = barItems.find((bi) => bi.id === item.itemId);
      if (!barItem) throw new Error(`Item ${item.itemId} not found`);
      
      const itemTotal = barItem.price * item.quantity;
      total += itemTotal;
      
      return {
        itemId: item.itemId,
        quantity: item.quantity,
        price: barItem.price,
      };
    });

    // Создаём заказ
    return this.prisma.barOrder.create({
      data: {
        userId,
        status: BarOrderStatus.PENDING,
        total,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: { include: { item: true } },
      },
    });
  }

  /**
   * Получить заказы пользователя
   */
  async getUserOrders(userId: string) {
    return this.prisma.barOrder.findMany({
      where: { userId },
      include: {
        items: { include: { item: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private getLocalizedField(
    obj: Record<string, unknown>,
    field: string,
    language: string,
  ): string {
    const langSuffix = language.charAt(0).toUpperCase() + language.slice(1);
    const localizedKey = `${field}${langSuffix}`;
    
    if (obj[localizedKey]) {
      return obj[localizedKey] as string;
    }
    
    if (obj[`${field}Ru`]) {
      return obj[`${field}Ru`] as string;
    }
    
    return '';
  }
}
