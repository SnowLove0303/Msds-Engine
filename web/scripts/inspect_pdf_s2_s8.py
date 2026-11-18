import pypdf
import sys

def inspect_pdf(path):
    print(f"=== Inspecting {path} ===")
    reader = pypdf.PdfReader(path)
    print(f"Total pages: {len(reader.pages)}")
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        print(f"--- Page {i+1} ---")
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        for line in lines[:30]:
            print(f"  {line}")

inspect_pdf(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-2 水性环氧固化剂 EC\EC-1804\EC-1804 msds_CN 冠志.pdf")
