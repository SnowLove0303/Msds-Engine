import sys
import re
import pymupdf

pdf_paths = sys.argv[1:]
if not pdf_paths:
    print("No pdf paths provided")
    sys.exit(1)

all_passed = True

for p in pdf_paths:
    doc = pymupdf.open(p)
    rows_checked = 0
    errors = []

    for pno, page in enumerate(doc):
        words = page.get_text("words")
        # Sub-items only: 9.1, 9.2, ..., 9.24 (strictly regex ^9\.\d+)
        seq_words = [w for w in words if w[0] < 75 and re.match(r'^9\.\d+', w[4])]
        
        for sw in seq_words:
            num_str = sw[4].strip()
            # Find the word immediately following this sequence on the same line (same y0 roughly +- 3.5pt)
            line_words = [w for w in words if abs(w[1] - sw[1]) < 3.5 and w[0] > sw[0] and w[0] < 220]
            if line_words:
                first_text_word = min(line_words, key=lambda w: w[0])
                actual_x0 = first_text_word[0]
                rows_checked += 1
                # Must be 80.28 +- 1.2 pt
                if abs(actual_x0 - 80.28) > 1.2:
                    errors.append(f"{p} (p{pno+1}) {num_str}: label '{first_text_word[4]}' starts at x0={actual_x0:.2f} (expected 80.28pt)")

    if errors:
        all_passed = False
        print(f"FAIL: {len(errors)} misaligned rows detected in {p}:")
        for err in errors[:10]:
            print(f"  {err}")
    else:
        print(f"PASS: {p} ({rows_checked} Section 9 rows verified at x0=80.28pt)")

if all_passed:
    print("ALL Section 9 label alignments PASS (x0=80.28pt)")
    sys.exit(0)
else:
    sys.exit(1)
