# Sprint Review và Retrospective

## Review kỹ thuật ngày 06 tháng 11 năm 2026
Increment được chuẩn bị cho demo: menu → size/topping → giỏ → register/login → tạo đơn → Ví/Thẻ mock → xác nhận/lịch sử. Phần mở rộng: quầy pha chế, khuyến mãi, điểm, hủy và hoàn kho. Kết quả test/CI được liên kết ở `../quality/verification.md`; không đồng nhất review tự động với nghiệm thu chính thức của PO/giảng viên.

Các tình huống review: giỏ giữ qua reload; thẻ từ chối giữ giỏ; retry cùng Order; 10 payment cùng key; 20 khách tranh 5 phần; STAFF không tự đặt PAID và khách không đổi state. Bằng chứng nằm ở test và Actions, thay vì lời khẳng định không kèm kiểm chứng.

## Retrospective từ công việc đã diễn ra
Điều hiệu quả: một schema dùng cho API/test/diagrams; kế thừa backend đang có; tách folder và DB để hai tác nhân không ghi đè; CI tìm ra lỗi kiểu mà unit runner transpile không phát hiện.

Điều cần cải thiện: viết DTO/API contract trước UI; tính trước giới hạn transaction pool dưới tải; chạy typecheck cùng test; quản lý phiên thanh toán bền hơn; cấp môi trường production sớm.

Hành động tiếp theo: chuyển JWT sang cookie HttpOnly khi triển khai ứng dụng thực; thêm create-order idempotency, thời hạn giữ kho và reconciliation PROCESSING; rà soát dependency audit; kiểm tra backup phục hồi; nhóm điền vai trò thực và tổ chức nghiệm thu với giảng viên.

## Phản hồi khách hàng
Chưa có biên bản phản hồi trực tiếp của giảng viên/PO. Không ghi tên, chữ ký hoặc đánh giá giả. Khi demo, ghi người tham dự, ngày, acceptance đạt/chưa đạt và chuyển góp ý thành issue có ưu tiên.
