"""Build the editable SGU LaTeX report from versioned project evidence."""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'report'; OUT.mkdir(exist_ok=True)

def esc(s):
    mapping={'\\':r'\textbackslash{}','&':r'\&','%':r'\%','$':r'\$','#':r'\#','_':r'\_','{':r'\{','}':r'\}','~':r'\textasciitilde{}','^':r'\textasciicircum{}'}
    return ''.join(mapping.get(c,c) for c in s)

def inline(s):
    tokens=re.split(r'(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?://[^\s]+)',s)
    out=[]
    for t in tokens:
        if t.startswith('`') and t.endswith('`'):
            v=esc(t[1:-1]).replace('/',r'/\allowbreak{}').replace('-',r'-\allowbreak{}').replace('.',r'.\allowbreak{}').replace(r'\_',r'\_\allowbreak{}')
            out.append(r'{\small\ttfamily '+v+'}')
        elif t.startswith('**'):out.append(r'\textbf{'+esc(t[2:-2])+'}')
        elif t.startswith('['):
            m=re.match(r'\[([^\]]+)\]\(([^)]+)\)',t)
            out.append(esc(m[1])+(r' (\url{'+m[2]+'})' if m[2].startswith('http') else ''))
        elif t.startswith('http'):out.append(r'\url{'+t+'}')
        else:out.append(esc(t).replace('/',r'/\allowbreak{}'))
    return ''.join(out)

def md(path):
    lines=(ROOT/path).read_text(encoding='utf8').splitlines()
    result=[];i=0
    while i<len(lines):
        l=lines[i].strip()
        if not l:i+=1;result.append('');continue
        if l.startswith('```'):
            code=[];i+=1
            while i<len(lines) and not lines[i].strip().startswith('```'):
                code.append(esc(lines[i]));i+=1
            result.append(r'\begin{quote}\small\ttfamily\raggedright'+'\n'+r'\par'.join(code)+r'\end{quote}');i+=1;continue
        if l.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                cells=[c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.match(r'^:?-+:?$',c) for c in cells):rows.append(cells)
                i+=1
            n=len(rows[0]); widths={2:[.25,.71],3:[.14,.36,.44],4:[.12,.18,.12,.50],5:[.12,.16,.17,.23,.24],6:[.10,.27,.09,.07,.10,.29],7:[.08,.28,.08,.05,.09,.09,.23]}.get(n,[.93/n]*n)
            spec='@{}'+' '.join(r'>{\raggedright\arraybackslash}p{'+str(round(w,3))+r'\linewidth}' for w in widths)+'@{}'
            result.append(r'\begingroup\fontsize{9}{11}\selectfont\setlength{\tabcolsep}{3pt}\renewcommand{\arraystretch}{1.35}'+'\n'+r'\begin{longtable}{'+spec+'}\n'+r'\toprule')
            for k,row in enumerate(rows):
                cells=[inline(c) for c in row]
                if k==0:cells=[r'\textbf{'+c+'}' for c in cells]
                result.append(' & '.join(cells)+r' \\')
                if k==0:result.append(r'\midrule\endhead')
                else:result.append(r'\addlinespace[2pt]')
            result.append(r'\bottomrule\end{longtable}\endgroup');continue
        h=re.match(r'^(#{1,4})\s+(.+)$',l)
        if h:
            kind=['section','subsection','subsubsection','paragraph'][len(h[1])-1]
            result.append('\\'+kind+'{'+inline(h[2])+'}');i+=1;continue
        if re.match(r'^[-*] ',l):
            result.append(r'\begin{itemize}')
            while i<len(lines) and re.match(r'^[-*] ',lines[i].strip()):
                result.append(r'\item '+inline(lines[i].strip()[2:]));i+=1
            result.append(r'\end{itemize}');continue
        if re.match(r'^\d+\. ',l):
            result.append(r'\begin{enumerate}')
            while i<len(lines) and re.match(r'^\d+\. ',lines[i].strip()):
                result.append(r'\item '+inline(re.sub(r'^\d+\. ','',lines[i].strip())));i+=1
            result.append(r'\end{enumerate}');continue
        result.append(inline(l)+'\n');i+=1
    return '\n'.join(result)

info=OUT/'thong-tin.tex'
if not info.exists():info.write_text(r'''% Điền thông tin thật trước khi nộp; không sửa file PDF trực tiếp.
\newcommand{\TenNhom}{\makebox[6cm]{\dotfill}}
\newcommand{\LopHoc}{\makebox[6cm]{\dotfill}}
\newcommand{\GiangVien}{Từ Lãng Phiêu}
\newcommand{\ThanhVien}{\makebox[9cm]{\dotfill}\\[0.35cm]\makebox[9cm]{\dotfill}\\[0.35cm]\makebox[9cm]{\dotfill}}
''',encoding='utf8')

preamble=r'''\documentclass[a4paper,12pt,oneside]{report}
\usepackage{fontspec}
\IfFontExistsTF{Times New Roman}{\setmainfont{Times New Roman}}{\setmainfont{TeX Gyre Termes}}
\IfFontExistsTF{Arial}{\setsansfont{Arial}}{\setsansfont{TeX Gyre Heros}}
\IfFontExistsTF{Consolas}{\setmonofont{Consolas}[Scale=0.85]}{\setmonofont{Latin Modern Mono}[Scale=0.85]}
\usepackage[left=28mm,right=22mm,top=25mm,bottom=25mm,headheight=18pt]{geometry}
\usepackage{graphicx,array,longtable,booktabs,setspace,fancyhdr,pdflscape,xcolor,caption}
\usepackage[unicode,breaklinks=true,colorlinks=true,linkcolor=black,urlcolor=blue]{hyperref}
\urlstyle{same}
\setstretch{1.18}
\setlength{\parskip}{5pt}
\setlength{\parindent}{0pt}
\setcounter{tocdepth}{1}
\renewcommand{\contentsname}{Mục lục}
\renewcommand{\chaptername}{Chương}
\renewcommand{\figurename}{Hình}
\renewcommand{\tablename}{Bảng}
\pagestyle{fancy}\fancyhf{}
\fancyhead[L]{\small Trường Đại học Sài Gòn}
\fancyhead[R]{\small Công nghệ Phần mềm}
\fancyfoot[L]{\small BrewLite Assignment 1 và 2}
\fancyfoot[R]{\thepage}
\emergencystretch=3em
\IfFileExists{thong-tin.tex}{
  \input{thong-tin.tex}\def\AssetDir{assets/}\def\DiagramDir{../docs/diagrams/}
}{
  \input{report/thong-tin.tex}\def\AssetDir{report/assets/}\def\DiagramDir{docs/diagrams/}
}
\begin{document}
\begin{titlepage}\centering
{\large TRƯỜNG ĐẠI HỌC SÀI GÒN\\ KHOA CÔNG NGHỆ THÔNG TIN}\par
\vspace{1.1cm}
\includegraphics[width=3cm]{\AssetDir logoITSGU.png}\par
\vspace{1cm}
{\Large\bfseries BÁO CÁO BÀI TẬP LỚN}\par
\vspace{0.4cm}
{\Large CÔNG NGHỆ PHẦN MỀM}\par
\vspace{1.0cm}
{\Huge\bfseries BrewLite}\par
\vspace{0.4cm}
{\Large Ứng dụng đặt cà phê không dùng tiền mặt}\par
\vspace{0.5cm}
{\large Assignment 1 và Assignment 2}\par
{\large Từ yêu cầu đến triển khai}\par
\vspace{1.1cm}
\begin{tabular}{rl}
Giảng viên hướng dẫn & \GiangVien\\[0.3cm]
Nhóm & \TenNhom\\[0.3cm]
Lớp & \LopHoc
\end{tabular}\par
\vspace{0.7cm}
{\large Thành viên và mã số sinh viên}\par\vspace{0.35cm}
\ThanhVien\par
\vfill
{Học kỳ I năm học 2026–2027}\par
{TP. Hồ Chí Minh, tháng 11 năm 2026}
\end{titlepage}
\pagenumbering{roman}\tableofcontents\clearpage
\pagenumbering{arabic}
\chapter{Giới thiệu đề tài}
BrewLite giải quyết luồng chọn đồ uống, tùy chỉnh, đặt và thanh toán không dùng tiền mặt tại một cửa hàng cà phê. Sản phẩm sử dụng Next.js cho giao diện mobile first, NestJS cho REST API, PostgreSQL và Prisma cho dữ liệu. Thanh toán Ví và Thẻ là mô phỏng theo phạm vi đề bài.

Báo cáo kết hợp 10 task của Assignment 1 và 5 task tuần tự của Assignment 2. Nội dung trình bày phạm vi, yêu cầu có tiêu chí chấp nhận, mô hình UML, kiến trúc và ADR, kế hoạch Scrum, hiện thực, kiểm thử và bàn giao. Các link GitHub và kết quả kiểm thử là bằng chứng có thể kiểm tra; mục triển khai production chỉ được nghiệm thu sau khi có URL HTTPS hoạt động.

Công cụ hỗ trợ: nhóm sử dụng trợ lý lập trình AI (Claude Code và OpenAI Codex) để hỗ trợ viết mã, kiểm thử, rà soát code và soạn tài liệu. Mọi thay đổi đi qua commit/pull request, được kiểm chứng bằng test tự động và CI; nhóm chịu trách nhiệm về nội dung và kết quả nghiệm thu.

\section{Liên kết sản phẩm}
Repository nộp bài: \url{https://github.com/Kenkra9999/Brew_Lite_2}. Repository này nhận nguyên lịch sử commit, tag v1.0.0 và Product Backlog từ repository làm việc ban đầu \url{https://github.com/Kenkra9999/brewlite2}, nơi có pull request hoàn thiện \url{https://github.com/Kenkra9999/brewlite2/pull/1}. Báo cáo và tài liệu nguồn nằm cùng repository để truy vết thay đổi.
'''
body=[preamble]
def chapter(title,paths):
    body.append(r'\chapter{'+title+'}')
    for p in paths:body.append(md(p))

chapter('Khai thác và đặc tả yêu cầu',['docs/requirements/context-and-scope.md','docs/requirements/srs.md','docs/requirements/use-case-checkout.md'])
body.append(r'\chapter{Mô hình hóa hệ thống}')
body.append('Các sơ đồ sau có nguồn PlantUML và bản SVG/PNG trong docs/diagrams. Sequence mô tả cả transaction tạo đơn và hai transaction thanh toán; state machine phân biệt quyền gateway với thao tác nhân viên. Class diagram thể hiện multiplicity và enum tương ứng Prisma schema.')
from PIL import Image
figs=[('usecase-system','Use case tổng quát'),('usecase-checkout','Use case trọng tâm đặt và thanh toán'),('activity-checkout','Activity đặt và thanh toán với swimlane'),('sequence-checkout','Sequence đặt và thanh toán idempotent'),('class-domain','Class diagram domain và enum'),('state-order','Máy trạng thái đơn hàng')]
for name,title in figs:
    p=ROOT/f'docs/diagrams/{name}.png'; w,h=Image.open(p).size
    landscape=w/h>1.4
    body.append(r'\clearpage'+(r'\begin{landscape}' if landscape else '')+r'\section{'+title+'}'+r'\begin{center}\includegraphics[width='+('235mm' if landscape else '160mm')+',height='+('118mm' if landscape else '180mm')+r',keepaspectratio]{\DiagramDir '+name+r'.png}\captionof{figure}{'+title+r'}\end{center}\clearpage'+(r'\end{landscape}' if landscape else ''))

chapter('Thiết kế kiến trúc',['docs/architecture/architecture.md'])
for p in sorted((ROOT/'docs/architecture/adr').glob('*.md')):body.append(md(p.relative_to(ROOT)))
body.append(r'\clearpage\section{Deployment diagram}\begin{figure}[ht]\centering\includegraphics[width=160mm,height=205mm,keepaspectratio]{\DiagramDir deployment.png}\caption{Local và CI cùng topology VPS production được chuẩn bị. Chưa gắn host production thật.}\end{figure}\clearpage')
chapter('Quản lý Agile Scrum',['docs/scrum/product-backlog.md','docs/scrum/sprints.md','docs/scrum/review-retrospective.md'])
body.append(r'''\chapter{Hiện thực phần mềm}
\section{Frontend Next.js}
Menu gọi API thật và hiển thị các trạng thái loading, empty và error. Khách lọc danh mục, tìm đồ uống, chọn size S/M/L và topping. Zustand persist giữ giỏ trên thiết bị, mỗi tổ hợp sản phẩm/size/topping là một dòng; số lượng nguyên trong phạm vi 1–20. Giao diện dùng nhãn form, thông báo lỗi và bố cục responsive. Manifest và service worker hỗ trợ cài PWA và trang offline; không cache giao dịch hoặc API chứa dữ liệu cá nhân.
\section{Xác thực và phân quyền}
DTO chuẩn hóa email, kiểm tra độ dài và định dạng. Mật khẩu băm bcrypt; JWT có subject và role. API kiểm tra quyền sở hữu đơn, trả 404 khi khách truy cập đơn người khác; chỉ STAFF cập nhật trạng thái. Token lưu ở sessionStorage cho phiên demo; cookie HttpOnly và cơ chế chống XSS/CSRF đầy đủ là hướng hoàn thiện trước vận hành thực.
\section{Tạo đơn và optimistic locking}
Server lấy lại giá và topping từ DB, gộp số lượng theo productId và cập nhật tồn kho theo thứ tự id. Câu lệnh update chỉ thành công khi version khớp và stock đủ. Nếu count bằng 0, toàn transaction rollback và retry có backoff, tối đa 8 lần. Tạo đơn, snapshot items, giữ kho và sử dụng promotion nằm cùng transaction.
\begin{quote}\small\ttfamily
UPDATE Product SET stock = stock - qty, version = version + 1\par
WHERE id = productId AND version = expectedVersion AND stock >= qty;
\end{quote}
\section{Thanh toán idempotent}
Payment có unique Idempotency-Key, hash của user/order/method và số tiền lấy từ đơn. Khi claim, API khóa dòng Order và đọc lại key sau khóa để request đồng thời không bị xem là một payment khác. Gọi gateway ngoài transaction, sau đó finalize payment, state và loyalty nguyên tử; retry finalize dùng kết quả đã nhận, không charge lại. Replay cùng key trả cùng payment; dùng key cho payload khác bị từ chối 422. Mỗi lần thử mới sau FAILED sử dụng key mới trên cùng đơn.
\section{Hủy và chuyển trạng thái}
Các thao tác hủy/thay đổi state khóa cùng dòng Order. Không hủy trong lúc payment PROCESSING. State machine chặn chuyển sai; hủy hợp lệ hoàn kho, trả lượt promotion và thu hồi loyalty khi PAID bị hủy tại quầy. Đây là hoàn tiền mô phỏng, không phải refund ngân hàng.
\section{Khôi phục checkout}
UI giữ orderId và key trong sessionStorage khi chưa rõ kết quả thanh toán, giữ giỏ nếu thất bại và thử lại trên cùng order. Pending được xóa phù hợp khi đổi tài khoản; hủy một đơn khác không được xóa nhầm pending. Nếu kết quả tạo đơn không rõ, UI yêu cầu xem lịch sử và không tự động gửi POST tạo đơn lần nữa. API tạo đơn chưa có idempotency riêng; process crash giữa claim và finalize cần reconciliation trước khi tích hợp cổng thật.
''')
screens=[('menu-desktop','Giao diện thực đơn trên desktop'),('menu-mobile','Giao diện thực đơn trên điện thoại'),('checkout','Giao diện thanh toán mô phỏng'),('confirmation','Xác nhận đơn hàng thực tế')]
for name,title in screens:
    if (OUT/f'assets/{name}.png').exists():
        body.append(r'\clearpage\begin{figure}[p]\centering\includegraphics[width=160mm,height=205mm,keepaspectratio]{\AssetDir '+name+r'.png}\caption{'+title+r'}\end{figure}\clearpage')
chapter('Kiểm thử và bằng chứng',['docs/quality/verification.md'])
perf=ROOT/'docs/quality/performance.json'
if perf.exists():
    import json
    d=json.loads(perf.read_text())
    body.append(r'\section{Đo hiệu năng local}'+f"Đo {d['samples']} request GET /products tuần tự sau {d['warmup']} lần warmup: p50 {d['p50ms']} ms, p95 {d['p95ms']} ms, lớn nhất {d['maxMs']} ms. Ngưỡng p95 của bài là 500 ms. Thời điểm đo {esc(d['at'])}; Node {esc(d['node'])}, {esc(d['platform'])}. Đây là phép đo local trên seed nhỏ, không phải cam kết SLA production.")
chapter('Triển khai và bàn giao',['docs/deployment.md','docs/demo-script.md','CHANGELOG.md'])
chapter('Truy vết và đối chiếu tiêu chí',['docs/traceability-matrix.md','docs/submission-checklist.md'])
chapter('Tài liệu tham khảo',['docs/references.md'])
body.append(r'\end{document}')
(OUT/'BaoCao_BrewLite.tex').write_text('\n\n'.join(body),encoding='utf8')
print('Wrote',OUT/'BaoCao_BrewLite.tex')
