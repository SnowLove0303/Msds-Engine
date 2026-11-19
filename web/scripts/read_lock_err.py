with open(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\docx-engine.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(2600, 2630):
    print(f"{i+1}: {lines[i].rstrip()}")
