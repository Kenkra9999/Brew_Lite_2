# Kế hoạch Sprint và ánh xạ hai Assignment

Assignment 1 gợi ý 3 Sprint: A1-S1 task 1–4; A1-S2 task 5–7; A1-S3 task 8–10. Assignment 2 quy định 2 Sprint hiện thực sau phân tích/thiết kế: A2-S1 tập trung nền tảng/menu; A2-S2 hoàn thành end-to-end và delivery. Dùng cùng Product Backlog, ánh xạ A1-S2 và S3 vào A2-S2; không tuyên bố đề A2 yêu cầu 3 Sprint.

| Sprint A2 | Goal | Backlog | Increment / bằng chứng nghiệm thu |
|---|---|---|---|
| Sprint 1 | Nền tảng tái lập và xem menu thật | US-01..04; requirement/model/architecture; CI cơ bản | API menu/chi tiết, giao diện mobile, seed, test API/component, SRS + UML + ADR |
| Sprint 2 | Đặt đến xác nhận và bàn giao | US-05..10; integration/E2E; Docker, CD, báo cáo | Auth/giỏ/đơn/thanh toán/lịch sử/staff; concurrency tests; image pipeline; deploy nếu có host |

## Sprint Planning
Ưu tiên Must và các phụ thuộc: docs yêu cầu → mô hình → kiến trúc → API menu/UI → auth/order/cart → payment → test/delivery. Mỗi story tách thiết kế/code/test/docs; ước lượng tổng 37 SP. Đây là kế hoạch phân rã để nhóm sử dụng; không phải timesheet nhiều tuần đã diễn ra.

## Daily Scrum
Nhóm cập nhật ba mục: tiến tới Sprint Goal, kế hoạch tiếp theo, blocker; giới hạn 15 phút. Nhật ký quan sát thực ngày 06/11/2026: Claude dừng do giới hạn sử dụng; Codex kế thừa vào folder riêng; PostgreSQL test tách biệt; CI bắt lỗi kiểu test; bổ sung chống race payment và hủy. Không tạo nhật ký họp ngày khác.

## Burndown
`burndown-plan.csv` chỉ biểu diễn đường kế hoạch 10 ngày cho 37 SP. Chưa có nhật ký SP thực tế qua từng ngày, vì vậy không vẽ đường Actual giả. Nhóm cần cập nhật từ issue board tại Daily Scrum trước nghiệm thu quy trình. Lịch sử Git và Actions phản ánh công việc kỹ thuật thực hiện trong phiên này.
