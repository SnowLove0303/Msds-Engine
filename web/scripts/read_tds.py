
import pymupdf, sys
doc = pymupdf.open("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A/中文版/PU-2346A tds_CN 冠志.pdf")
for page in doc:
    print(page.get_text())
