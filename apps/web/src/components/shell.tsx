"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useReady } from "@/lib/hooks";
import type { User } from "@/lib/types";
const AuthContext = createContext<{
  user: User | null;
  refresh: () => Promise<void>;
  logout: () => void;
}>({ user: null, refresh: async () => {}, logout: () => {} });
export const useAuth = () => useContext(AuthContext);
export function Shell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const ready = useReady();
  const items = useCart((s) => s.items);
  const path = usePathname();
  async function refresh() {
    if (!sessionStorage.getItem("brewlite-token")) {
      setUser(null);
      return;
    }
    try {
      setUser(await api<User>("/auth/me"));
    } catch {
      setUser(null);
    }
  }
  function logout() {
    sessionStorage.removeItem("brewlite-token");
    sessionStorage.removeItem("brewlite-pending");
    setUser(null);
  }
  useEffect(() => {
    void refresh();
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return (
    <AuthContext.Provider value={{ user, refresh, logout }}>
      <header className="topbar">
        <div className="nav-wrap">
          <Link className="brand" href="/" aria-label="BrewLite trang chủ">
            <span className="brand-icon">b.</span>BrewLite
            <span className="brand-dot">●</span>
          </Link>
          <nav aria-label="Điều hướng chính">
            <Link className={path === "/" ? "active" : ""} href="/">
              Thực đơn
            </Link>
            <Link
              className={path.startsWith("/orders") ? "active" : ""}
              href="/orders"
            >
              Đơn của tôi
            </Link>
            {user?.role === "STAFF" && <Link href="/staff">Quầy pha chế</Link>}
          </nav>
          <div className="nav-actions">
            {user ? (
              <button
                className="text-button account"
                onClick={logout}
                title="Đăng xuất"
              >
                {user.fullName} · {user.loyaltyPoints} điểm
              </button>
            ) : (
              <Link className="account" href="/auth">
                Đăng nhập
              </Link>
            )}
            <Link
              href="/cart"
              className="cart-link"
              aria-label={`Giỏ hàng ${ready ? items.reduce((s, i) => s + i.qty, 0) : 0} món`}
            >
              Giỏ hàng{" "}
              <span>{ready ? items.reduce((s, i) => s + i.qty, 0) : 0}</span>
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer>
        <Link className="brand" href="/">
          BrewLite<span className="brand-dot">●</span>
        </Link>
        <p>Một chút cà phê. Một ngày thật khác.</p>
        <span>Đặt trước · Thanh toán không tiền mặt · Nhận tại quầy</span>
      </footer>
    </AuthContext.Provider>
  );
}
export function ErrorNotice({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="notice error" role="alert">
      {message}
      {retry && <button onClick={retry}>Thử lại</button>}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      Đang chuẩn bị một chút ngon lành…
    </div>
  );
}
