import pypdf

reader = pypdf.PdfReader('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/test_opt1_before240.pdf')
print('Total pages:', len(reader.pages))

def visitor_body(text, cm, tm, fontDict, fontSize):
    t = text.strip()
    if any(k in t for k in ['Hydroxy', 'Toxicity', 'Irritation', 'Propylene', 'Butoxyethoxy', 'Disposal methods', 'Empty containers']):
        print(f"y={tm[5]:.1f}: '{t}'")

print("=== Page 5 ===")
reader.pages[4].extract_text(visitor_text=visitor_body)
print("=== Page 6 ===")
reader.pages[5].extract_text(visitor_text=visitor_body)
