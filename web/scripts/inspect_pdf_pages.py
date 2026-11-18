import fitz # PyMuPDF
import sys

def inspect_pdf(pdf_path, label):
    print(f"\n==============================================")
    print(f"=== PDF INSPECTION: {label} ({pdf_path})")
    print(f"==============================================")
    doc = fitz.open(pdf_path)
    print(f"Total Pages: {len(doc)}")
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text").strip()
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        header = lines[0] if lines else ""
        footer = lines[-1] if lines else ""
        print(f"--- Page {page_num + 1} (lines: {len(lines)}, chars: {len(text)}) ---")
        print(f"  Header line: {header}")
        print(f"  Footer line: {footer}")
        if len(lines) <= 2:
            print(f"  [WARNING] Empty or near-empty page detected!")
    doc.close()

if __name__ == "__main__":
    inspect_pdf("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_CN 冠志.pdf", "CN Guanzhi PDF")
    inspect_pdf("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804/EC-1804 msds_EN Guanzhi.pdf", "EN Guanzhi PDF")
