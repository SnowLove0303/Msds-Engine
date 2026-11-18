import pypdf

reader = pypdf.PdfReader('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/test_opt1_before240.pdf')
page6 = reader.pages[5]
print("=== Section 13 text in Page 6 ===")
lines = page6.extract_text().splitlines()
s13_started = False
for l in lines:
    if '13.Handling' in l or 'Disposal methods' in l:
        s13_started = True
    if s13_started:
        print(l)
