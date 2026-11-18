import pypdf

reader = pypdf.PdfReader('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/test_no_leading_br.pdf')

def visitor_body(text, cm, tm, fontDict, fontSize):
    t = text.strip()
    if any(k in t for k in ['Hydroxy', 'Toxicity', 'Irritation', 'Propylene']):
        print(f"y={tm[5]:.1f}: '{t}'")

print("=== Page 5 text with Y-coords (NO LEADING BR) ===")
reader.pages[4].extract_text(visitor_text=visitor_body)
