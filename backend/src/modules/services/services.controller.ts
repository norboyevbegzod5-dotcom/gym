import { Controller, Get, Param, Query } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get('categories')
  async getCategories(@Query('lang') lang = 'ru') {
    return this.servicesService.getCategories(lang);
  }

  @Get('category/:slug')
  async getByCategory(
    @Param('slug') slug: string,
    @Query('lang') lang = 'ru',
  ) {
    return this.servicesService.getServicesByCategory(slug, lang);
  }

  @Get(':id/slots')
  async getSlots(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.servicesService.getAvailableSlots(id, new Date(date));
  }
}
