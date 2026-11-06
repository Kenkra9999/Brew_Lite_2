"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth, ErrorNotice, Loading } from "@/components/shell";
import { useResource } from "@/lib/hooks";
import { money, statusLabel, type Order } from "@/lib/types";
export default function Staff() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useResource<Order[]>(
    user?.role === "STAFF" ? "/orders?status=PAID,PREPARING,READY" : null,
    5000,
  );
  const [actionError, setActionError] = useState(""),
    [busy, setBusy] = useState<number | null>(null);
  async function update(id: number, status: string) {
    setBusy(id);
    setActionError("");
    try {
      await api("/orders/" + id + "/status", {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await reload();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  if (user?.role !== "STAFF")
    return (
      <div className="page empty">
        <h1>Quầy pha chế dành cho nhân viên</h1>
        <Link href="/auth" className="button">
          Đăng nhập nhân viên
        </Link>
      </div>
    );
  return (
    <div className="page">
      <span className="eyebrow muted">BREWLITE BARISTA</span>
      <h1>Mỗi đơn, một niềm vui</h1>
      <p>
        Đơn được cập nhật mỗi 5 giây. Chỉ nhận pha chế sau khi đã thanh toán.
      </p>
      {(error || actionError) && (
        <ErrorNotice message={error || actionError} retry={reload} />
      )}
      <div className="staff-board">
        {["PAID", "PREPARING", "READY"].map((s, index) => (
          <section key={s}>
            <h2>
              {statusLabel[s]}{" "}
              <span>{data?.filter((o) => o.status === s).length || 0}</span>
            </h2>
            {loading ? (
              <Loading />
            ) : (
              data
                ?.filter((o) => o.status === s)
                .map((o) => (
                  <article className="panel staff-card" key={o.id}>
                    <b>
                      Đơn {o.code} · {o.customerName}
                    </b>
                    {o.items.map((i) => (
                      <p key={i.id}>
                        {i.productName} {i.size} ×{i.qty}
                        <small>
                          {i.toppings.map((t) => t.name).join(", ")}
                        </small>
                      </p>
                    ))}
                    {o.note && <p>Ghi chú: {o.note}</p>}
                    <p>{money(o.total)}</p>
                    <button
                      className="button full"
                      disabled={busy === o.id}
                      onClick={() =>
                        update(o.id, ["PREPARING", "READY", "COMPLETED"][index])
                      }
                    >
                      {
                        ["Bắt đầu pha chế", "Sẵn sàng nhận", "Đã giao khách"][
                          index
                        ]
                      }
                    </button>
                    {s === "PAID" && (
                      <button
                        className="text-button"
                        disabled={busy === o.id}
                        onClick={() => update(o.id, "CANCELLED")}
                      >
                        Hủy và hoàn tiền mô phỏng
                      </button>
                    )}
                  </article>
                ))
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
