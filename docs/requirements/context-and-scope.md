# Bối cảnh và phạm vi BrewLite

Môn Công nghệ Phần mềm, Đại học Sài Gòn, HK I 2026–2027. Nguồn yêu cầu: `BrewLite-CongNghePhanMem.pdf` (Assignment 1, 10 task) và `Assignment2-BrewLite.pdf` (Assignment 2, 5 task). Hai tài liệu được kết hợp trên cùng sản phẩm, không thay thế Next.js, NestJS hoặc PostgreSQL.

## Vấn đề và mục tiêu
Khách phải chờ chọn đồ uống và trả tiền tại quầy. BrewLite cho phép xem menu, chọn size/topping, đặt và trả tiền mô phỏng trước, nhận mã đơn và theo dõi quá trình pha chế. Thành công của MVP là hoàn tất luồng này với dữ liệu lưu thật, giá tính ở server, không thu tiền lặp và không âm tồn kho.

| Stakeholder | Mục tiêu | Tiêu chí quan tâm |
|---|---|---|
| Khách hàng | Đặt nhanh, biết giá và tình trạng đơn | Giỏ rõ ràng, thử lại an toàn, chỉ xem đơn mình |
| Nhân viên quầy | Biết đơn đã trả tiền, cập nhật pha chế | Role STAFF và chuyển trạng thái hợp lệ |
| Quản lý cửa hàng / PO | Ưu tiên phạm vi, kiểm soát bán hàng | Menu, kho, mã giảm giá và demo nghiệm thu |
| Giảng viên / khách hàng nghiệm thu | Đánh giá quy trình và sản phẩm | Yêu cầu, UML, test, Git, CI/CD, URL hoạt động |
| Nhóm phát triển | Tái tạo và bảo trì hệ thống | Migration, seed, Docker, test và ADR |
| Đơn vị thanh toán mô phỏng | Trả kết quả thanh toán có thể kiểm chứng | Một kết quả cho mỗi Idempotency-Key |

## In scope
Menu có hình/giá; chi tiết; size S/M/L; topping; giỏ có lưu trên trình duyệt; đăng ký/đăng nhập JWT; đơn PENDING; thanh toán WALLET/CARD giả lập; xác nhận, lịch sử và theo dõi; khuyến mãi; điểm thưởng; optimistic locking tồn kho; idempotency; bàn nhân viên cập nhật trạng thái; Docker, CI, cấu hình CD, tài liệu và kiểm thử. Quầy nhân viên là phần mở rộng của Assignment 1 để minh họa state machine và đáp ứng quản lý trạng thái của Assignment 2.

## Out of scope
Thu tiền thật, giao hàng, nhiều chi nhánh, hoàn tiền ngân hàng thật, quản lý công thức nguyên liệu, hóa đơn thuế, loyalty đổi điểm, đăng nhập mạng xã hội. Không lưu số thẻ. Tồn kho được mô hình hóa bằng số phần đồ uống còn bán được, không phải gram nguyên liệu.

## Giả định và ràng buộc
- Một cửa hàng, đơn vị tiền VND nguyên, không có phí giao hàng hay thuế cộng thêm.
- Size S giá gốc, M +5.000, L +10.000. Topping tính theo từng ly, tối đa 4 loại; mỗi dòng 1–20 ly, mỗi đơn tối đa 20 dòng.
- Kho được giữ khi tạo PENDING; PAYMENT_FAILED giữ kho để thử lại; hủy hợp lệ hoàn kho và lượt mã đúng một lần. Chưa có tác vụ tự hết hạn đơn treo.
- WALLET giả lập có hạn mức 2 triệu/giao dịch; CARD chỉ dùng số thử nghiệm. PAID cộng floor(total/10.000) điểm một lần.
- Công nghệ bắt buộc Next.js + NestJS + PostgreSQL; dùng Prisma migration; Node 22 và Docker Compose v2.
- Dữ liệu demo và tài khoản demo chỉ phục vụ chấm bài; production thật phải bỏ tài khoản demo và cấu hình secret riêng.
- Các bằng chứng CI, production và buổi Scrum chỉ được ghi nhận khi thực sự có; không coi cấu hình pipeline là một lần deploy thành công.

## Rủi ro ban đầu
| Rủi ro | Tác động | Biện pháp |
|---|---|---|
| Hai khách mua phần cuối | Bán quá kho | Transaction, version, điều kiện stock >= qty, retry và test đồng thời |
| Client lặp thanh toán | Thu tiền/điểm lặp | Unique key, khóa dòng Order, hash request, replay |
| Mạng mất sau khi trả tiền | Khách không biết kết quả | Giữ key và orderId trên phiên, tải lại đơn, retry cùng key |
| API chết giữa hai transaction thanh toán | Payment kẹt PROCESSING | Health/log; ghi rõ giới hạn mock, cần reconciliation/outbox trước thanh toán thật |
| Không có tài khoản hosting/domain | Không nghiệm thu production A2 Task 5.4 | Chuẩn bị Compose production + CD + runbook, ghi trạng thái thật và chờ môi trường |
| Thiếu thông tin thành viên | Bìa chưa định danh | Để trống, không tạo tên/MSSV giả |
