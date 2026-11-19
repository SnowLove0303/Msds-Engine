with open(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\docx-engine.js", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find("export function addRowAfter")
print(text[idx:idx+1500])
