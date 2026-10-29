import sys
import pymupdf

pdf_paths = sys.argv[1:]
if not pdf_paths:
    print("No pdf paths provided")
    sys.exit(1)

all_passed = True
for p in pdf_paths:
    doc = pymupdf.open(p)
    checked_count = 0
    for pno, page in enumerate(doc):
        blocks = page.get_text("dict")["blocks"]
        for b in blocks:
            if "lines" in b:
                for l in b["lines"]:
                    for s in l["spans"]:
                        t = s["text"].lower().strip()
                        if "toxicological studies were available" in t or "toxicological data for n,n-dimethylacetamide" in t:
                            sz = s["size"]
                            checked_count += 1
                            if sz > 11.0:
                                print(f"FAIL: {p} page {pno+1} text='{s['text']}' size={sz:.2f} (must be 9.50pt)")
                                all_passed = False
    if checked_count == 0:
        print(f"WARN: text not found in {p}")

if all_passed:
    print("PASS: All English PDF preambles verified at 9.50pt (size <= 11.0)")
    sys.exit(0)
else:
    sys.exit(1)
