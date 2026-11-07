# Rà soát code luồng thanh toán

Ngày 06/11/2026, nhóm rà soát payment service, orders service, checkout và cart (có hỗ trợ của trợ lý AI Claude Code ở chế độ chỉ đọc). Các điểm phát hiện được sửa qua commit riêng.

Các điểm xử lý sau review: khóa Order và recheck payment key; timeout transaction phù hợp khi tranh kết nối; retry finalize dùng lại kết quả gateway và finalize có điều kiện PROCESSING; pending không xóa nhầm khi hủy đơn khác; logout xóa pending; checkout có thể resume đúng order từ lịch sử; số lượng nguyên. PAY-T03/PAY-T09, CART-T05 và E2E-T03 kiểm chứng các rủi ro này.

Giới hạn được giữ rõ: mock cache chỉ trong RAM, chưa có reconciliation sau process crash; không gọi lại charge dựa trên giả định cache bền. POST /orders chưa có idempotency server. Kết quả test sau khi sửa nằm trong `verification.md`.
