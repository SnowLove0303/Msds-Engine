import pypdf

reader = pypdf.PdfReader('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.pdf')

def visitor_body(text, cm, tm, fontDict, fontSize):
    t = text.strip()
    if any(k in t for k in ['Hydroxy', 'Toxicity', 'Irritation', 'Propylene']):
        print(f"y={tm[5]:.1f}: '{t}'")

print("=== S11 text on Page 5 with Y-coords ===")
reader.pages[4].extract_text(visitor_text=visitor_body)
