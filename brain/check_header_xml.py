import sys
import zipfile
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')
W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

with zipfile.ZipFile(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1736\EP-1736 msds_CN 冠志.docx') as z:
    for name in z.namelist():
        if 'header' in name:
            print(f'=== {name} ===')
            xml = z.read(name)
            root = ET.fromstring(xml)
            for p in root.findall(f'.//{{{W_NS}}}p'):
                txt = ''.join(p.itertext()).strip()
                if txt:
                    print('  P:', txt)
