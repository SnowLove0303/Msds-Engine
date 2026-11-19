with open(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\docx-engine.js", "r", encoding="utf-8") as f:
    text = f.read()

import re
matches = re.findall(r"export\s+(?:async\s+)?function\s+(\w+)", text)
print("Exported functions in docx-engine.js:")
for m in matches:
    print(f"  {m}")
