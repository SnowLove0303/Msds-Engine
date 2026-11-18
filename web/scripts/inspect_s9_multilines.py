import fitz

def check_all_s9_lines(pdf_path, label):
    print(f"\n==================== {label} ====================")
    doc = fitz.open(pdf_path)
    for pno in range(len(doc)):
        page = doc[pno]
        blocks = page.get_text("blocks") # (x0, y0, x1, y1, text, block_no, block_type)
        for b in blocks:
            # cell 0 usually has x0 between 55 and 65, and x1 between 220 and 240
            if 55 <= b[0] <= 65 and b[2] <= 240:
                lines = b[4].split('\n')
                for line in lines:
                    line = line.strip()
                    if line:
                        print(f"  [p{pno+1}] (x0={b[0]:.1f}, x1={b[2]:.1f}) {line}")

check_all_s9_lines("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_CN 冠志.pdf", "PU-202A CN PDF")
check_all_s9_lines("F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202A/PU-202A msds_EN Guanzhi.pdf", "PU-202A EN PDF")
