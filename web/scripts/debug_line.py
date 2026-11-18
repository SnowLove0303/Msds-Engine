import pymupdf

doc = pymupdf.open('算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7660/HPU-7660 msds_CN 冠志.pdf')
p3 = doc[2]
words = [w for w in p3.get_text('words') if 460 < w[1] < 475]
for w in sorted(words, key=lambda x: x[0]):
    print(f"x0={w[0]:.2f}, x1={w[2]:.2f}, text='{w[4]}'")
