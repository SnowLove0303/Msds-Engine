import docx
import sys

user_path = r'D:\冠志\TDS MSDS\1-1 单组份水性聚氨酯树脂 PU\PU-202A\PU-202A msds_CN 冠志_用户手工修改基准.docx'
api_path = r'D:\冠志\TDS MSDS\1-1 单组份水性聚氨酯树脂 PU\PU-202A\PU-202A msds_CN 冠志.docx'

user_doc = docx.Document(user_path)
api_doc = docx.Document(api_path)

print('=== 1. 检查 9.22 固体含量 ===')
def inspect_solids(doc, label):
    s9 = doc.tables[8]
    for r_idx, r in enumerate(s9.rows):
        t0 = r.cells[0].text.strip()
        if '固体含量' in t0:
            print(f'[{label}] Row {r_idx}: c0 text={t0}')
            c0 = r.cells[0]
            for p in c0.paragraphs:
                runs = [(run.text, run.font.name, run.bold, getattr(run.font.size, 'pt', None)) for run in p.runs]
                print(f'  runs: {runs}')
            print(f'  c1 text={r.cells[-1].text.strip()}')

inspect_solids(user_doc, 'USER')
inspect_solids(api_doc, 'API')

print('\n=== 2. 检查 Section 11 (11.7 生殖毒性, 11.9 附加信息) ===')
def inspect_s11(doc, label):
    s11 = doc.tables[10]
    print(f'[{label}] s11 rows={len(s11.rows)}')
    for r_idx, r in enumerate(s11.rows):
        t0 = r.cells[0].text.strip()
        t1 = r.cells[-1].text.strip() if len(r.cells)>1 else ''
        print(f'  [{label}] Row {r_idx}: c0={t0[:35]} | c1={t1[:45]}')

inspect_s11(user_doc, 'USER')
inspect_s11(api_doc, 'API')

print('\n=== 3. 检查 Section 12 说明行 ===')
def inspect_s12(doc, label):
    s12 = doc.tables[11]
    print(f'[{label}] s12 rows={len(s12.rows)}')
    for r_idx, r in enumerate(s12.rows):
        t0 = r.cells[0].text.strip()
        t1 = r.cells[-1].text.strip() if len(r.cells)>1 else ''
        print(f'  [{label}] Row {r_idx}: c0={t0[:40]} | c1={t1[:40]}')

inspect_s12(user_doc, 'USER')
inspect_s12(api_doc, 'API')

print('\n=== 4. 检查页尾时间 ===')
def inspect_footer(doc, label):
    for s_idx, sec in enumerate(doc.sections):
        footer = sec.footer
        for t in footer.tables:
            for r in t.rows:
                print(f'[{label}] footer table row: {[c.text.strip() for c in r.cells]}')
        for p in footer.paragraphs:
            if p.text.strip():
                print(f'[{label}] footer para: {p.text.strip()}')

inspect_footer(user_doc, 'USER')
inspect_footer(api_doc, 'API')
