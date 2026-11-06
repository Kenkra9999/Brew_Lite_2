# Đặc tả yêu cầu phần mềm BrewLite

## Phạm vi và thuật ngữ
Đặc tả này kết hợp Assignment 1 và 2. Must là bắt buộc MVP, Should ưu tiên kế tiếp, Could ở backlog, Won’t ngoài phiên bản. PAID là kết quả mock, không phải tiền thật. Xem `context-and-scope.md` để hiểu giả định kho và giới hạn thanh toán.

## Yêu cầu chức năng
| ID | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-01 | Xem menu | Must | GET /products trả mảng id, name, price, imageUrl, stock; UI có loading, empty, error. |
| FR-02 | Xem chi tiết | Must | GET /products/:id trả chi tiết, sizes, toppings; id không tồn tại trả 404. |
| FR-03 | Chọn tùy chọn | Must | S/M/L và tối đa 4 topping; UI cập nhật giá, API tự tính giá từ DB. |
| FR-04 | Sửa giỏ | Must | Thêm, sửa qty 1–20, xóa; badge và tổng thay đổi đúng, tách dòng theo size/topping. |
| FR-05 | Lưu giỏ | Should | Reload còn giỏ, thanh toán lỗi giữ nguyên giỏ; thành công xóa giỏ. |
| FR-06 | Hiển thị tổng | Must | subtotal là tổng unitPrice*qty; discount không vượt subtotal; total=subtotal-discount. |
| FR-07 | Đăng ký | Must | Email duy nhất, password có chữ và số >=8 ký tự, lưu bcrypt hash, trả JWT. |
| FR-08 | Đăng nhập | Must | Đúng tài khoản trả JWT; sai trả 401, không tiết lộ email tồn tại. |
| FR-09 | Phân quyền | Must | Thiếu/sai JWT không đặt đơn; khách không đọc đơn người khác; chỉ STAFF đổi trạng thái. |
| FR-10 | Validate | Must | Client có ràng buộc form; API từ chối size sai, qty sai, giỏ trống và giá client gửi. |
| FR-11 | Khuyến mãi | Should | WELCOME10 giảm 10% từ 50k, tối đa 20k; GIAM15K giảm 15k từ 100k; mã sai/hết hạn bị chặn. |
| FR-12 | Tạo đơn | Must | POST /orders tạo đúng một đơn PENDING cho một lần gọi hợp lệ và snapshot tên/giá trong transaction. |
| FR-13 | Thanh toán | Must | POST /payments hỗ trợ WALLET/CARD mock; thành công Payment SUCCEEDED và Order PAID. |
| FR-14 | Lỗi và thử lại | Must | Thẻ 4000000000000002 bị từ chối, Order PAYMENT_FAILED; thử lại mới dùng key mới trên cùng đơn. |
| FR-15 | Xác nhận và theo dõi | Must | Hiển thị code, status, tổng, item và lịch sử trạng thái sau thanh toán; polling không cache API. |
| FR-16 | Lịch sử đơn | Must | GET /orders/me trả tối đa 50 đơn của người hiện tại, mới nhất trước. |
| FR-17 | State machine | Must | Chỉ cho PENDING→PAID→PREPARING→READY→COMPLETED và các nhánh lỗi/hủy đã định nghĩa; sai trả 409. |
| FR-18 | Kho đồng thời | Must | 20 yêu cầu đồng thời mua sản phẩm còn 5 phần: đúng 5 đơn, kho 0, không âm. |
| FR-19 | Loyalty | Should | Chỉ cộng floor(total/10000) sau PAID; replay không cộng lần hai; STAFF hủy PAID thu hồi điểm. |
| FR-20 | Hủy đơn | Should | Khách hủy PENDING/PAYMENT_FAILED; chặn khi thanh toán đang chạy; hoàn kho/lượt mã đúng một lần. |
| FR-21 | Idempotency | Must | Cùng key + cùng user/order/method trả cùng payment; khác payload trả 422; đồng thời không charge hai lần. |
| FR-22 | Thanh toán thật | Won’t | Không kết nối ngân hàng hoặc yêu cầu thẻ thật trong phiên bản này. |
| FR-23 | Thông báo đẩy | Could | Để backlog sau MVP; hiện dùng polling. |

## Yêu cầu phi chức năng
| ID | Nhóm | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| NFR-01 | Hiệu năng | Should | GET /products: p95 <500ms với seed 8 món, 100 request tuần tự trên máy đo đã ghi cấu hình; không áp cho gateway giả lập. |
| NFR-02 | Bảo mật | Must | bcrypt, JWT, validate, phân quyền; không log password/token/card, DB không public trong Compose production. |
| NFR-03 | Tính khả dụng | Must | /health kiểm tra DB; lỗi API hiển thị nút thử lại; Compose đợi health và restart dịch vụ. |
| NFR-04 | Tương thích | Must | Hoàn tất đặt đơn ở Chromium desktop và viewport 390x844; không tràn ngang. |
| NFR-05 | Tái lập | Must | npm ci, migration/seed và docker compose up --build tái tạo được ba dịch vụ từ README. |
| NFR-06 | Quality gate | Must | PR chạy lint, unit, integration, E2E và build; branch protection được cấu hình trước nghiệm thu merge gate. |
| NFR-07 | Triển khai | Must | HTTPS frontend/API, image tag SHA, health smoke, migration và rollback có tài liệu; nghiệm thu chỉ khi URL thực hoạt động. |
| NFR-08 | Truy cập | Should | Nhãn form, focus rõ, trạng thái lỗi role=alert, không truyền trạng thái chỉ bằng màu. |
| NFR-09 | PWA | Should | Manifest và service worker; shell offline thông báo không có mạng; API và thanh toán không cache. |

## Use case tổng quát
Nguồn và bản kết xuất: `../diagrams/usecase-system.puml` và `.svg`. UC-01 xem menu/chi tiết; UC-02 quản lý giỏ; UC-03 xác thực; UC-04 đặt và thanh toán; UC-05 lịch sử/theo dõi; UC-06 cập nhật đơn (STAFF). Use case trọng tâm trong `use-case-checkout.md`.

## Quy tắc nghiệp vụ
BR-01: tiền nguyên VND, server là nguồn giá chính thức. BR-02: kho trừ khi PENDING và hoàn khi CANCELLED. BR-03: một payment cho một idempotency key, nhiều lần thử trên cùng đơn được phép nếu lần trước FAILED. BR-04: chỉ gateway tạo PAID/PAYMENT_FAILED. BR-05: điểm thưởng và thay đổi trạng thái thanh toán nằm cùng transaction. BR-06: số thẻ chỉ ở request tới mock gateway, không lưu DB, localStorage hay log. BR-07: đơn PAID hủy tại quầy chỉ là hoàn tiền mô phỏng; chưa có ledger refund thật.
