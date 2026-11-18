import pypdf

reader = pypdf.PdfReader(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-2 水性环氧固化剂 EC\EC-1804\EC-1804 msds_CN 国彩.pdf")
print("Page 1 lines:")
for l in reader.pages[0].extract_text().split('\n'):
    print(repr(l))
