import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\4-1 水性环氧树脂 EP\EP-1404\EP-1404msds_CN 冠志_.pdf"
doc = fitz.open(pdf_path)

print("=== PAGE 1 ===")
print(doc[0].get_text())

print("=== PAGE 3 ===")
print(doc[2].get_text())
