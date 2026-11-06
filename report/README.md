# Báo cáo LaTeX BrewLite

File chính `BaoCao_BrewLite.tex`, bản biên dịch `BaoCao_BrewLite.pdf`. Điền tên nhóm, lớp, thành viên/MSSV trong `thong-tin.tex` và xác nhận GVHD. Giữ cấu trúc repository vì sơ đồ được lấy từ `../docs/diagrams`.

Chọn **XeLaTeX**, biên dịch hai lần để cập nhật mục lục. Trên Windows chạy `./build.ps1` hoặc lệnh `xelatex -interaction=nonstopmode -halt-on-error BaoCao_BrewLite.tex` hai lần từ thư mục `report`.

Trên Overleaf: upload cả `report/` và `docs/diagrams/`, chọn compiler XeLaTeX và main document `report/BaoCao_BrewLite.tex`. Font Times New Roman/Arial/Consolas dùng nếu có, nếu không tự chuyển TeX Gyre Termes/Heros và Latin Modern Mono. Logo SGU có sẵn trong assets. Cần các package fontspec, geometry, graphicx, array, longtable, booktabs, setspace, fancyhdr, pdflscape, xcolor, hyperref.

Nếu sửa các tài liệu Markdown nguồn rồi muốn dựng lại toàn bộ nội dung TeX, chạy `python tools/build_report.py` ở root trước khi biên dịch. Python cần Pillow cho kiểm tra kích thước hình; không cần Python nếu chỉ sửa và biên dịch `.tex` có sẵn. Generator giữ nguyên file `thong-tin.tex` đã điền.

Các bằng chứng production, thông tin nhóm và buổi nghiệm thu được ghi đúng tình trạng thực tế; không thay bằng URL hoặc danh tính giả.
