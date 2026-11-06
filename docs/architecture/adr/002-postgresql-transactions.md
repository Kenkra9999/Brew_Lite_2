# ADR 002 PostgreSQL và Prisma

Ngày: 2026-11-06. Trạng thái: Accepted (quyết định thiết kế; không phải minh chứng production).

## Bối cảnh và quyết định
Migration có version, snapshot giá, transaction và optimistic version stock. Không dùng SQLite vì cần chứng minh concurrency PostgreSQL đúng môi trường đề bài.

## Hệ quả
Được truy vết trong architecture.md, schema/mã nguồn và sơ đồ; thay đổi quyết định phải bổ sung ADR thay thế thay vì sửa lịch sử.
