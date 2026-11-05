import sys
import fitz

pdf_paths = sys.argv[1:]
if not pdf_paths:
    print("No pdf paths provided")
    sys.exit(1)

all_passed = True
for p in pdf_paths:
    doc = fitz.open(p)
    last_page = doc[-1]
    blocks = [b[4].strip() for b in last_page.get_text("blocks") if b[4].strip()]
    main_blocks = [b for b in blocks if not any(k in b for k in ["MSDS", "修订日期", "Revision Date", "广州冠志", "英德市国彩", "Page "])]
    if len(main_blocks) == 0 and len(doc) > 1:
        print(f"FAIL: Blank page bug detected in {p} (last page has no main content)")
        all_passed = False
    else:
        print(f"PASS: {p} last page has {len(main_blocks)} main content blocks")

if all_passed:
    sys.exit(0)
else:
    sys.exit(1)
