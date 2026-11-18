import pypdf
import sys

sys.stdout.reconfigure(encoding='utf-8')
reader = pypdf.PdfReader('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.pdf')
print('=== PAGE 5 ===')
print(reader.pages[4].extract_text())
print('=== PAGE 6 ===')
print(reader.pages[5].extract_text())
