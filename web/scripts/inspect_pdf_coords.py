import pypdf

reader = pypdf.PdfReader('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.pdf')

def visitor_body(text, cm, tm, fontDict, fontSize):
    if text.strip():
        print(f"y={tm[5]:.1f}, x={tm[4]:.1f}: '{text}'")

print("=== Page 5 text with coordinates ===")
reader.pages[4].extract_text(visitor_text=visitor_body)
