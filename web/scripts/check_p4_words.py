import pymupdf

doc = pymupdf.open('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A/PU-2346A msds_CN 冠志.pdf')
p4 = doc[3]
words = [w for w in p4.get_text('words') if any(k in w[4] for k in ['8.1', '8.2', '9.1', '呼吸', '手部', '防护手套'])]
for w in words:
    print(f"'{w[4]}': x0={w[0]:.2f}, x1={w[2]:.2f}")
