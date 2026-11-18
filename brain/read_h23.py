import sys
import zipfile

sys.stdout.reconfigure(encoding='utf-8')

with zipfile.ZipFile(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1736\EP-1736 msds_CN 冠志.docx') as z:
    for name in ['word/header2.xml', 'word/header3.xml']:
        try:
            print(f'=== {name} ===')
            print(z.read(name).decode('utf-8'))
        except KeyError:
            print(f'{name} not found')
