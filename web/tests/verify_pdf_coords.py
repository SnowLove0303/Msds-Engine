import pymupdf
import sys
import os

pdf_path = sys.argv[1]
doc = pymupdf.open(pdf_path)
p0 = doc[0]
rect = p0.rect
words = p0.get_text('words')

company_words = []
date_words = []
page_words = []

for w in words:
    # only words in footer region
    if w[1] > rect.height - 100:
        # Check company / model text
        if any(k in w[4] for k in ['冠志', '国彩', 'Guanzhi', 'Guocai', 'MSDS', 'Yingde', 'Fine', 'Chemical', 'Technology', 'Company', 'PU-', 'PA-', 'HPU-']):
            company_words.append(w)
        if any(k in w[4] for k in ['修订日期', 'Revision', 'Date']) or (len(w[4]) == 10 and w[4].count('/') == 2):
            date_words.append(w)
        if w[4] in ['1', '/', str(len(doc))]:
            page_words.append(w)

print(f"\nAUDITING: {os.path.basename(pdf_path)}")

# 1. Company Bounding Box
if company_words:
    comp_y0 = min(w[1] for w in company_words)
    comp_y1 = max(w[3] for w in company_words)
    comp_center = (comp_y0 + comp_y1) / 2
    comp_lines = len(set(round(w[1], 1) for w in company_words))
    print(f"  Company box: y0={comp_y0:.1f}, y1={comp_y1:.1f}, center={comp_center:.2f}, lines={comp_lines}")
else:
    print("  WARNING: No company words found in footer!")
    sys.exit(1)

# 2. Date Bounding Box
if date_words:
    date_y0 = min(w[1] for w in date_words)
    date_y1 = max(w[3] for w in date_words)
    date_center = (date_y0 + date_y1) / 2
    print(f"  Date box:    y0={date_y0:.1f}, y1={date_y1:.1f}, center={date_center:.2f}")
else:
    print("  WARNING: No date words found in footer!")
    sys.exit(1)

# 3. Y-Alignment assertion: compare vertical centers of the two cells in row 0
center_delta = abs(comp_center - date_center)
print(f"  Vertical Center Delta: {center_delta:.2f} pt")
if center_delta > 1.5:
    print(f"  ERROR: Vertical center delta ({center_delta:.2f} pt) exceeds 1.5 pt!")
    sys.exit(1)

# 4. Page number font size assertion
if page_words:
    digit_1 = next((w for w in page_words if w[4] == '1'), None)
    if digit_1:
        h = digit_1[3] - digit_1[1]
        print(f"  Page number '1' box height: {h:.2f} pt (benchmark ~12.2pt for 9pt font, vs 16.4pt for 12pt)")
        if h > 13.5:
            print(f"  ERROR: Page number height ({h:.2f} pt) indicates enlarged 12pt font!")
            sys.exit(1)
        if h < 9.0:
            print(f"  ERROR: Page number height ({h:.2f} pt) unexpectedly small!")
            sys.exit(1)

# 5. Guocai entity check if Guocai document
fname = os.path.basename(pdf_path)
full_text = p0.get_text()
if '国彩' in fname or 'Guocai' in fname:
    if '_CN' in fname:
        if '英德市国彩精细化工有限公司' not in full_text:
            print("  ERROR: Guocai CN document does NOT contain '英德市国彩精细化工有限公司'!")
            sys.exit(1)
        if '英德市国彩新材料有限公司' in full_text:
            print("  ERROR: Guocai CN document still contains obsolete '英德市国彩新材料有限公司'!")
            sys.exit(1)
        print("  Guocai CN entity check: 100% PASS (英德市国彩精细化工有限公司)")
    elif '_EN' in fname:
        if 'Yingde Guocai Fine Chemical Co., Ltd.' not in full_text:
            print("  ERROR: Guocai EN document does NOT contain 'Yingde Guocai Fine Chemical Co., Ltd.'!")
            sys.exit(1)
        if 'Yingde Guocai New Material Co., Ltd.' in full_text:
            print("  ERROR: Guocai EN document still contains obsolete 'Yingde Guocai New Material Co., Ltd.'!")
            sys.exit(1)
        print("  Guocai EN entity check: 100% PASS (Yingde Guocai Fine Chemical Co., Ltd.)")

print("  RESULT: 100% PASS")
