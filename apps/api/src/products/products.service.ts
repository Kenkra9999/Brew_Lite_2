import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../common/domain-error';
import { SIZE_SURCHARGE } from '../orders/pricing';
import { PrismaService } from '../prisma/prisma.service';

export interface ProductQuery {
  category?: string;
  search?: string;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /** FR-01: danh sách menu (id, tên, giá, ảnh, tồn kho). */
  async findAll(query: ProductQuery = {}) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        ...(query.category ? { category: query.category } : {}),
        ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
      },
      orderBy: [{ category: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true, description: true, category: true, price: true, imageUrl: true, stock: true },
    });
    return products.map((p) => ({ ...p, available: p.stock > 0 }));
  }

  /** FR-02: chi tiết sản phẩm kèm bảng giá size và topping. */
  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true },
      select: { id: true, name: true, description: true, category: true, price: true, imageUrl: true, stock: true },
    });
    if (!product) throw new NotFoundError('Product', id);
    const toppings = await this.findToppings();
    return {
      ...product,
      available: product.stock > 0,
      sizes: (Object.keys(SIZE_SURCHARGE) as (keyof typeof SIZE_SURCHARGE)[]).map((size) => ({
        size,
        surcharge: SIZE_SURCHARGE[size],
        price: product.price + SIZE_SURCHARGE[size],
      })),
      toppings,
    };
  }

  findToppings() {
    return this.prisma.topping.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true, name: true, price: true },
    });
  }
}
