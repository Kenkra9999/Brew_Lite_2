# Quy ước cộng tác

## Chiến lược nhánh
- `main`: nhánh ổn định, luôn build và test xanh. Được bảo vệ trên GitHub: bắt buộc check `quality`, nhánh phải cập nhật với `main` trước khi merge, linear history, cấm force push và xóa nhánh, áp dụng cả với admin.
- Nhánh làm việc tách từ `main`, đặt tên theo loại việc: `feat/<mô-tả>`, `fix/<mô-tả>`, `docs/<mô-tả>`, `test/<mô-tả>`, `ci/<mô-tả>`, `chore/<mô-tả>`.
- Mỗi nhánh gắn với một issue trong Product Backlog (milestone Sprint 1 hoặc Sprint 2).

## Pull request
1. Push nhánh và mở PR vào `main` theo mẫu `.github/pull_request_template.md`.
2. Mô tả mục đích, liên kết issue (`Closes #<số>`), cách kiểm thử và ảnh hưởng tới tài liệu/sơ đồ.
3. Workflow *Quality Gate* chạy tự động: Install → Lint → Typecheck → Unit test → Integration test (PostgreSQL) → Build → E2E (desktop + mobile).
4. Thành viên khác review; chỉ merge khi CI xanh. Dùng *Squash and merge* để giữ lịch sử tuyến tính.
5. Thay đổi yêu cầu, sơ đồ hoặc kiến trúc cũng phải qua PR và ghi rõ lý do (ADR mới trong `docs/architecture/adr` nếu là quyết định kiến trúc).

## Quy ước commit
Theo [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<phạm vi tùy chọn>): <mô tả ngắn ở thể mệnh lệnh>
```

| Type | Dùng khi |
|---|---|
| `feat` | Thêm chức năng |
| `fix` | Sửa lỗi |
| `test` | Thêm/sửa test |
| `docs` | Tài liệu, sơ đồ, báo cáo |
| `ci` | Workflow CI/CD |
| `refactor` | Đổi cấu trúc code, không đổi hành vi |
| `chore` | Cấu hình, dependency, việc phụ trợ |

Ví dụ: `feat(payments): hỗ trợ Idempotency-Key cho POST /payments`, `docs(task2): thêm sequence diagram checkout`.

## Definition of Done
Một story/task được tính là xong khi:
- Code build được, lint và typecheck đạt; đáp ứng tiêu chí chấp nhận của story.
- Có test cho phần nghiệp vụ và rủi ro chính; toàn bộ test hiện có vẫn xanh.
- API validate dữ liệu đầu vào; UI xử lý trạng thái loading/empty/error.
- Không commit secret; `.env.example`, migration và README được cập nhật nếu thay đổi.
- Nguồn sơ đồ (`.puml`) và ảnh kết xuất đồng bộ; ma trận truy vết cập nhật.
- PR được review, CI xanh và đã merge vào `main`.

Definition of Ready và vai trò Scrum: xem [docs/scrum/product-backlog.md](docs/scrum/product-backlog.md).
