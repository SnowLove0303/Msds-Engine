import pypdf

reader = pypdf.PdfReader(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-2 水性环氧固化剂 EC\EC-1804\EC-1804 msds_CN 冠志.pdf")
with open("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/pdf_text_dump.txt", "w", encoding="utf-8") as f:
    f.write(reader.pages[0].extract_text())
