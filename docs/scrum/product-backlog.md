# Product Backlog

Product vision: khách chọn đồ uống, thanh toán không tiền mặt và nhận nhanh ở quầy. Owner được mô tả theo vai trò; tên thành viên thật phải bổ sung khi nhóm cung cấp. Điểm là ước lượng kế hoạch, không phải số điểm chấm được bảo đảm.

| ID | User story và giá trị | Ưu tiên | SP | A1 Task | A2 Sprint | Acceptance |
|---|---|---|---|---|---|---|
| US-01 | Là developer, tôi muốn project có cấu trúc để chạy và bàn giao | Must | 2 | 1 | 1 | Next/Nest, README, env mẫu, Git |
| US-02 | Là khách, tôi muốn đọc menu chính xác từ API | Must | 2 | 2 | 1 | GET /products, seed, API test |
| US-03 | Là khách, tôi muốn menu dùng được trên điện thoại | Must | 3 | 3 | 1 | Loading/empty/error và lọc/tìm |
| US-04 | Là khách, tôi muốn chọn size/topping và biết giá | Must | 3 | 4 | 1 | Chi tiết, lựa chọn và tính giá |
| US-05 | Là khách, tôi muốn chỉnh giỏ trước khi mua | Must | 3 | 5 | 2 | Qty/xóa, badge/tổng, persist |
| US-06 | Là khách, tôi muốn đơn lưu đúng trong hệ thống | Must | 5 | 6 | 2 | DTO, JWT, PENDING, transaction |
| US-07 | Là khách, tôi muốn tài khoản riêng để bảo vệ đơn | Must | 3 | 7 | 2 | Bcrypt, register/login JWT, ownership |
| US-08 | Là khách, tôi muốn thanh toán Ví/Thẻ mô phỏng an toàn | Must | 5 | 8 | 2 | PAID/FAILED, key, giữ giỏ khi lỗi |
| US-09 | Là khách/giảng viên, tôi muốn xác nhận và tái tạo bản chạy | Must | 3 | 9 | 2 | History, Compose, demo và README |
| US-10 | Là PO, tôi muốn nghiệp vụ không sai khi gửi lặp/đồng thời | Must | 8 | 10 | 2 | State, idempotency, không âm kho, promo/loyalty |

## Definition of Ready
Story có giá trị và acceptance kiểm chứng được, FR/UC liên quan, dependency rõ, ước lượng và phạm vi đủ nhỏ để demo. Task 2/3 của A2 dựa trên SRS/use case đã lưu trước khi hiện thực.

## Definition of Done
Build/lint/typecheck đạt; acceptance đã kiểm chứng; API validate và UI xử lý loading/error; có test tương ứng cho rủi ro; không có secret; migration/README đồng bộ; source diagram và ảnh đồng bộ; PR được review và CI xanh; tài liệu ghi đúng bằng chứng. Chỉ đánh dấu production Done sau khi HTTPS/frontend/API/health hoạt động.

## Vai trò Scrum
PO: xác nhận phạm vi và nghiệm thu. SM: theo dõi blocker, điều phối event. Developers: phân tích, code, test, docs, vận hành. Tên thành viên đảm nhận từng vai trò được ghi ở trang bìa báo cáo.
