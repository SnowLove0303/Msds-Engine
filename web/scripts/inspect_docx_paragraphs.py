import docx

doc = docx.Document('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PA-3223/PA-3223 msds_EN Guanzhi.docx')
table = doc.tables[10] # Section 11
row3 = table.rows[3]
cell = row3.cells[0]

print('Number of paragraphs in cell:', len(cell.paragraphs))
for i, p in enumerate(cell.paragraphs):
    print(f'--- Paragraph {i} ---')
    print('text:', repr(p.text))
    for r in p.runs:
        print('  run text:', repr(r.text), 'contains br:', '<w:br' in r._r.xml)
