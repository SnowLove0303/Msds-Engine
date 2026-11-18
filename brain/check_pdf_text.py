import sys
import fitz

sys.stdout.reconfigure(encoding='utf-8')

doc = fitz.open(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1736\EP-1736 msds_EN Guanzhi.pdf')
page1 = doc[0]
print('=== PAGE 1 TEXT IN PDF ===')
print(page1.get_text()[:1500])
