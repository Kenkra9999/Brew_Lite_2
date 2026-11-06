# Hướng dẫn triển khai và rollback

## Trạng thái và sơ đồ
Local được chạy qua Compose để kiểm chứng. Production được chuẩn bị cho VPS Linux + Docker + Caddy nhưng chưa có host/domain được cung cấp. `diagrams/deployment.puml` tách local/CI/production và ghi rõ trạng thái này. URL thật và ngày smoke phải được bổ sung sau khi provision. Không dùng URL ngẫu nhiên hoặc giả lập minh chứng deploy.

## Chuẩn bị VPS
1. Cấp VPS có Docker Engine/Compose v2, DNS A/AAAA domain trỏ đúng host và mở 80/443. SSH 22 chỉ cho người vận hành/CI; không mở 5432/3001.
2. Tạo `/opt/brewlite/deploy`, copy compose production và Caddyfile. Copy `.env.production.example` thành `/opt/brewlite/.env`, chmod 600 và điền DOMAIN, IMAGE_PREFIX, POSTGRES_PASSWORD, DATABASE_URL, JWT_SECRET. Password trong URL cần URL encode; ví dụ chỉ dùng ký tự URL-safe.
3. Dùng image GHCR có tag full SHA. Package private cần login GHCR trên VPS bằng token chỉ read:packages; không lưu token vào repo/log.
4. Tạo GitHub Environment `production`; secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`. Known hosts được xác minh từ chủ VPS; không tắt StrictHostKeyChecking. Tài khoản deploy có quyền Docker (tương đương root trên host), cần máy riêng cho bài.
5. Workflow Delivery chạy quality gate → build images → push GHCR → SSH deploy → migrate → up --wait → HTTPS smoke. Chạy thủ công deploy=false để chỉ xuất image, deploy=true khi host đã cấu hình. Tag `v*` thực hiện deploy và yêu cầu các secrets này.

## Migration và dữ liệu
`prisma migrate deploy` chạy một lần trước đổi dịch vụ; API production không tự seed hoặc chạy migration mỗi replica. Seed chỉ dùng local/demo. Trước thay đổi schema phá hủy, backup bằng pg_dump và diễn tập restore. Dùng migration expand/contract tương thích cả image trước và image mới.

## Health và smoke
- `https://DOMAIN/` là frontend.
- `https://DOMAIN/backend/health` là health của NestJS qua Caddy.
- `https://DOMAIN/backend/products` là API công khai theo đường dẫn gateway.
- `https://DOMAIN/api/products` là proxy Next cùng origin.
- `docker compose --env-file .env -f docker-compose.production.yml ps` kiểm tra container; `logs --tail=100 api` kiểm tra lỗi. Không log env, body thẻ, password, token.

## Rollback
`deploy/deploy.sh SHA` lưu `.deployed-tag` chỉ sau smoke thành công. Nếu deploy/migration/smoke lỗi, script phục hồi image tag trước và trả exit 1. Không tự rollback schema: image trước chỉ an toàn nếu migration tương thích ngược. Nếu migration phá hủy hoặc dữ liệu hỏng, dừng nhận giao dịch và phục hồi backup theo quyết định vận hành. Lần deploy đầu không có previous tag; script báo rõ, không giả vờ đã rollback.

## CI và branch protection
Quality Gate chạy PR/push main, Postgres service test, unit/integration/build và E2E desktop/mobile. Yêu cầu GitHub bảo vệ main với check `quality`, không cho merge khi check đỏ. Bằng chứng một lần lỗi và lần thành công cùng link PR nằm ở quality/verification.md. Cấu hình YAML không tự tạo môi trường production hoặc bật branch protection.

## Backup mẫu
Từ thư mục production, chạy `docker compose --env-file .env -f docker-compose.production.yml exec -T db pg_dump -U brewlite brewlite > backup.sql`. Lưu backup ở nơi truy cập hạn chế, thử restore vào DB tách biệt. Không commit backup chứa dữ liệu người dùng.
