import re

for fn in ["web/scripts/audit_bipolar_bilayer.mjs", "web/scripts/audit_translation_dual_display.mjs"]:
    with open(f"F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/{fn}", "r", encoding="utf-8") as f:
        text = f.read()
    print(f"=== {fn} ===")
    for m in re.finditer(r"(?:Section 8|Table 7|OEL|工程控制|8\.2|14\.2|运输名称|外观|微黄色)", text):
        start = max(0, m.start() - 100)
        end = min(len(text), m.end() + 100)
        print(text[start:end])
        print("---")
