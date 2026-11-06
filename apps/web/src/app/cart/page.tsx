"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart, cartTotal } from "@/lib/cart";
import { useReady } from "@/lib/hooks";
import { money } from "@/lib/types";
import { Loading } from "@/components/shell";
export default function Cart() {
  const { items, quantity, remove } = useCart();
  const ready = useReady();
  if (!ready) return <Loading />;
  return (
    <div className="page narrow">
      <span className="eyebrow muted">MỘT CHÚT NGON LÀNH ĐANG CHỜ</span>
      <h1>Giỏ hàng của bạn</h1>
      {!items.length ? (
        <div className="empty">
          <span className="empty-symbol">☕</span>
          <h2>Chiếc giỏ còn trống</h2>
          <p>Thêm một ly bạn thích để bắt đầu ngày vui.</p>
          <Link className="button" href="/">
            Khám phá thực đơn
          </Link>
        </div>
      ) : (
        <div className="checkout-grid">
          <div>
            {items.map((i) => (
              <article className="cart-item" key={i.key}>
                <Image src={i.imageUrl} alt={i.name} width={100} height={110} />
                <div className="cart-item-copy">
                  <h3>{i.name}</h3>
                  <p>
                    Size {i.size}
                    {i.toppings.map((t) => " · " + t.name)}
                  </p>
                  <strong>{money(i.unitPrice)}</strong>
                  <div className="cart-controls">
                    <label>
                      Số lượng
                      <input
                        aria-label={`Số lượng ${i.name}`}
                        type="number"
                        min={1}
                        max={20}
                        value={i.qty}
                        onChange={(e) =>
                          quantity(i.key, Number(e.target.value) || 1)
                        }
                      />
                    </label>
                    <button
                      className="text-button"
                      onClick={() => remove(i.key)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                <b>{money(i.unitPrice * i.qty)}</b>
              </article>
            ))}
            <Link className="back-link" href="/">
              ← Thêm món khác
            </Link>
          </div>
          <aside className="summary">
            <h2>Hẹn bạn tại quầy</h2>
            <p>Đặt trước, ghé nhận thật nhanh.</p>
            <div className="summary-line">
              <span>Tạm tính</span>
              <strong>{money(cartTotal(items))}</strong>
            </div>
            <p className="fineprint">
              Mã ưu đãi được áp dụng tại bước thanh toán. Giá cuối cùng được xác
              nhận bởi cửa hàng.
            </p>
            <Link href="/checkout" className="button full">
              Tiếp tục thanh toán →
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
