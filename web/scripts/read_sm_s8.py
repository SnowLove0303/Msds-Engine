with open(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\smart-matching.js", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i in range(3970, min(len(lines), 4080)):
    print(f"{i+1}: {lines[i].rstrip()}")
