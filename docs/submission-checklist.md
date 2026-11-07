# Checklist bàn giao theo rubric

## Assignment 1
| Task | Tạo phẩm | Trạng thái |
|---|---|---|
| 1 | Monorepo Next/Nest, env mẫu, README, Git | Có mã nguồn và lịch sử |
| 2 | GET /products từ PostgreSQL seed | Có API và integration test |
| 3 | Menu mobile loading/empty/error | Có UI và component test |
| 4 | Chi tiết, size/topping, tính giá | Có UI, pricing test và E2E |
| 5 | Giỏ thêm/sửa/xóa, badge/tổng, persist | Có store test và E2E reload |
| 6 | POST /orders DTO, PENDING | Có transaction và integration test |
| 7 | JWT register/login bcrypt guard | Có integration test phân quyền |
| 8 | Ví/Thẻ mock PAID/PAYMENT_FAILED | Có success/failure/retry test |
| 9 | Xác nhận/lịch sử/Compose/README/demo | Có mã nguồn, Docker và kịch bản demo trực tiếp |
| 10 | State/idempotency/kho đồng thời/promo/loyalty | Có unit và integration chứng minh |

## Assignment 2
| Task | Tạo phẩm | Trạng thái |
|---|---|---|
| 1 | context-and-scope, SRS MoSCoW, use case | docs/requirements và use-case diagrams |
| 2 | Activity/sequence/class, nguồn và kết xuất | docs/diagrams .puml/.svg/.png |
| 3 | Architecture, ADR, deployment diagram | Có thiết kế; production topology cần cập nhật host thật |
| 4 | Repo, backlog, menu MVP, CI, merge gate | Repository Brew_Lite_2, 15 issue theo milestone Sprint 1/2, PR lỗi bị chặn và PR xanh được merge; xem verification.md |
| 5 | End-to-end, tests, Compose, images/CD, production, release | Phần local/test/CI có bằng chứng; production cần host/domain/secrets và URL hoạt động |

## Thông tin nhóm cần bổ sung trước nộp
- Repository nộp bài: https://github.com/Kenkra9999/Brew_Lite_2 (public); cấp quyền/gửi link cho giảng viên.
- Điền nhóm, lớp, thành viên/MSSV trong report/thong-tin.tex; xác nhận tên GVHD theo mẫu.
- Tổ chức demo/Review với giảng viên, ghi feedback và vai trò Scrum thực.
- Cung cấp môi trường production, deploy, cập nhật URL frontend/API/health và sơ đồ thực tế.
- Có thể bổ sung video quay demo nếu không chọn demo trực tiếp.

Theo đề A2, thiếu URL production hoạt động thì phần triển khai Task 5 chưa được tính hoàn thành. Báo cáo và repository giữ rõ giới hạn này.
