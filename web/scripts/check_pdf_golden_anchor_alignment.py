import sys
import re
import pymupdf

pdf_paths = sys.argv[1:]
if not pdf_paths:
    print("No pdf paths provided")
    sys.exit(1)

all_passed = True

# Target sections that follow the Golden Anchor 80.28pt rule (Section 8, 9, 10, 11, 14)
TARGET_SEQS = r'^(?:8\.[12]|9\.\d+|10\.\d+|11\.\d+|14\.\d+)\b'
SUB_KEYWORDS = [
    '呼吸系统防护', '手部防护', '防护手套的合适材料', '建议', '眼睛防护', '身体防护',
    'Respiratory protection', 'Hand protection', 'Suitable material', 'Eye/face protection', 'Skin and body protection'
]

for p in pdf_paths:
    doc = pymupdf.open(p)
    rows_checked = 0
    errors = []

    for pno, page in enumerate(doc):
        words = page.get_text("words")

        # 1. Check parent labels with sequence (e.g. 8.1, 8.2, 9.1..9.24, 10.1..10.6, 11.1..11.16, 14.1..14.7)
        seq_words = [w for w in words if w[0] < 75 and re.match(TARGET_SEQS, w[4])]
        for sw in seq_words:
            num_str = sw[4].strip()
            # Find the word immediately following this sequence on the same line (same y0 roughly +- 3.5pt)
            line_words = [w for w in words if abs(w[1] - sw[1]) < 3.5 and w[0] > sw[0] and w[0] < 220]
            if line_words:
                first_text_word = min(line_words, key=lambda w: w[0])
                actual_x0 = first_text_word[0]
                rows_checked += 1
                if abs(actual_x0 - 80.28) > 1.5:
                    errors.append(f"{p} (p{pno+1}) {num_str}: label '{first_text_word[4]}' starts at x0={actual_x0:.2f} (expected 80.28pt)")

        # 2. Check sub-labels without sequence (e.g. 呼吸系统防护, 手部防护, etc.)
        for w in words:
            if any(k in w[4] for k in SUB_KEYWORDS) and 75 < w[0] < 95:
                actual_x0 = w[0]
                rows_checked += 1
                if abs(actual_x0 - 80.28) > 1.5:
                    errors.append(f"{p} (p{pno+1}) sub-label '{w[4]}': starts at x0={actual_x0:.2f} (expected 80.28pt)")

        # 3. Check wrapped second line (e.g. 性： under 11.7)
        wrap_words = [w for w in words if w[4] in ['性：', '性:'] and 75 < w[0] < 95]
        for ww in wrap_words:
            actual_x0 = ww[0]
            rows_checked += 1
            if abs(actual_x0 - 80.28) > 1.5:
                errors.append(f"{p} (p{pno+1}) wrapped line '{ww[4]}': starts at x0={actual_x0:.2f} (expected 80.28pt)")

    if errors:
        all_passed = False
        print(f"FAIL: {len(errors)} misaligned rows detected in {p}:")
        for err in errors[:10]:
            print(f"  {err}")
    else:
        print(f"PASS: {p} ({rows_checked} golden anchor rows verified at x0=80.28pt)")

if all_passed:
    print("ALL Golden Anchor label alignments PASS (x0=80.28pt)")
    sys.exit(0)
else:
    sys.exit(1)
