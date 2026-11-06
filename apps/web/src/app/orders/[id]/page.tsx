"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth, ErrorNotice, Loading } from "@/components/shell";
import { useResource } from "@/lib/hooks";
import { money, statusLabel, type Order } from "@/lib/types";
export default function OrderPage() {
  const { id } = useParams<{ id: string }>(),
    { user } = useAuth();
  const {
    data: o,
    error,
    loading,
    reload,
  } = useResource<Order>(user ? "/orders/" + id : null, 5000);
  const [actionError, setActionError] = useState(""),
    [busy, setBusy] = useState(false);
  async function cancel() {
    setBusy(true);
    try {
      await api("/orders/" + id + "/cancel", { method: "POST" });
      await reload();
      const saved = JSON.parse(
        sessionStorage.getItem("brewlite-pending") || "null",
      );
      if (saved?.orderId === Number(id))
        sessionStorage.removeItem("brewlite-pending");
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!user)
    return (
      <div className="page empty">
        <h1>Đăng nhập để xem đơn</h1>
        <Link href="/auth" className="button">
          Đăng nhập
        </Link>
      </div>
    );
  if (loading) return <Loading />;
  if (error || !o)
    return (
      <div className="page">
        <ErrorNotice message={error || "Không tìm thấy đơn"} retry={reload} />
      </div>
    );
  const paid = ["PAID", "PREPARING", "READY", "COMPLETED"].includes(o.status);
  return (
    <div className="page order-detail">
      <div className="confirmation">
        <span className="confirmation-icon">
          {paid ? "✓" : o.status === "CANCELLED" ? "×" : "◷"}
        </span>
        <span className="eyebrow muted">BREWLITE · NHẬN TẠI QUẦY</span>
        <h1>{paid ? "Cảm ơn bạn đã đặt hàng!" : statusLabel[o.status]}</h1>
        <p>
          {paid
            ? "Tụi mình đã nhận được đơn. Giữ mã này để nhận đồ uống tại quầy nhé."
            : "Bạn có thể kiểm tra hoặc tiếp tục thanh toán trong giỏ."}
        </p>
        <strong className="order-code">{o.code}</strong>
        <span className={"status " + o.status.toLowerCase()}>
          {statusLabel[o.status]}
        </span>
      </div>
      <div className="panel">
        <h2>Chi tiết đơn hàng</h2>
        {o.items.map((i) => (
          <div className="summary-line" key={i.id}>
            <span>
              {i.productName} · {i.size} ×{i.qty}
              <small>{i.toppings.map((t) => t.name).join(", ")}</small>
            </span>
            <b>{money(i.lineTotal)}</b>
          </div>
        ))}
        <div className="summary-line">
          <span>Tạm tính</span>
          <span>{money(o.subtotal)}</span>
        </div>
        <div className="summary-line">
          <span>Ưu đãi</span>
          <span>−{money(o.discount)}</span>
        </div>
        <div className="summary-line total">
          <b>Tổng cộng</b>
          <strong>{money(o.total)}</strong>
        </div>
        {paid && (
          <p className="success">
            Bạn nhận được {o.pointsEarned} điểm cho đơn này.
          </p>
        )}
        {o.note && <p>Ghi chú: {o.note}</p>}
        <h3>Hành trình ly ngon</h3>
        <ol className="timeline">
          {o.history.map((h, i) => (
            <li key={i}>
              <b>{statusLabel[h.to]}</b>
              <small>{new Date(h.at).toLocaleString("vi-VN")}</small>
            </li>
          ))}
        </ol>
        {actionError && <ErrorNotice message={actionError} />}
        <div className="action-row">
          {["PENDING", "PAYMENT_FAILED"].includes(o.status) && (
            <>
              <Link className="button" href={"/checkout?order=" + o.id}>
                Tiếp tục thanh toán đơn này
              </Link>
              <button disabled={busy} onClick={cancel} className="secondary">
                Hủy đơn
              </button>
            </>
          )}
          <Link className="button" href="/">
            Thêm một ly ngon →
          </Link>
          <Link href="/orders">Tất cả đơn của tôi</Link>
        </div>
      </div>
    </div>
  );
}
