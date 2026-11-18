# -*- coding: utf-8 -*-
import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')
p = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-1 单组份水性丙烯酸乳液 PA\PA-4780\PA-4780 msds_CN 冠志.docx"
d = docx.Document(p)
for i, t in enumerate(d.tables):
    text = '\n'.join([' | '.join([c.text.strip().replace('\n', ' ') for c in r.cells]) for r in t.rows])
    print(f"=== TABLE {i+1} ===\n{text}\n")
