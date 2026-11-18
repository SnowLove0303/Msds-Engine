import pypdf

def check_pdf(pdf_path, name):
    reader = pypdf.PdfReader(pdf_path)
    text = reader.pages[0].extract_text()
    print(f"\n=== {name} Page 1 Section 2 PDF Text ===")
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    in_s2 = False
    for line in lines:
        if '2.' in line or '2.1' in line or '2.2' in line or 'Hazards' in line or '危险' in line:
            in_s2 = True
        if '3.' in line or '成分' in line or 'Composition' in line:
            in_s2 = False
        if in_s2:
            print(f"  {line}")

check_pdf(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-2 水性环氧固化剂 EC\EC-1804\EC-1804 msds_CN 冠志.pdf", "CN Guanzhi PDF")
check_pdf(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-2 水性环氧固化剂 EC\EC-1804\EC-1804 msds_EN Guanzhi.pdf", "EN Guanzhi PDF")
