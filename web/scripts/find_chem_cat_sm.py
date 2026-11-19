import re

with open(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\smart-matching.js", "r", encoding="utf-8") as f:
    text = f.read()

for m in re.finditer(r"化学品分类|chemical_category|category", text):
    start = max(0, m.start() - 150)
    end = min(len(text), m.end() + 150)
    print(text[start:end])
    print("="*40)
