import os
import re

src_dir = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src"
for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith(".js"):
            p = os.path.join(root, f)
            with open(p, "r", encoding="utf-8", errors="ignore") as file:
                lines = file.readlines()
            for idx, line in enumerate(lines):
                if any(k in line for k in ["table[7]", "tables[7]", "Section 8", "section 8", "工程控制", "暴露控制", "控制参数", "OEL", "TWA"]):
                    print(f"{f}:{idx+1}: {line.strip()[:100]}")
