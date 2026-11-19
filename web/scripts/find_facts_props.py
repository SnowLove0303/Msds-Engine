import re

with open(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\pipeline-engine.js", "r", encoding="utf-8") as f:
    text = f.read()

matches = set(re.findall(r"facts\.(\w+)", text))
print("Properties accessed on facts:")
for m in sorted(matches):
    print(f"  facts.{m}")
