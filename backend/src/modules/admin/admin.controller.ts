import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController implements OnModuleInit {
  constructor(private adminService: AdminService) {}

  async onModuleInit() {
    // Create default admin user on startup
    await this.adminService.seedAdmin();
  }

  // Helper to verify admin token
  private async verifyAdmin(authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.replace('Bearer ', '');
    return this.adminService.verifyToken(token);
  }

  // ==================== AUTH ====================

  @Post('auth/login')
  async login(@Body() body: { email: string; password: string }) {
    return this.adminService.login(body.email, body.password);
  }

  @Get('auth/verify')
  async verify(@Headers('authorization') auth: string) {
    await this.verifyAdmin(auth);
    return { valid: true };
  }

  // ==================== STATS ====================

  @Get('stats/pending')
  async getPendingCounts(@Headers('authorization') auth: string) {
    await this.verifyAdmin(auth);
    return this.adminService.getPendingCounts();
  }

  @Get('stats/dashboard')
  async getDashboardStats(@Headers('authorization') auth: string) {
    await this.verifyAdmin(auth);
    return this.adminService.getDashboardStats();
  }

  // ==================== CATEGORIES ====================

  @Get('categories')
  async getCategories(@Headers('authorization') auth: string) {
    await this.verifyAdmin(auth);
    return this.adminService.getCategories();
  }

  @Post('categories')
  async createCategory(
    @Headers('authorization') auth: string,
    @Body() body: { slug: string; nameRu: string; nameUz?: string; icon?: string },
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.createCategory(body);
  }

  @Patch('categories/:id')
  async updateCategory(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: Partial<{ nameRu: string; nameUz: string; icon: string; isActive: boolean }>,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  async deleteCategory(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.deleteCategory(id);
  }

  // ==================== SERVICES ====================

  @Get('services')
  async getServices(@Headers('authorization') auth: string) {
    await this.verifyAdmin(auth);
    return this.adminService.getServices();
  }

  @Post('services')
  async createService(
    @Headers('authorization') auth: string,
    @Body() body: {
      categoryId: string;
      nameRu: string;
      nameUz?: string;
      descriptionRu?: string;
      price: number;
      duration?: number;
      capacity?: number;
    },
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.createService(body);
  }

  @Patch('services/:id')
  async updateService(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: Partial<{
      nameRu: string;
      nameUz: string;
      descriptionRu: string;
      price: number;
      duration: number;
      capacity: number;
      isActive: boolean;
    }>,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.updateService(id, body);
  }

  @Delete('services/:id')
  async deleteService(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.deleteService(id);
  }

  // ==================== SLOTS ====================

  @Get('slots')
  async getSlots(
    @Headers('authorization') auth: string,
    @Query('date') date?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.getSlots(date, serviceId);
  }

  @Post('slots')
  async createSlot(
    @Headers('authorization') auth: string,
    @Body() body: {
      serviceId: string;
      date: string;
      startTime: string;
      endTime: string;
      specialist?: string;
      capacity?: number;
    },
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.createSlot(body);
  }

  @Post('slots/bulk')
  async createBulkSlots(
    @Headers('authorization') auth: string,
    @Body() body: {
      serviceId: string;
      dates: string[];
      timeSlots: { startTime: string; endTime: string }[];
      specialist?: string;
      capacity?: number;
    },
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.createBulkSlots(body);
  }

  @Patch('slots/:id')
  async updateSlot(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: Partial<{ specialist: string; capacity: number; status: string }>,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.updateSlot(id, body);
  }

  @Delete('slots/:id')
  async deleteSlot(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.deleteSlot(id);
  }

  // ==================== BOOKINGS ====================

  @Get('bookings')
  async getBookings(
    @Headers('authorization') auth: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.getBookings(status, date);
  }

  @Patch('bookings/:id/status')
  async updateBookingStatus(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.updateBookingStatus(id, body.status);
  }

  // ==================== BAR ORDERS ====================

  @Get('orders')
  async getBarOrders(
    @Headers('authorization') auth: string,
    @Query('status') status?: string,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.getBarOrders(status);
  }

  @Patch('orders/:id/status')
  async updateBarOrderStatus(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.updateBarOrderStatus(id, body.status);
  }

  // ==================== BAR CATEGORIES ====================

  @Get('bar-categories')
  async getBarCategories(@Headers('authorization') auth: string) {
    await this.verifyAdmin(auth);
    return this.adminService.getBarCategories();
  }

  @Post('bar-categories')
  async createBarCategory(
    @Headers('authorization') auth: string,
    @Body() body: { slug: string; nameRu: string; nameUz?: string; icon?: string },
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.createBarCategory(body);
  }

  @Patch('bar-categories/:id')
  async updateBarCategory(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: Partial<{ nameRu: string; nameUz: string; icon: string; isActive: boolean }>,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.updateBarCategory(id, body);
  }

  @Delete('bar-categories/:id')
  async deleteBarCategory(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.deleteBarCategory(id);
  }

  // ==================== BAR ITEMS ====================

  @Get('bar-items')
  async getBarItems(@Headers('authorization') auth: string) {
    await this.verifyAdmin(auth);
    return this.adminService.getBarItems();
  }

  @Post('bar-items')
  async createBarItem(
    @Headers('authorization') auth: string,
    @Body() body: {
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
    },
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.createBarItem(body);
  }

  @Patch('bar-items/:id')
  async updateBarItem(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: Partial<{
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
    }>,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.updateBarItem(id, body);
  }

  @Delete('bar-items/:id')
  async deleteBarItem(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.deleteBarItem(id);
  }

  // ==================== CLIENTS ====================

  @Get('clients')
  async getClients(
    @Headers('authorization') auth: string,
    @Query('search') search?: string,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.getClients(search);
  }

  @Get('clients/:id')
  async getClientDetails(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.getClientDetails(id);
  }

  @Post('clients')
  async createClient(
    @Headers('authorization') auth: string,
    @Body() body: { firstName: string; lastName?: string; phone?: string },
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.createClient(body);
  }

  // ==================== BROADCAST ====================

  @Post('broadcast')
  async sendBroadcast(
    @Headers('authorization') auth: string,
    @Body() body: { message: string; userIds?: string[] },
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.sendBroadcast(body.message, body.userIds);
  }

  // ==================== MEMBERSHIP PLANS ====================

  @Get('membership-plans')
  async getMembershipPlans(@Headers('authorization') auth: string) {
    await this.verifyAdmin(auth);
    return this.adminService.getMembershipPlans();
  }

  @Post('membership-plans')
  async createMembershipPlan(
    @Headers('authorization') auth: string,
    @Body() body: {
      nameRu: string;
      nameUz?: string;
      type: string;
      durationDays: number;
      totalVisits?: number;
      maxFreezeDays?: number;
      price: number;
      serviceIds?: string[];
    },
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.createMembershipPlan(body);
  }

  @Patch('membership-plans/:id')
  async updateMembershipPlan(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: Partial<{
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
    await this.verifyAdmin(auth);
    return this.adminService.updateMembershipPlan(id, body);
  }

  @Delete('membership-plans/:id')
  async deleteMembershipPlan(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.deleteMembershipPlan(id);
  }

  // ==================== USER MEMBERSHIPS ====================

  @Get('user-memberships')
  async getUserMemberships(
    @Headers('authorization') auth: string,
    @Query('status') status?: string,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.getUserMemberships(status);
  }

  @Post('user-memberships')
  async assignMembership(
    @Headers('authorization') auth: string,
    @Body() body: {
      userId: string;
      planId: string;
      paymentType?: string;
    },
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.assignMembership(body);
  }

  @Patch('user-memberships/:id/status')
  async updateUserMembershipStatus(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.updateUserMembershipStatus(id, body.status);
  }

  @Post('user-memberships/:id/freeze')
  async freezeUserMembership(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.freezeUserMembership(id);
  }

  @Post('user-memberships/:id/unfreeze')
  async unfreezeUserMembership(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    await this.verifyAdmin(auth);
    return this.adminService.unfreezeUserMembership(id);
  }
}
