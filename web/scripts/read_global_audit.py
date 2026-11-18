import os, sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

report_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\产出物审计报告\EP_5_Models_40_Assets_Global_Cognitive_Audit_Report.md"
with open(report_path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

lines = text.split('\n')
print(f"Total lines: {len(lines)}")
for l in lines[:120]:
    print(l)
