import pypdf

reader = pypdf.PdfReader(r'算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志.pdf')
print("Total pages in PA-4914 CN:", len(reader.pages))
for i, page in enumerate(reader.pages):
    txt = page.extract_text() or ''
    first_line = txt.split('\n')[0] if txt else ''
    last_line = txt.split('\n')[-1] if txt else ''
    print(f"Page {i+1}: length={len(txt)} chars | start='{first_line[:40]}' | end='{last_line[-40:]}'")
