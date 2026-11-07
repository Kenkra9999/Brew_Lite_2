# Bằng chứng kiểm chứng

Ngày kiểm tra: 06/11/2026, Windows 11, Node 24.16.0 local, Node 22 trong Docker/CI, PostgreSQL 17 Docker. Payment/order/checkout/cart đã qua rà soát code (xem `code-review.md`); các lỗi pending và số lượng phát hiện khi rà soát đã được sửa và có test. Giới hạn crash recovery của mock được ghi trong SRS/ADR, không tự gọi lại gateway sau crash vì cache mock chỉ ở RAM.

| Kiểm tra | Kết quả quan sát |
|---|---|
| Unit backend | 50 tests / 6 suites pass |
| Unit/component web | 8 tests / 2 files pass (cart + menu component) |
| Integration PostgreSQL | 31 tests / 4 suites pass; database riêng brewlite_test |
| Đồng thời kho | 20 requests, stock 5: đúng 5 thành công; thêm qty=2 không âm kho |
| Đồng thời thanh toán | 10 cùng key: cùng payment, đúng một charge; hai key/đơn không charge hai lần |
| Docker | Web/API/DB build và cả ba healthy trên localhost |
| Typecheck/lint/build | Đạt trên local và Docker build; GitHub CI chạy độc lập |
| E2E desktop/mobile | 6 tests pass: 3 tình huống × desktop và mobile; success, decline/retry, resume/cancel pending |
| HTTPS production | Chưa có host/domain và deploy secrets; chưa thực hiện |

## CI và pull request thật

### Repository nộp bài Brew_Lite_2 (07/11/2026)
- Repository: https://github.com/Kenkra9999/Brew_Lite_2 — nhận nguyên lịch sử commit, tag `v1.0.0` và 15 issue backlog (milestone Sprint 1/Sprint 2) từ repository làm việc ban đầu.
- Push `main`: https://github.com/Kenkra9999/Brew_Lite_2/actions/runs/42370367806 — Quality Gate xanh toàn bộ (lint, typecheck, unit, integration PostgreSQL, build, E2E desktop/mobile).
- Push tag `v1.0.0`: https://github.com/Kenkra9999/Brew_Lite_2/actions/runs/42370368368 — Delivery: quality xanh, build và push hai image `ghcr.io/kenkra9999/brew_lite_2-api` và `-web` gắn tag commit SHA; job deploy được skip đúng thiết kế vì chưa có host production.
- PR kiểm chứng cổng chất lượng: https://github.com/Kenkra9999/Brew_Lite_2/pull/16 — cố ý thêm `console.log` vi phạm `no-console`. Run https://github.com/Kenkra9999/Brew_Lite_2/actions/runs/42370607079 dừng ở `npm run lint`, typecheck/test/build/E2E bị skip; GitHub báo merge state `BLOCKED`. PR đóng, không merge. Đây là lỗi cố ý để kiểm tra gate, ghi rõ trong mô tả PR.
- PR chuyển repository và cập nhật tài liệu: https://github.com/Kenkra9999/Brew_Lite_2/pull/17 — Quality Gate xanh rồi mới merge (squash, linear history).
- Branch protection `main` bật ngày 07/11/2026: required check `quality`, strict up-to-date, enforce admins, linear history, cấm force push/xóa nhánh.

### Repository làm việc ban đầu brewlite2 (06/11/2026)
- Repository: https://github.com/Kenkra9999/brewlite2
- PR: https://github.com/Kenkra9999/brewlite2/pull/1
- Run phát hiện lỗi: https://github.com/Kenkra9999/brewlite2/actions/runs/42236429957 — typecheck bắt `exact` không thuộc ByRoleOptions trong component test. Pipeline dừng, build/E2E không chạy tiếp. Lỗi được sửa ở commit tiếp theo của cùng PR.
- Run thành công: https://github.com/Kenkra9999/brewlite2/actions/runs/42238619259 — lint, typecheck, 50 backend unit, 8 web unit/component, 31 integration, build và 6 E2E desktop/mobile đều xanh.
- GitHub main đã bật required check `quality`, strict up-to-date, enforce admins và linear history ngày 06/11/2026. PR phải xanh mới merge.

## Giới hạn và bước kiểm tra bổ sung
Thanh toán chỉ mô phỏng; chưa có reconciliation cho PROCESSING sau process crash; POST /orders chưa idempotent; đơn treo chưa có TTL. JWT ở sessionStorage, chưa có HttpOnly cookie. Dependency audit còn advisory ở bộ phiên bản kế thừa; cần nâng dependency có kiểm thử trước vận hành thật. Các test tự động không chứng minh SLA, không thay nghiệm thu khách hàng hoặc pentest. Chưa tuyên bố đáp ứng production khi mới có Compose và workflow.
