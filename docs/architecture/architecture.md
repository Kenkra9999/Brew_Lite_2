# Kiến trúc BrewLite

## Phương pháp phân lớp và module domain
Browser/PWA → Next.js App Router → route proxy /api → NestJS → Prisma → PostgreSQL. UI không truy cập DB, không tự quyết định giá hay trạng thái thanh toán. Proxy cùng origin giúp trình duyệt không cần biết DNS nội bộ Docker. Gateway thanh toán là module mock trong API, không phải dịch vụ ngân hàng.

| Thành phần | Trách nhiệm | Mã nguồn |
|---|---|---|
| Next.js | Menu, tùy chọn, cart, auth, checkout, tracking, staff và PWA | apps/web/src/app, components, lib |
| Proxy | Chuyển tiếp các API được cho phép; timeout, không cache | apps/web/src/app/api/[...path]/route.ts |
| Auth | DTO, bcrypt, JWT và role guards | apps/api/src/auth |
| Products | Menu/chi tiết/topping | apps/api/src/products |
| Orders | Transaction, snapshot giá, optimistic kho, state machine | apps/api/src/orders |
| Payments | Claim idempotency, khóa Order, mock charge, kết quả atomic | apps/api/src/payments |
| Promotions / loyalty | Giảm tiền có điều kiện, giới hạn lượt, cộng/thu hồi điểm | apps/api/src/promotions, loyalty |
| Persistence | Prisma schema, migration, seed | apps/api/prisma, src/database |
| Vận hành | Env validation, request ID, health DB, log không chứa body | apps/api/src/config, common, health |

## Giao dịch và nhất quán
Tạo đơn dùng ReadCommitted + UPDATE có version và stock, retry tối đa 8 lần có backoff. Nhiều dòng cùng sản phẩm được gộp số lượng trước khi giữ kho. Mã khuyến mãi và ghi đơn nằm trong transaction nên lỗi rollback cả kho. Dòng Order được khóa khi claim payment và hủy/cập nhật để tránh race. Unique Payment.idempotencyKey bảo vệ cả khi API nhiều replica. Hash gồm user/order/method, không lưu số thẻ.

Gateway chạy ngoài transaction để không giữ khóa khi chờ mạng. Transaction kết quả lưu payment, trạng thái và điểm cùng lúc. Giới hạn: crash giữa claim và finalize có thể để lại PROCESSING; chưa có outbox/reconciliation. Giải pháp đủ cho mock bài tập, chưa áp dụng cho thu tiền thật. POST /orders chưa có idempotency riêng.

## Triển khai
Local: Docker Compose 3 dịch vụ, health dependency, persistent volume. Production được chuẩn bị cho VPS với Caddy HTTPS, web/api nội bộ và DB không publish cổng; GHCR images theo SHA; SSH deploy, migration, smoke và khôi phục image cũ nếu smoke thất bại. Sơ đồ deployment ghi rõ local kiểm chứng và production chưa được cấp host. Không gán tên Render/Railway khi chưa dùng thực tế.

## Trade off
Monolith module giảm chi phí vận hành và cho transaction DB đơn giản; quy mô lớn phải tách gateway/worker và giám sát. Cart persist tăng tiện lợi, nhưng giá là tạm tính; server luôn tính lại. JWT hiện lưu sessionStorage để không kéo dài qua phiên, vẫn cần bảo vệ XSS; hệ thống thực nên dùng cookie HttpOnly và CSRF thích hợp. PWA hỗ trợ cài đặt và màn hình offline, không chấp nhận giao dịch offline.
