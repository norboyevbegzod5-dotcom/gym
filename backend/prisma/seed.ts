import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Категории услуг
  const categories = await Promise.all([
    prisma.serviceCategory.upsert({
      where: { slug: 'membership' },
      update: {},
      create: {
        slug: 'membership',
        nameRu: 'Абонементы',
        nameUz: 'Abonementlar',
        icon: '💳',
        sortOrder: 1,
      },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'group' },
      update: {},
      create: {
        slug: 'group',
        nameRu: 'Групповые занятия',
        nameUz: "Guruh mashg'ulotlari",
        icon: '👥',
        sortOrder: 2,
      },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'personal' },
      update: {},
      create: {
        slug: 'personal',
        nameRu: 'Персональные тренировки',
        nameUz: "Shaxsiy mashg'ulotlar",
        icon: '🏃',
        sortOrder: 3,
      },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'massage' },
      update: {},
      create: {
        slug: 'massage',
        nameRu: 'Массаж',
        nameUz: 'Massaj',
        icon: '💆',
        sortOrder: 4,
      },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'sauna' },
      update: {},
      create: {
        slug: 'sauna',
        nameRu: 'Сауна',
        nameUz: 'Sauna',
        icon: '🧖',
        sortOrder: 5,
      },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'solarium' },
      update: {},
      create: {
        slug: 'solarium',
        nameRu: 'Солярий',
        nameUz: 'Solyariy',
        icon: '☀️',
        sortOrder: 6,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Услуги (создаём только если ещё нет)
  const membership = categories.find(c => c.slug === 'membership')!;
  const group = categories.find(c => c.slug === 'group')!;
  const personal = categories.find(c => c.slug === 'personal')!;
  const massage = categories.find(c => c.slug === 'massage')!;
  const sauna = categories.find(c => c.slug === 'sauna')!;

  const existingServicesCount = await prisma.service.count();
  const services = existingServicesCount > 0
    ? await prisma.service.findMany({ include: { category: true } })
    : await Promise.all([
    // Абонементы
    prisma.service.create({
      data: {
        categoryId: membership.id,
        nameRu: 'Месячный абонемент',
        nameUz: 'Oylik abonement',
        descriptionRu: 'Безлимитное посещение зала в течение месяца',
        descriptionUz: "Bir oy davomida zalga cheksiz tashrif",
        price: 500000,
        duration: 30 * 24 * 60, // 30 дней в минутах
      },
    }),
    prisma.service.create({
      data: {
        categoryId: membership.id,
        nameRu: 'Годовой абонемент',
        nameUz: 'Yillik abonement',
        descriptionRu: 'Безлимитное посещение на год со скидкой',
        descriptionUz: "Chegirma bilan bir yillik cheksiz tashrif",
        price: 4500000,
        duration: 365 * 24 * 60,
      },
    }),
    // Групповые
    prisma.service.create({
      data: {
        categoryId: group.id,
        nameRu: 'Йога',
        nameUz: 'Yoga',
        descriptionRu: 'Групповое занятие йогой, 60 минут',
        descriptionUz: "Guruhiy yoga mashg'uloti, 60 daqiqa",
        price: 50000,
        duration: 60,
        capacity: 15,
      },
    }),
    prisma.service.create({
      data: {
        categoryId: group.id,
        nameRu: 'Аэробика',
        nameUz: 'Aerobika',
        descriptionRu: 'Кардио-тренировка под музыку',
        descriptionUz: "Musiqa ostida kardio mashg'ulot",
        price: 45000,
        duration: 45,
        capacity: 20,
      },
    }),
    // Персональные
    prisma.service.create({
      data: {
        categoryId: personal.id,
        nameRu: 'Персональная тренировка',
        nameUz: "Shaxsiy mashg'ulot",
        descriptionRu: 'Индивидуальное занятие с тренером',
        descriptionUz: "Murabbiy bilan yakka mashg'ulot",
        price: 150000,
        duration: 60,
        capacity: 1,
      },
    }),
    // Массаж
    prisma.service.create({
      data: {
        categoryId: massage.id,
        nameRu: 'Классический массаж',
        nameUz: 'Klassik massaj',
        descriptionRu: 'Расслабляющий массаж всего тела',
        descriptionUz: "Butun tana uchun dam olish massaji",
        price: 200000,
        duration: 60,
        capacity: 1,
      },
    }),
    prisma.service.create({
      data: {
        categoryId: massage.id,
        nameRu: 'Спортивный массаж',
        nameUz: 'Sport massaji',
        descriptionRu: 'Восстановление после тренировок',
        descriptionUz: "Mashg'ulotlardan keyin tiklanish",
        price: 250000,
        duration: 45,
        capacity: 1,
      },
    }),
    // Сауна
    prisma.service.create({
      data: {
        categoryId: sauna.id,
        nameRu: 'Сауна (1 час)',
        nameUz: 'Sauna (1 soat)',
        descriptionRu: 'Финская сауна на 1 час',
        descriptionUz: "1 soatlik fin saunasi",
        price: 100000,
        duration: 60,
        capacity: 6,
      },
    }),
  ]);

  console.log(existingServicesCount > 0 ? `✅ Services already exist (${services.length})` : `✅ Created ${services.length} services`);

  // Категории бара
  const barCategories = await Promise.all([
    prisma.barCategory.upsert({
      where: { slug: 'protein' },
      update: {},
      create: {
        slug: 'protein',
        nameRu: 'Протеин',
        nameUz: 'Protein',
        icon: '💪',
        sortOrder: 1,
      },
    }),
    prisma.barCategory.upsert({
      where: { slug: 'smoothies' },
      update: {},
      create: {
        slug: 'smoothies',
        nameRu: 'Смузи',
        nameUz: 'Smuzi',
        icon: '🥤',
        sortOrder: 2,
      },
    }),
    prisma.barCategory.upsert({
      where: { slug: 'drinks' },
      update: {},
      create: {
        slug: 'drinks',
        nameRu: 'Напитки',
        nameUz: 'Ichimliklar',
        icon: '🧃',
        sortOrder: 3,
      },
    }),
    prisma.barCategory.upsert({
      where: { slug: 'snacks' },
      update: {},
      create: {
        slug: 'snacks',
        nameRu: 'Снэки',
        nameUz: 'Gazaklar',
        icon: '🍫',
        sortOrder: 4,
      },
    }),
  ]);

  console.log(`✅ Created ${barCategories.length} bar categories`);

  const proteinCat = barCategories.find(c => c.slug === 'protein')!;
  const smoothiesCat = barCategories.find(c => c.slug === 'smoothies')!;
  const drinksCat = barCategories.find(c => c.slug === 'drinks')!;
  const snacksCat = barCategories.find(c => c.slug === 'snacks')!;

  const existingBarItemsCount = await prisma.barItem.count();
  const barItems = existingBarItemsCount > 0
    ? await prisma.barItem.findMany()
    : await Promise.all([
    // Протеин
    prisma.barItem.create({
      data: {
        categoryId: proteinCat.id,
        nameRu: 'Протеиновый коктейль Шоколад',
        nameUz: 'Shokoladli protein kokteyli',
        descriptionRu: 'Сывороточный протеин с молоком',
        price: 35000,
        volume: '400 мл',
        calories: 280,
        proteins: 30,
        fats: 5,
        carbs: 25,
        imageUrl: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=400',
        sortOrder: 1,
      },
    }),
    prisma.barItem.create({
      data: {
        categoryId: proteinCat.id,
        nameRu: 'Протеиновый коктейль Ваниль',
        nameUz: 'Vanilli protein kokteyli',
        descriptionRu: 'Нежный ванильный вкус',
        price: 35000,
        volume: '400 мл',
        calories: 270,
        proteins: 28,
        fats: 4,
        carbs: 28,
        imageUrl: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400',
        sortOrder: 2,
      },
    }),
    prisma.barItem.create({
      data: {
        categoryId: proteinCat.id,
        nameRu: 'Гейнер',
        nameUz: 'Geyner',
        descriptionRu: 'Для набора массы',
        price: 40000,
        volume: '500 мл',
        calories: 450,
        proteins: 25,
        fats: 8,
        carbs: 65,
        imageUrl: 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?w=400',
        sortOrder: 3,
      },
    }),
    // Смузи
    prisma.barItem.create({
      data: {
        categoryId: smoothiesCat.id,
        nameRu: 'Смузи Тропический',
        nameUz: 'Tropik smuzi',
        descriptionRu: 'Манго, ананас, банан',
        price: 42000,
        volume: '350 мл',
        calories: 180,
        proteins: 3,
        fats: 1,
        carbs: 40,
        imageUrl: 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=400',
        sortOrder: 1,
      },
    }),
    prisma.barItem.create({
      data: {
        categoryId: smoothiesCat.id,
        nameRu: 'Смузи Ягодный',
        nameUz: "Rezavorli smuzi",
        descriptionRu: 'Клубника, черника, малина',
        price: 40000,
        volume: '350 мл',
        calories: 150,
        proteins: 2,
        fats: 0.5,
        carbs: 35,
        imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400',
        sortOrder: 2,
      },
    }),
    prisma.barItem.create({
      data: {
        categoryId: smoothiesCat.id,
        nameRu: 'Зелёный смузи',
        nameUz: "Yashil smuzi",
        descriptionRu: 'Шпинат, яблоко, огурец, имбирь',
        price: 38000,
        volume: '350 мл',
        calories: 120,
        proteins: 4,
        fats: 0.5,
        carbs: 25,
        imageUrl: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400',
        sortOrder: 3,
      },
    }),
    // Напитки
    prisma.barItem.create({
      data: {
        categoryId: drinksCat.id,
        nameRu: 'Вода минеральная',
        nameUz: 'Mineral suv',
        price: 5000,
        volume: '500 мл',
        calories: 0,
        proteins: 0,
        fats: 0,
        carbs: 0,
        imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
        sortOrder: 1,
      },
    }),
    prisma.barItem.create({
      data: {
        categoryId: drinksCat.id,
        nameRu: 'Изотоник',
        nameUz: 'Izotonik',
        descriptionRu: 'Восстановление электролитов',
        price: 20000,
        volume: '500 мл',
        calories: 80,
        proteins: 0,
        fats: 0,
        carbs: 20,
        imageUrl: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400',
        sortOrder: 2,
      },
    }),
    prisma.barItem.create({
      data: {
        categoryId: drinksCat.id,
        nameRu: 'BCAA напиток',
        nameUz: 'BCAA ichimlik',
        descriptionRu: 'Аминокислоты для восстановления',
        price: 25000,
        volume: '400 мл',
        calories: 15,
        proteins: 5,
        fats: 0,
        carbs: 2,
        imageUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400',
        sortOrder: 3,
      },
    }),
    prisma.barItem.create({
      data: {
        categoryId: drinksCat.id,
        nameRu: 'Энергетик без сахара',
        nameUz: "Shakarsiz energetik",
        descriptionRu: 'Кофеин + таурин',
        price: 18000,
        volume: '250 мл',
        calories: 10,
        proteins: 0,
        fats: 0,
        carbs: 2,
        imageUrl: 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=400',
        sortOrder: 4,
      },
    }),
    // Снэки
    prisma.barItem.create({
      data: {
        categoryId: snacksCat.id,
        nameRu: 'Протеиновый батончик',
        nameUz: 'Protein batonchik',
        descriptionRu: 'Высокобелковый перекус',
        price: 18000,
        volume: '60 г',
        calories: 220,
        proteins: 20,
        fats: 8,
        carbs: 18,
        imageUrl: 'https://images.unsplash.com/photo-1622484211148-c9b5e4ff5a77?w=400',
        sortOrder: 1,
      },
    }),
    prisma.barItem.create({
      data: {
        categoryId: snacksCat.id,
        nameRu: 'Энергетический батончик',
        nameUz: 'Energetik batonchik',
        descriptionRu: 'Орехи, мёд, сухофрукты',
        price: 15000,
        volume: '50 г',
        calories: 200,
        proteins: 5,
        fats: 10,
        carbs: 25,
        imageUrl: 'https://images.unsplash.com/photo-1558160074-4d7d8067fb0d?w=400',
        sortOrder: 2,
      },
    }),
    prisma.barItem.create({
      data: {
        categoryId: snacksCat.id,
        nameRu: 'Банан',
        nameUz: 'Banan',
        price: 5000,
        volume: '1 шт',
        calories: 105,
        proteins: 1.3,
        fats: 0.4,
        carbs: 27,
        imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
        sortOrder: 3,
      },
    }),
    prisma.barItem.create({
      data: {
        categoryId: snacksCat.id,
        nameRu: 'Орехи микс',
        nameUz: "Aralash yong'oq",
        descriptionRu: 'Миндаль, кешью, грецкий',
        price: 20000,
        volume: '100 г',
        calories: 580,
        proteins: 18,
        fats: 52,
        carbs: 15,
        imageUrl: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400',
        sortOrder: 4,
      },
    }),
  ]);

  console.log(existingBarItemsCount > 0 ? `✅ Bar items already exist (${barItems.length})` : `✅ Created ${barItems.length} bar items`);

  // Слоты на ближайшие дни (создаём только если ещё нет на ближайшую неделю)
  const yoga = services.find((s: { nameRu: string }) => s.nameRu === 'Йога')!;
  const aerobics = services.find((s: { nameRu: string }) => s.nameRu === 'Аэробика')!;
  const personalTraining = services.find((s: { nameRu: string }) => s.nameRu === 'Персональная тренировка')!;
  const classicMassage = services.find((s: { nameRu: string }) => s.nameRu === 'Классический массаж')!;
  const sportMassage = services.find((s: { nameRu: string }) => s.nameRu === 'Спортивный массаж')!;
  const saunaService = services.find((s: { nameRu: string }) => s.nameRu === 'Сауна (1 час)')!;

  const today = new Date();
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const existingSlotsCount = await prisma.slot.count({
    where: { date: { gte: today, lte: weekFromNow } },
  });

  if (existingSlotsCount > 0) {
    console.log(`✅ Slots already exist for next 7 days (${existingSlotsCount}), skipping`);
  } else {
  const slots = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    // Йога в 9:00 и 18:00
    slots.push(
      prisma.slot.create({
        data: {
          serviceId: yoga.id,
          date: date,
          startTime: new Date(date.getTime() + 9 * 60 * 60 * 1000),
          endTime: new Date(date.getTime() + 10 * 60 * 60 * 1000),
          specialist: 'Анна',
          capacity: 15,
        },
      }),
      prisma.slot.create({
        data: {
          serviceId: yoga.id,
          date: date,
          startTime: new Date(date.getTime() + 18 * 60 * 60 * 1000),
          endTime: new Date(date.getTime() + 19 * 60 * 60 * 1000),
          specialist: 'Мария',
          capacity: 15,
        },
      }),
    );

    // Аэробика в 10:00 и 19:00
    slots.push(
      prisma.slot.create({
        data: {
          serviceId: aerobics.id,
          date: date,
          startTime: new Date(date.getTime() + 10 * 60 * 60 * 1000),
          endTime: new Date(date.getTime() + 10 * 60 * 60 * 1000 + 45 * 60 * 1000),
          specialist: 'Елена',
          capacity: 20,
        },
      }),
      prisma.slot.create({
        data: {
          serviceId: aerobics.id,
          date: date,
          startTime: new Date(date.getTime() + 19 * 60 * 60 * 1000),
          endTime: new Date(date.getTime() + 19 * 60 * 60 * 1000 + 45 * 60 * 1000),
          specialist: 'Ольга',
          capacity: 20,
        },
      }),
    );

    // Персональные тренировки — много слотов с разными тренерами
    const personalTrainers = ['Алексей', 'Дмитрий', 'Иван'];
    const personalHours = [8, 10, 12, 14, 16, 18, 20];
    
    for (const hour of personalHours) {
      const trainer = personalTrainers[hour % personalTrainers.length];
      slots.push(
        prisma.slot.create({
          data: {
            serviceId: personalTraining.id,
            date: date,
            startTime: new Date(date.getTime() + hour * 60 * 60 * 1000),
            endTime: new Date(date.getTime() + (hour + 1) * 60 * 60 * 1000),
            specialist: trainer,
            capacity: 1,
          },
        }),
      );
    }

    // Массаж классический — 10:00, 12:00, 14:00, 16:00
    const massageHours = [10, 12, 14, 16];
    for (const hour of massageHours) {
      slots.push(
        prisma.slot.create({
          data: {
            serviceId: classicMassage.id,
            date: date,
            startTime: new Date(date.getTime() + hour * 60 * 60 * 1000),
            endTime: new Date(date.getTime() + (hour + 1) * 60 * 60 * 1000),
            specialist: 'Светлана',
            capacity: 1,
          },
        }),
      );
    }

    // Массаж спортивный — 11:00, 13:00, 15:00, 17:00
    const sportMassageHours = [11, 13, 15, 17];
    for (const hour of sportMassageHours) {
      slots.push(
        prisma.slot.create({
          data: {
            serviceId: sportMassage.id,
            date: date,
            startTime: new Date(date.getTime() + hour * 60 * 60 * 1000),
            endTime: new Date(date.getTime() + hour * 60 * 60 * 1000 + 45 * 60 * 1000),
            specialist: 'Андрей',
            capacity: 1,
          },
        }),
      );
    }

    // Сауна — каждый час с 10:00 до 21:00
    for (let hour = 10; hour <= 21; hour++) {
      slots.push(
        prisma.slot.create({
          data: {
            serviceId: saunaService.id,
            date: date,
            startTime: new Date(date.getTime() + hour * 60 * 60 * 1000),
            endTime: new Date(date.getTime() + (hour + 1) * 60 * 60 * 1000),
            capacity: 6,
          },
        }),
      );
    }
  }

  await Promise.all(slots);
  console.log(`✅ Created ${slots.length} time slots for next 7 days`);
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
