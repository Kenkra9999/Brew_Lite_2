# Công cụ phụ trợ

Các script dùng khi soạn tài liệu và đo đạc; không cần cho việc chạy ứng dụng.

| Script | Chức năng | Cách chạy (từ thư mục gốc) |
|---|---|---|
| `build_report.py` | Sinh `report/BaoCao_BrewLite.tex` từ các tài liệu Markdown trong `docs/` (cần Pillow) | `python tools/build_report.py` |
| `capture-ui.cjs` | Chụp ảnh giao diện thật cho báo cáo vào `report/assets/` (cần hệ thống đang chạy) | `node tools/capture-ui.cjs` |
| `measure-performance.mjs` | Đo thời gian phản hồi `GET /products`, ghi `docs/quality/performance.json` | `node tools/measure-performance.mjs` |
| `make_images.py`, `file_utils.py` | Sinh ảnh minh họa đồ uống (`apps/web/public/images/*.svg`) và icon PWA | `python tools/make_images.py` |

Sơ đồ PlantUML: xem `docs/diagrams/README.md` (tải `plantuml.jar` vào `tools/`, file này không được commit).
