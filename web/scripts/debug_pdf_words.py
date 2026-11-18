import pymupdf

doc = pymupdf.open('算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7660/HPU-7660 msds_CN 冠志.pdf')
for pno, page in enumerate(doc):
    words = page.get_text('words')
    for w in words:
        if '9.' in w[4]:
            print(f"P{pno+1}: x0={w[0]:.2f}, y0={w[1]:.2f}, x1={w[2]:.2f}, text='{w[4]}'")
