import zipfile
import xml.etree.ElementTree as ET
import os

docx_path = r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-1 单组份水性丙烯酸乳液 PA\PA-4902\PA-4902msds_CN 冠志___源文件留存.docx'

with zipfile.ZipFile(docx_path) as z:
    xml_content = z.read('word/document.xml')

root = ET.fromstring(xml_content)
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

body = root.find('w:body', ns)

out_lines = []
out_lines.append(f"=== PA-4902 源文件完整真实底层内容遍历 ===")

elem_idx = 0
for elem in body:
    tag = elem.tag.split('}')[-1]
    if tag == 'p':
        texts = [t.text for t in elem.findall('.//w:t', ns) if t.text]
        p_text = ''.join(texts).strip()
        if p_text:
            out_lines.append(f"\n[PARAGRAPH {elem_idx}]: {p_text}")
            elem_idx += 1
    elif tag == 'tbl':
        rows = elem.findall('w:tr', ns)
        out_lines.append(f"\n[TABLE {elem_idx}] ({len(rows)} rows):")
        for r_idx, tr in enumerate(rows):
            cells = tr.findall('w:tc', ns)
            cell_texts = []
            for c_idx, tc in enumerate(cells):
                c_texts = [t.text for t in tc.findall('.//w:t', ns) if t.text]
                cell_texts.append(''.join(c_texts).strip().replace('\n', ' '))
            out_lines.append(f"  Row {r_idx:2d} ({len(cells)} cells): {' | '.join(cell_texts)}")
        elem_idx += 1

out_str = '\n'.join(out_lines)
out_path = r'C:\Users\Administrator\.gemini\antigravity\brain\7f4d4b46-78e6-435a-aa29-f0d6ec194caa\scratch\PA-4902_raw_source_content.txt'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(out_str)

print(f"Raw source content dumped to: {out_path}")
print(f"Total elements: {elem_idx}, Total length: {len(out_str)} chars")
