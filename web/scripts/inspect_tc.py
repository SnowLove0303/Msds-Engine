import docx
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

src_cn = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 冠志.docx"
doc = docx.Document(src_cn)
t7 = doc.tables[7]
tr13 = t7.rows[13]._tr
tcs = tr13.xpath('.//w:tc')
for i, tc in enumerate(tcs):
    text = "".join(tc.itertext())
    print(f"tc {i}: text='{text}', xml={tc.xml[:120]}")
