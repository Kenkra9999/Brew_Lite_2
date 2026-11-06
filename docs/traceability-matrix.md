# Ma trận truy vết

Đường dẫn code tương đối từ `apps/api/src` hoặc `apps/web/src`. Tên test trỏ đến test thực trong repository. NFR chưa có bằng chứng phải giữ trạng thái chưa nghiệm thu; không suy ra hoàn thành từ việc có mã nguồn.

| Yêu cầu | Use case / story | Thiết kế | Code hoặc API | Test / bằng chứng |
|---|---|---|---|---|
| FR-01 | UC-01 / US-02,03 | usecase-system, activity-checkout | products.service.ts; GET /products; web/app/page.tsx | products.int-spec.ts; WEB-T01..03; E2E-T01 |
| FR-02,03 | UC-01 / US-04 | class-domain, activity-checkout | GET /products/:id; products/[id]/page.tsx; pricing.ts | products.int-spec.ts; pricing.spec.ts; E2E-T01 |
| FR-04..06 | UC-02 / US-05 | activity-checkout | web/lib/cart.ts; cart/page.tsx | CART-T01..05; E2E-T01 reload |
| FR-07,08 | UC-03 / US-07 | usecase-system; class-domain | auth.controller/service.ts; POST /auth/register, /auth/login | auth.int-spec.ts; E2E-T01,02 |
| FR-09,10 | UC-03,04 / US-06,07 | sequence-checkout | auth/guards.ts; order.dto.ts; bootstrap.ts | INT-T01,02,06,07; PAY-T07 |
| FR-11 | UC-04 / US-10 | class-domain; sequence-checkout | promotions.service.ts; POST /promotions/validate | promotion-rules.spec.ts; INT-T04; PAY-T01 |
| FR-12 | UC-04 / US-06 | sequence-checkout; class-domain | orders.service.ts; POST /orders | INT-T03,04,05,09; E2E-T01 |
| FR-13,14 | UC-04 / US-08 | sequence-checkout; state-order | payments.service.ts; POST /payments; checkout/page.tsx | PAY-T01,05,07,10; E2E-T01,02 |
| FR-15,16 | UC-05 / US-09 | activity-checkout; class-domain | GET /orders/me, /orders/:id; web/app/orders | INT-T06,07; E2E-T01 |
| FR-17 | UC-06 / US-10 | state-order; class-domain | order-state-machine.ts; PATCH /orders/:id/status; web/app/staff | order-state-machine.spec.ts; INT-T07 |
| FR-18 | UC-04 / US-10 | sequence-checkout | orders.service.ts createInTx; Prisma Product.version | INT-T09: 20 concurrent requests / 5 stock and qty=2 |
| FR-19 | UC-04 / US-10 | class-domain; sequence-checkout | loyalty.ts; Payment finalize | loyalty.spec.ts; PAY-T01,02,08 |
| FR-20 | UC-04,06 / US-10 | state-order | POST /orders/:id/cancel; orders.service.ts transition | INT-T08; PAY-T08,09 |
| FR-21 | UC-04 / US-08,10 | sequence-checkout | payments.service.ts pay/replay; UNIQUE Payment.idempotencyKey | PAY-T02,03,04,06 |
| FR-22,23 | Ngoài MVP / backlog | usecase-system | Không hiện thực cổng thật hoặc push notification | Không áp dụng nghiệm thu MVP |
| NFR-01 | Hiệu năng | deployment | GET /products | tools/measure-performance.mjs; quality/performance.json |
| NFR-02 | Bảo mật | deployment; sequence-checkout | bcrypt/JWT/DTO; Compose DB private | auth.int-spec.ts; INT-T01,02,06,07; PAY-T07 |
| NFR-03,05 | Khả dụng và tái lập | deployment | GET /health; Dockerfiles; migrations; Compose | Compose health và build; migration reset integration |
| NFR-04,08 | Mobile và truy cập | activity-checkout | web/globals.css; labels/form/error | E2E desktop + mobile; screenshot kiểm tra bố cục |
| NFR-06 | Quality gate | deployment CI | ci.yml; branch protection main | Actions runs/PR được liên kết trong verification.md |
| NFR-07 | Production | deployment production | delivery.yml; deploy.sh; compose production | Cần host/domain, secrets, URL thật và smoke trước khi Done |
| NFR-09 | PWA | deployment browser | manifest.webmanifest; sw.js; offline.html | Kiểm tra tệp và service worker; cài đặt cần HTTPS/localhost |
