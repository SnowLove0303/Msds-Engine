import sys
import zipfile
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')
W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

with zipfile.ZipFile(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\public\templates\正式模板_MSDS_CN_冠志(1).docx') as z:
    xml = z.read('word/document.xml')

root = ET.fromstring(xml)
tables = root.findall(f'.//{{{W_NS}}}tbl')

for t_idx in [0, 1, 2, 6, 7]:
    tbl = tables[t_idx]
    tblGrid = tbl.find(f'{{{W_NS}}}tblGrid')
    gridCols = [col.attrib.get(f'{{{W_NS}}}w') for col in tblGrid.findall(f'{{{W_NS}}}gridCol')] if tblGrid is not None else []
    print(f'Table {t_idx} GridCols: {gridCols}')
