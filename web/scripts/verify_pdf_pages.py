import os
import pypdf

dirs = [
    r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4840',
    r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-1 单组份水性丙烯酸乳液 PA\PA-4902'
]

all_passed = True
total_pdfs = 0

print("=== VERIFYING PDF PAGE COUNTS (STRICT 5-PAGE INVARIANT) ===")
for d in dirs:
    print(f"\nDirectory: {d}")
    files = [f for f in os.listdir(d) if f.endswith('.pdf')]
    for f in sorted(files):
        pdf_path = os.path.join(d, f)
        reader = pypdf.PdfReader(pdf_path)
        page_count = len(reader.pages)
        status = "PASS" if page_count == 5 else f"FAIL (got {page_count})"
        print(f"  [{status}] {f}: {page_count} pages")
        total_pdfs += 1
        if page_count != 5:
            all_passed = False

print(f"\nTotal PDFs checked: {total_pdfs}, All 5 pages: {all_passed}")
if not all_passed:
    exit(1)
