# Kịch bản demo trực tiếp

Thời lượng gợi ý 7–10 phút. Chạy Compose và mở web/API health trước demo; đây là kịch bản thực hiện, không phải link video đã quay.

1. Giới thiệu Next.js/NestJS/PostgreSQL, Product Backlog và ma trận truy vết. Cho xem health và menu API (1 phút).
2. Trên viewport điện thoại, mở Cappuccino, chọn M + Trân châu, thêm giỏ. Đổi qty rồi reload để chứng minh persist (1 phút).
3. Đăng ký tài khoản mới hoặc dùng demo, áp WELCOME10 cho đơn đủ 50k, chọn WALLET; xác nhận PAID và điểm đúng floor(total/10000) (1 phút).
4. Mở lịch sử, mã đơn và tiến trình. Đăng nhập barista ở cửa sổ khác, chuyển PAID→PREPARING→READY→COMPLETED; chờ polling cập nhật (1 phút).
5. Tạo đơn khác, CARD 4000000000000002; xem PAYMENT_FAILED và giỏ còn nguyên; đổi thẻ 4242424242424242; trả lại thành công trên cùng mã đơn (1 phút).
6. Mở test PAY-T03 cho 10 payment cùng key và INT-T09 cho 20 order tranh 5 phần; trình bày kết quả thật. Thử transition sai và xem 409 (1 phút).
7. Cho xem PR/Actions lỗi→sửa→xanh, Docker images, README, LaTeX/PDF và sơ đồ. Phân biệt local/CD cấu hình với production đã deploy. Ghi nhận feedback thật của giảng viên thành issue (1–2 phút).

Nếu quay video, ghi màn hình phiên demo thật; không dựng ảnh giả để chứng minh CI hay URL. Có video quay tự động từ phiên ứng dụng thật tại demo/BrewLite_Demo.webm; không lồng tiếng. Kịch bản trên dùng cho demo trực tiếp có giải thích.
