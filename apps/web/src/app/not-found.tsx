import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page empty">
      <h1>Trang này chưa được pha</h1>
      <p>Đường dẫn bạn tìm không tồn tại.</p>
      <Link className="button" href="/">
        Về thực đơn
      </Link>
    </div>
  );
}
