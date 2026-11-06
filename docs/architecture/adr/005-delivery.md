# ADR 005 Delivery bằng image bất biến

Ngày: 2026-11-06. Trạng thái: Accepted (quyết định thiết kế; không phải minh chứng production).

## Bối cảnh và quyết định
GHCR tag SHA, VPS Compose + Caddy, migration trước service, smoke sau deploy, rollback image trước đó. Không hạ migration tự động; yêu cầu migration tương thích ngược và backup trước thay đổi phá hủy.

## Hệ quả
Được truy vết trong architecture.md, schema/mã nguồn và sơ đồ; thay đổi quyết định phải bổ sung ADR thay thế thay vì sửa lịch sử.
