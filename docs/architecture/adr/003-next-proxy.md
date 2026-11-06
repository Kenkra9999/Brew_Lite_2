# ADR 003 Proxy cùng origin

Ngày: 2026-11-06. Trạng thái: Accepted (quyết định thiết kế; không phải minh chứng production).

## Bối cảnh và quyết định
UI gọi /api; Next route chuyển tới API_INTERNAL_URL ở runtime. Chỉ cho prefix API hợp lệ và không chuyển cookie người dùng; JWT được gửi Authorization. Thêm một hop để đổi lấy cấu hình Docker đơn giản.

## Hệ quả
Được truy vết trong architecture.md, schema/mã nguồn và sơ đồ; thay đổi quyết định phải bổ sung ADR thay thế thay vì sửa lịch sử.
