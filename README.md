# BrewLite Assignment 1 và 2

Ứng dụng đặt cà phê không dùng tiền mặt cho môn Công nghệ Phần mềm, SGU, HK I 2026–2027. Next.js 15 + NestJS 11 + PostgreSQL 17 + Prisma. Thanh toán hoàn toàn mô phỏng.

Repository nộp bài: https://github.com/Kenkra9999/Brew_Lite_2 (chuyển nguyên lịch sử commit, tag `v1.0.0` và backlog từ repository làm việc ban đầu https://github.com/Kenkra9999/brewlite2 ngày 07/11/2026).

## Chạy nhanh bằng Docker
Yêu cầu Docker Desktop / Docker Engine và Compose v2, khoảng 4 GB RAM trống. Chạy ở thư mục repository:

```sh
docker compose up --build -d
docker compose ps
```

- Web: http://localhost:3000
- API: http://localhost:3001/products
- Health: http://localhost:3001/health
- Swagger: http://localhost:3001/docs
- PostgreSQL chỉ trên mạng Docker, không publish cổng.
- Khách demo: `demo@brewlite.vn` / `Demo@1234`.
- Nhân viên: `barista@brewlite.vn` / `Barista@1234` → `/staff`.
- Thẻ thành công `4242424242424242`; thẻ từ chối `4000000000000002`; WALLET không cần thẻ.
- Mã `WELCOME10`: giảm 10% từ 50k, tối đa 20k. `GIAM15K`: giảm 15k từ 100k. `HETHAN`: demo mã lỗi.

`docker compose stop` giữ dữ liệu. Không chạy `down -v` nếu cần giữ database. Seed mặc định phục vụ demo, sẽ nạp lại tồn kho khi API khởi động lại. Để giữ kho đang vận hành: đặt `SEED_ON_START=false` sau lần khởi tạo; không dùng seed mặc định cho production thật.

## Phát triển không Docker cho web và API
Node 22, npm 10+, PostgreSQL 17. Tạo hai database `brewlite` và `brewlite_test` thuộc user được cấu hình.

```sh
npm ci
cp .env.example apps/api/.env
# Sửa DATABASE_URL trong apps/api/.env cho database development của bạn.
npm run prisma:deploy -w apps/api
npm run db:seed
npm run dev:api
# Terminal khác:
npm run dev:web
```

PowerShell dùng `Copy-Item .env.example apps/api/.env`. API mặc định 3001, web 3000. Web đọc `API_INTERNAL_URL` từ môi trường hoặc `apps/web/.env.local`, mặc định http://localhost:3001. Không commit `.env`.

## Kiểm thử và build

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Integration test reset database **có tên kết thúc `_test`**. Tuyệt đối không dùng database có dữ liệu cần giữ. Bash:

```sh
DATABASE_URL='postgresql://brewlite:brewlite@localhost:5432/brewlite_test?schema=public' npm run test:int
```

PowerShell:

```powershell
$env:DATABASE_URL='postgresql://brewlite:brewlite@localhost:5432/brewlite_test?schema=public'
npm run test:int
```

E2E cần hệ thống đang chạy và có seed (Docker quick start ở trên):

```sh
npx playwright install chromium
npm run test:e2e
```

Cổng khác: đặt `WEB_URL=http://localhost:3100` trước `npm run test:e2e`. Hai project Chromium desktop và mobile 390px chạy API/DB thật, không mock mạng. Test tạo tài khoản/đơn thử nghiệm; không chạy vào database production.

## Báo cáo LaTeX
`report/BaoCao_BrewLite.tex` là file chính; `report/thong-tin.tex` chứa thông tin nhóm cần điền. File PDF được biên dịch đi kèm. Không cần Python để biên dịch lại tài liệu đã có:

```sh
cd report
xelatex -interaction=nonstopmode -halt-on-error BaoCao_BrewLite.tex
xelatex -interaction=nonstopmode -halt-on-error BaoCao_BrewLite.tex
```

MiKTeX/TeX Live cần fontspec, geometry, longtable, booktabs, hyperref, graphicx, fancyhdr và font Times New Roman/Arial. Logo dựa trên mẫu SGU được cung cấp. Nguồn UML PlantUML + bản SVG/PNG ở `docs/diagrams`. Hướng dẫn kết xuất: `docs/diagrams/README.md`.

## Tài liệu và kiểm chứng
- [Yêu cầu](docs/requirements/srs.md), [phạm vi](docs/requirements/context-and-scope.md), [use case](docs/requirements/use-case-checkout.md).
- [Kiến trúc](docs/architecture/architecture.md), [ADR](docs/architecture/adr), [sơ đồ](docs/diagrams).
- [Product Backlog và Scrum](docs/scrum/product-backlog.md), [kế hoạch Sprint](docs/scrum/sprints.md), [Review và Retrospective](docs/scrum/review-retrospective.md).
- [Truy vết](docs/traceability-matrix.md), [kiểm chứng](docs/quality/verification.md), [đối chiếu rubric](docs/submission-checklist.md).
- [Deploy, migration và rollback](docs/deployment.md), [demo](docs/demo-script.md), [release notes](CHANGELOG.md).

## Quy ước cộng tác
Nhánh `main` ổn định; nhánh `feat/*`, `fix/*`, `docs/*` làm việc; PR có mục đích và bằng chứng kiểm thử. Commit theo `feat:`, `fix:`, `test:`, `docs:`, `ci:`. Quality Gate phải xanh trước merge. Xem `.github/workflows/ci.yml`; branch protection của GitHub phải yêu cầu check `quality` để chặn merge thực sự. Không nhầm việc có YAML với đã bật branch protection.

## Production
Chưa cung cấp URL production khi chưa có host/domain. Đã chuẩn bị VPS + Caddy HTTPS và workflow Delivery. Không dùng localhost làm minh chứng production. Các bước và secret cần thiết ở `docs/deployment.md`; trạng thái thực được cập nhật ở `docs/quality/verification.md`.

Video demo không lồng tiếng: [BrewLite Demo](demo/BrewLite_Demo.webm). Issue backlog thật: [GitHub Backlog](docs/scrum/github-backlog.md).
