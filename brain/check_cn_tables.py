import sys
import zipfile
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')
W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

with zipfile.ZipFile(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1736\EP-1736 msds_CN 冠志.docx') as z:
    xml = z.read('word/document.xml')

root = ET.fromstring(xml)
tables = root.findall(f'.//{{{W_NS}}}tbl')

for s_idx in [0, 6, 10, 12, 13, 15]:
    tbl = tables[s_idx]
    print(f'=== TABLE {s_idx} ===')
    for r_idx, row in enumerate(tbl.findall(f'{{{W_NS}}}tr')):
        cells_text = [''.join(c.itertext()).strip().replace('\n', ' ') for c in row.findall(f'{{{W_NS}}}tc')]
        print(f'  Row {r_idx}: {cells_text}')
