import re

with open(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\pipeline-engine.js", "r", encoding="utf-8") as f:
    text = f.read()

for m in re.finditer(r"chemicalClassification|化学品分类", text):
    start = max(0, m.start() - 150)
    end = min(len(text), m.end() + 150)
    print(text[start:end])
    print("="*40)
