import sys
import zipfile
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')
W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

with zipfile.ZipFile(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\public\templates\正式模板_MSDS_CN_冠志(1).docx') as z:
    xml = z.read('word/document.xml')

root = ET.fromstring(xml)
tables = root.findall(f'.//{{{W_NS}}}tbl')
tbl = tables[0]
for r_idx, row in enumerate(tbl.findall(f'{{{W_NS}}}tr')):
    cells_text = [''.join(c.itertext()).strip().replace('\n', ' ') for c in row.findall(f'{{{W_NS}}}tc')]
    print(f'  Row {r_idx}: {cells_text}')
