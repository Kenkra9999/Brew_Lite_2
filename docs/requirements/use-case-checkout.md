# UC 04 Đặt và thanh toán đơn hàng

| Thuộc tính | Nội dung |
|---|---|
| Actor chính | Khách hàng đã có giỏ |
| Actor phụ | Dịch vụ thanh toán giả lập |
| Trigger | Khách chọn Thanh toán từ giỏ |
| Tiền điều kiện | API và DB sẵn sàng, sản phẩm active; trước khi tạo đơn cần JWT hợp lệ |
| Hậu điều kiện thành công | Một Order PAID, Payment SUCCEEDED, kho đã giữ, điểm cộng một lần, UI hiển thị mã và xóa giỏ |
| Hậu điều kiện thất bại | Tạo đơn thất bại rollback toàn bộ; payment thất bại Order PAYMENT_FAILED, giỏ giữ nguyên; không charge thành công |
| Yêu cầu | FR-03..FR-15, FR-18..FR-21, NFR-02,03,05 |
| Sơ đồ | usecase-checkout, activity-checkout, sequence-checkout, class-domain |

## Luồng chính
1. Khách xem menu, mở chi tiết và chọn size, topping, qty.
2. UI thêm vào giỏ và tính tổng tạm tính. Khách xem lại giỏ, nhập note/mã giảm giá nếu có.
3. Nếu chưa đăng nhập, UI chuyển sang form và quay lại checkout sau khi JWT được cấp.
4. Khách chọn WALLET hoặc CARD thử nghiệm và xác nhận.
5. UI gọi POST /orders. NestJS kiểm tra JWT, DTO, giá và kho trong transaction; optimistic lock trừ kho; kiểm tra mã, tạo snapshot items và PENDING; commit.
6. UI lưu orderId và sinh Idempotency-Key; gọi POST /payments trên chính đơn đó.
7. API khóa dòng Order, kiểm tra chủ đơn, state, payment đang xử lý và key; tạo Payment PROCESSING; commit.
8. Gọi mock gateway ngoài transaction; sau kết quả, transaction khóa Order, lưu Payment SUCCEEDED, chuyển PAID và cộng điểm.
9. API trả kết quả. UI xóa giỏ, hiện mã đơn và polling GET /orders/:id để theo dõi.

## Luồng thay thế
A1 ở bước 3: đăng ký tài khoản rồi trở lại checkout; từ chối xác thực thì giỏ không mất.
A2 ở bước 5: hết hàng → 409; transaction rollback, giỏ giữ nguyên để sửa.
A3 ở bước 5: mã sai/hết hạn → 422; không tạo đơn, không mất kho.
A4 ở bước 8: thẻ bị từ chối → Payment FAILED, Order PAYMENT_FAILED; giỏ và orderId giữ nguyên. Khách đổi thẻ/phương thức, sinh key mới trên cùng orderId.
A5 ở bước 6: gửi lại cùng key → trả payment cũ, không trừ kho hay cộng điểm lặp.
A6: khách hủy đơn chưa thanh toán và không có PROCESSING → CANCELLED, hoàn kho/mã, giỏ vẫn có thể sửa.
A7: hai client tranh phần cuối → một transaction thắng, bên còn lại retry rồi 409 nếu hết kho.

## Ngoại lệ
E1: JWT hết hạn → 401, yêu cầu đăng nhập lại, không tự xóa giỏ.
E2: cùng key nhưng khác order/method/user → 422 IDEMPOTENCY_KEY_REUSED.
E3: mất mạng sau POST /payments → giữ key, gửi lại chính yêu cầu để lấy kết quả; không tạo đơn mới.
E4: key vẫn PROCESSING sau 5 giây → 409 PAYMENT_IN_PROGRESS; UI cho retry cùng key. Nếu API crash ở khoảng giữa hai transaction, mock hiện chưa có bộ reconciliation tự động; cần xử lý vận hành, không hứa bảo đảm exactly-once qua mọi sự cố.
E5: lỗi 5xx trước khi client nhận POST /orders có thể đã commit: API tạo đơn chưa có create-order idempotency. UI không tự retry POST /orders và hướng dẫn xem lịch sử trước khi tạo lại.

## Kịch bản chấp nhận
Given giỏ Cappuccino M x1 và Trà đào L + trân châu x2, When WALLET thành công, Then subtotal 158.000, PAID và 15 điểm. Given thẻ 4000000000000002, Then PAYMENT_FAILED và không xóa giỏ. Given hai POST /payments đồng thời cùng key, Then cùng payment id và đúng một charge. Các trường hợp này được kiểm chứng bằng test integration/E2E; xem ma trận truy vết.
