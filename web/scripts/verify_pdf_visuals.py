import fitz

cn_pdf = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-2 水性环氧固化剂 EC\EC-1804\EC-1804 msds_CN 冠志.pdf"
en_pdf = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-2 水性环氧固化剂 EC\EC-1804\EC-1804 msds_EN Guanzhi.pdf"

print("=== CHECKING EN PDF VISUAL RENDERING ===")
doc_en = fitz.open(en_pdf)
print("Page 1 blocks:")
for b in doc_en[0].get_text("blocks")[:8]:
    print(" ", repr(b[4].strip()))

print("\nPage 2 blocks (Section 5):")
for b in doc_en[1].get_text("blocks"):
    if "Firefighting" in b[4] or "5.4" in b[4]:
        print(" ", repr(b[4].strip()))

print("\n=== CHECKING CN PDF VISUAL RENDERING ===")
doc_cn = fitz.open(cn_pdf)
print("Page 2 blocks (Section 3):")
for b in doc_cn[1].get_text("blocks"):
    if "3.2" in b[4] or "成分" in b[4]:
        print(" ", repr(b[4].strip()))

print("\nPage 5 blocks (Section 15):")
for b in doc_cn[4].get_text("blocks"):
    if "591" in b[4] or "30000" in b[4] or "344" in b[4] or "20576" in b[4]:
        print(" ", repr(b[4].strip()))
