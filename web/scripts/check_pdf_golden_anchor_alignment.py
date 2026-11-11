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

    # 第一阶段：动态探测全文档各章节实际出现的序号最大位数 (动态自适应，消除 Section 11 特判)
    sec_has_tier_b = {}
    for page in doc:
        words = page.get_text("words")
        for w in words:
            if w[0] < 75 and re.match(TARGET_SEQS, w[4]):
                m = re.match(r'^(\d+(?:\.\d+)+)', w[4].strip())
                if m:
                    sec = m.group(1).split('.')[0]
                    digits = re.sub(r'\D', '', m.group(1))
                    if len(digits) >= 4:
                        sec_has_tier_b[sec] = True

    # 第二阶段：逐页对齐核销
    for pno, page in enumerate(doc):
        words = page.get_text("words")

        # 1. 检查带序号的主标签 (Tier A: 最大序号<=3位数时为 80.28pt; Tier B: 包含>=4位数序号时为 87.28pt)
        seq_words = [w for w in words if w[0] < 75 and re.match(TARGET_SEQS, w[4])]
        for sw in seq_words:
            num_str = sw[4].strip()
            sec = num_str.split('.')[0]
            is_tier_b = sec_has_tier_b.get(sec, False)
            expected_x0 = 87.28 if is_tier_b else 80.28

            # Find the word immediately following this sequence on the same line (same y0 roughly +- 3.5pt)
            line_words = [w for w in words if abs(w[1] - sw[1]) < 3.5 and w[0] > sw[0] and w[0] < 220]
            if line_words:
                first_text_word = min(line_words, key=lambda w: w[0])
                actual_x0 = first_text_word[0]
                rows_checked += 1
                if abs(actual_x0 - expected_x0) > 1.5:
                    errors.append(f"{p} (p{pno+1}) {num_str}: label '{first_text_word[4]}' starts at x0={actual_x0:.2f} (expected {expected_x0:.2f}pt, Tier {'B' if is_tier_b else 'A'})")

        # 2. Check sub-labels without sequence (e.g. 呼吸系统防护, 手部防护, etc. in Section 8: Tier A 80.28pt)
        for w in words:
            if any(k in w[4] for k in SUB_KEYWORDS) and 75 < w[0] < 95:
                actual_x0 = w[0]
                rows_checked += 1
                if abs(actual_x0 - 80.28) > 1.5:
                    errors.append(f"{p} (p{pno+1}) sub-label '{w[4]}': starts at x0={actual_x0:.2f} (expected 80.28pt)")

        # 3. Check wrapped second line (e.g. 性： under 11.7 in Section 11: 动态随 Section 11 标尺对齐)
        is_s11_tier_b = sec_has_tier_b.get('11', False)
        expected_wrap_x0 = 87.28 if is_s11_tier_b else 80.28
        wrap_words = [w for w in words if w[4] in ['性：', '性:'] and 75 < w[0] < 95]
        for ww in wrap_words:
            actual_x0 = ww[0]
            rows_checked += 1
            if abs(actual_x0 - expected_wrap_x0) > 1.5:
                errors.append(f"{p} (p{pno+1}) wrapped line '{ww[4]}': starts at x0={actual_x0:.2f} (expected {expected_wrap_x0:.2f}pt)")

    if errors:
        all_passed = False
        print(f"FAIL: {len(errors)} misaligned rows detected in {p}:")
        for err in errors[:10]:
            print(f"  {err}")
    else:
        print(f"PASS: {p} ({rows_checked} tier-adaptive anchor rows verified: Tier A=80.28pt, Tier B=87.28pt)")

if all_passed:
    print("ALL Golden Anchor label alignments PASS (Tier A: 80.28pt, Tier B: 87.28pt)")
    sys.exit(0)
else:
    sys.exit(1)
