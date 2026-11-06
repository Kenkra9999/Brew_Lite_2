# ADR 004 Thanh toán mock idempotent

Ngày: 2026-11-06. Trạng thái: Accepted (quyết định thiết kế; không phải minh chứng production).

## Bối cảnh và quyết định
Unique key toàn DB, hash user/order/method, khóa dòng Order và hai transaction bao quanh gateway. Replay trả cùng payment; lỗi payload trả 422. Sự cố crash cần reconciliation trước cổng thật; không tuyên bố exactly-once xuyên sự cố.

## Hệ quả
Được truy vết trong architecture.md, schema/mã nguồn và sơ đồ; thay đổi quyết định phải bổ sung ADR thay thế thay vì sửa lịch sử.
