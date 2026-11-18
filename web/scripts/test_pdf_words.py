import pymupdf
import re

pdf_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-1 单组份水性聚氨酯树脂 PU\PU-2346A\PU-2346A msds_CN 冠志.pdf"
doc = pymupdf.open(pdf_path)

for pno, page in enumerate(doc):
    words = page.get_text("words")
    # find words on this page
    for w in words:
        txt = w[4]
        if any(k in txt for k in ['控制参数', '工程控制', '呼吸系统防护', '手部防护', '外观', '相对密度', '毒理学', '急性毒性', '亚急性', '性：']):
            print(f"p{pno+1}: x0={w[0]:.2f}, y0={w[1]:.2f}, text={txt}")
