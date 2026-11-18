import sys
import fitz

sys.stdout.reconfigure(encoding='utf-8')

doc = fitz.open(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1736\EP-1736 msds_CN 冠志.pdf')
for p_idx, page in enumerate(doc):
    print(f'=== CN PAGE {p_idx+1} ===')
    lines = [l.strip() for l in page.get_text().splitlines() if l.strip()]
    print('\n'.join(lines[:8]))
    print('...')
    print('\n'.join(lines[-4:]))
    print()
