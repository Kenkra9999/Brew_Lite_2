import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('products')
  @ApiOperation({ summary: 'Danh sách đồ uống (menu)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('category') category?: string, @Query('search') search?: string) {
    return this.products.findAll({ category, search: search?.slice(0, 50) });
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Chi tiết một sản phẩm (kèm size và topping)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.products.findOne(id);
  }

  @Get('toppings')
  @ApiOperation({ summary: 'Danh sách topping' })
  toppings() {
    return this.products.findToppings();
  }
}
