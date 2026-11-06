# ADR 001 Monorepo npm workspaces

Ngày: 2026-11-06. Trạng thái: Accepted (quyết định thiết kế; không phải minh chứng production).

## Bối cảnh và quyết định
Đồng bộ frontend/backend/test và một lockfile; dễ chạy CI và Compose. Đổi lại Docker build context lớn; dùng .dockerignore. Không chọn microservices vì nghiệp vụ và nhóm nhỏ.

## Hệ quả
Được truy vết trong architecture.md, schema/mã nguồn và sơ đồ; thay đổi quyết định phải bổ sung ADR thay thế thay vì sửa lịch sử.
