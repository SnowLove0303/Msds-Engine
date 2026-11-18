import fitz

doc = fitz.open(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-2 水性环氧固化剂 EC\EC-1804\EC-1804 msds_EN Guanzhi.pdf")
p1 = doc[0]
for b in p1.get_text("blocks"):
    if "Identification" in b[4]:
        print("PDF BLOCK:", repr(b[4]))
