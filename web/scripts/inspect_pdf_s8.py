import os, sys

try:
    import fitz # PyMuPDF
    has_fitz = True
except ImportError:
    has_fitz = False

try:
    import pypdf
    has_pypdf = True
except ImportError:
    has_pypdf = False

print(f"has_fitz: {has_fitz}, has_pypdf: {has_pypdf}")

if has_fitz:
    doc = fitz.open(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1736\EP-1736 msds_CN 冠志.pdf")
    print(f"Pages: {len(doc)}")
    for page_num in range(len(doc)):
        page = doc[page_num]
        text_instances = page.get_text("blocks")
        for b in text_instances:
            txt = b[4]
            if "喷涂" in txt or "374-3" in txt or "8.接触控制" in txt or "呼吸防护" in txt:
                print(f"Page {page_num+1} Block: {txt.strip()}")
