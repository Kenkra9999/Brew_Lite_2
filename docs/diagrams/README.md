# Sơ đồ UML

Mỗi sơ đồ có nguồn `.puml` và bản `.svg`/`.png`: usecase-system, usecase-checkout, activity-checkout, sequence-checkout, class-domain, state-order, deployment. PlantUML dùng layout Smetana nên không cần Graphviz.

Tải PlantUML JAR từ https://plantuml.com/download (đã dùng 1.2026.2). Java 17+. Đặt JAR tại tools/plantuml.jar (không commit binary), chạy:

```sh
java -Djava.awt.headless=true -jar tools/plantuml.jar -tsvg docs/diagrams/*.puml
java -Djava.awt.headless=true -jar tools/plantuml.jar -tpng docs/diagrams/*.puml
```

PowerShell cần bọc tham số `'-Djava.awt.headless=true'` trong dấu nháy. Các PNG được đưa vào báo cáo LaTeX. Deployment là topology production chuẩn bị cho VPS, chưa được gắn với host thật; phải cập nhật khi có hạ tầng.
