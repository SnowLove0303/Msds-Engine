# -*- coding: utf-8 -*-
import os
import sys
import docx

sys.stdout.reconfigure(encoding='utf-8')
dir_path = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scratch\pa_doc_converted"
files = [f for f in os.listdir(dir_path) if f.endswith('.docx')]
print(f"Total converted docx files: {len(files)}")

candidates = []

for f in sorted(files):
    p = os.path.join(dir_path, f)
    try:
        doc = docx.Document(p)
        tbl_count = len(doc.tables)
        s2_text = ""
        if tbl_count >= 2:
            s2_text = " ".join([c.text.strip() for row in doc.tables[1].rows for c in row.cells if c.text.strip()])
        elif tbl_count == 1:
            s2_text = " ".join([c.text.strip() for row in doc.tables[0].rows for c in row.cells if c.text.strip()])
        
        s11_text = ""
        if tbl_count >= 11:
            s11_text = " ".join([c.text.strip() for row in doc.tables[10].rows for c in row.cells if c.text.strip()])
        
        has_h = any(h in s2_text for h in ["H3", "H2", "H4", "危险说明", "危害性说明"])
        has_p = any(p in s2_text for p in ["P2", "P3", "P4", "防范说明", "预防措施", "事故响应"])
        has_ghs = "象形图" in s2_text or "GHS" in s2_text or "警告" in s2_text or "危险" in s2_text
        has_hazard = "不属于危险" not in s2_text and ("危险" in s2_text or "警告" in s2_text or has_h)
        has_ld50 = "LD50" in s11_text or "LC50" in s11_text or "mg/kg" in s11_text
        has_images = len(doc.part.rels.values()) > 0 and any("image" in str(rel.target_ref) for rel in doc.part.rels.values())
        
        entry = {
            "file": f,
            "tables": tbl_count,
            "images": has_images,
            "hazard": has_hazard,
            "h": has_h,
            "p": has_p,
            "s2": s2_text,
            "s11": s11_text,
            "ld50": has_ld50
        }
        candidates.append(entry)
        
        if has_hazard or has_h or has_p or has_images or "478" in f or "490" in f:
            print(f"*** CANDIDATE: {f} ***")
            print(f"  Tables: {tbl_count}, HasImages: {has_images}, Hazard: {has_hazard}, H: {has_h}, P: {has_p}, S11_LD50: {has_ld50}")
            print(f"  S2: {s2_text[:250]}")
            print(f"  S11: {s11_text[:250]}")
            print("-" * 60)
    except Exception as e:
        print(f"Err in {f}: {e}")

# Check PA-4781 and PA-4782 specifically
for c in candidates:
    if any(k in c['file'] for k in ["4780", "4781", "4782", "4902", "486"]):
        print(f"\n[FOCUSED] {c['file']}:")
        print(f"  S2 (len {len(c['s2'])}): {c['s2']}")
        print(f"  S11 (len {len(c['s11'])}): {c['s11']}")
