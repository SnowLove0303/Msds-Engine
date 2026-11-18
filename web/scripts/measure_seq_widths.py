import pymupdf

for lang, p in [('CN', "E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A/PU-2346A msds_CN 冠志.pdf"),
                ('EN', "E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A/PU-2346A msds_EN Guanzhi.pdf")]:
    doc = pymupdf.open(p)
    print(f"\n=== {lang} Sequence Widths ===")
    for pno, page in enumerate(doc):
        words = page.get_text("words")
        for w in words:
            if w[4] in ['8.1', '8.2', '9.1', '9.10', '9.19', '11.1', '11.7', '11.10', '11.16', '14.1', '14.5']:
                width_pt = w[2] - w[0]
                width_dxa = width_pt * 20
                print(f"p{pno+1}: '{w[4]}' x0={w[0]:.2f}, x1={w[2]:.2f}, width={width_pt:.2f}pt ({width_dxa:.0f} dxa)")
