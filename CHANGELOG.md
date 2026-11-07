# Release notes

## Phiên bản 1.0.1 ngày 07 tháng 11 năm 2026
Chuyển repository nộp bài sang https://github.com/Kenkra9999/Brew_Lite_2 với nguyên lịch sử commit và tag `v1.0.0`. Tạo lại Product Backlog bằng 15 GitHub Issue chia milestone Sprint 1/Sprint 2, bật branch protection cho `main` và kiểm chứng lại trên repository mới: Quality Gate xanh trên `main`, Delivery xuất image GHCR theo SHA, PR cố ý lỗi lint bị chặn merge. Cập nhật README, tài liệu bằng chứng và báo cáo LaTeX theo repository mới. Không thay đổi mã nguồn ứng dụng; các giới hạn của bản 1.0.0 vẫn giữ nguyên.

## Phiên bản 1.0.0 ngày 06 tháng 11 năm 2026
Hoàn thiện luồng menu đến xác nhận: Next.js mobile/PWA, NestJS REST, Prisma migration PostgreSQL, JWT/bcrypt, size/topping, cart persist, WALLET/CARD mock, history/tracking và staff board. Bổ sung promo/loyalty, state machine, optimistic kho, payment key và khóa chống race hủy/thanh toán. Có unit/integration/E2E, Compose local, Quality Gate và workflow xuất image/CD, UML và báo cáo LaTeX.

Giới hạn phiên bản: thanh toán mô phỏng, chưa có gateway thật/reconciliation; kho PENDING không tự hết hạn; chưa có create-order idempotency; seed demo không dùng production; chưa cấp host/domain nên production chỉ có cấu hình. Danh sách thành viên và biên bản nghiệm thu cần nhóm bổ sung. Xem verification.md để biết chính xác test và CI đã thực sự chạy.
