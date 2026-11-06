import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrderStatus, Role } from '@prisma/client';
import type { AuthUser } from '../auth/auth.service';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đơn hàng (trạng thái PENDING)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lịch sử đơn của tôi' })
  mine(@CurrentUser() user: AuthUser) {
    return this.orders.findMine(user.id);
  }

  @Get()
  @Roles(Role.STAFF)
  @ApiOperation({ summary: '[STAFF] Danh sách đơn theo trạng thái' })
  @ApiQuery({ name: 'status', required: false, example: 'PAID,PREPARING,READY' })
  list(@Query('status') status?: string) {
    const valid = new Set<string>(Object.values(OrderStatus));
    const statuses = (status ?? '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s): s is OrderStatus => valid.has(s));
    return this.orders.listForStaff(statuses);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết đơn (chủ đơn hoặc nhân viên)' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.findOneFor(user, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Khách hủy đơn chưa thanh toán' })
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.cancelByCustomer(user.id, id);
  }

  @Patch(':id/status')
  @Roles(Role.STAFF)
  @ApiOperation({ summary: '[STAFF] Chuyển trạng thái đơn theo state machine' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatusByStaff(id, dto.status);
  }
}
