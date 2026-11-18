import pymupdf

pdf_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-1 单组份水性聚氨酯树脂 PU\PU-2346A\PU-2346A msds_CN 冠志.pdf"
doc = pymupdf.open(pdf_path)

page = doc[4] # page 5 (0-indexed 4)
words = page.get_text("words")
for w in words:
    if "11." in w[4] or w[0] < 90:
        print(f"x0={w[0]:.2f}, y0={w[1]:.2f}, x1={w[2]:.2f}, text={w[4]}")
