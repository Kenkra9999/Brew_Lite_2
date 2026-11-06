"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAuth, ErrorNotice, Loading } from "@/components/shell";
function AuthForm() {
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { refresh } = useAuth();
  const router = useRouter(),
    params = useSearchParams();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const response = await api<{ accessToken: string; user: User }>(
        "/auth/" + (register ? "register" : "login"),
        {
          method: "POST",
          body: JSON.stringify({
            email: form.get("email"),
            password: form.get("password"),
            ...(register ? { fullName: form.get("fullName") } : {}),
          }),
        },
      );
      sessionStorage.setItem("brewlite-token", response.accessToken);
      await refresh();
      const next = params.get("next");
      router.push(next === "/checkout" ? next : "/");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-story">
        <span className="eyebrow">WELCOME TO YOUR DAILY JOY</span>
        <h1>
          Món quen của bạn.
          <br />
          <em>Niềm vui của tụi mình.</em>
        </h1>
        <p>Đăng nhập để đặt món, xem đơn và tích điểm cho lần ghé tiếp theo.</p>
        <span className="auth-flower">✳</span>
      </div>
      <section className="auth-card">
        <span className="eyebrow muted">BREWLITE MEMBER</span>
        <h2>{register ? "Làm quen nhé!" : "Mừng bạn trở lại"}</h2>
        <p>
          {register
            ? "Một tài khoản, nhiều ly ngon."
            : "Ly yêu thích chỉ cách vài chạm."}
        </p>
        <form onSubmit={submit}>
          {register && (
            <label>
              Họ và tên
              <input
                name="fullName"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                placeholder="Tên của bạn"
              />
            </label>
          )}
          <label>
            Email
            <input
              name="email"
              type="email"
              required
              maxLength={120}
              autoComplete="email"
              placeholder="ban@example.com"
            />
          </label>
          <label>
            Mật khẩu
            <input
              name="password"
              type="password"
              required
              minLength={register ? 8 : 1}
              maxLength={72}
              pattern={register ? "(?=.*[A-Za-z])(?=.*[0-9]).{8,}" : undefined}
              autoComplete={register ? "new-password" : "current-password"}
              placeholder={
                register ? "Ít nhất 8 ký tự, có chữ và số" : "Mật khẩu của bạn"
              }
            />
          </label>
          {error && <ErrorNotice message={error} />}
          <button className="button full" disabled={busy}>
            {busy ? "Đang xử lý…" : register ? "Tạo tài khoản" : "Đăng nhập →"}
          </button>
        </form>
        <p>
          {register ? "Đã có tài khoản?" : "Chưa là thành viên?"}{" "}
          <button
            className="text-button"
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register ? "Đăng nhập" : "Đăng ký ngay"}
          </button>
        </p>
        <Link className="back-link" href="/">
          ← Tiếp tục xem thực đơn
        </Link>
      </section>
    </div>
  );
}
export default function Auth() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthForm />
    </Suspense>
  );
}
