# -*- coding: utf-8 -*-
import os
import sys
import docx

# Set stdout to utf-8
sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-1 单组份水性丙烯酸乳液 PA"

results = []

for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.lower().endswith(".docx") and "msds" in f.lower():
            full_path = os.path.join(root, f)
            model = os.path.basename(root)
            try:
                doc = docx.Document(full_path)
                tbl_count = len(doc.tables)
                
                # Full text
                all_text = []
                for t in doc.tables:
                    for row in t.rows:
                        for cell in row.cells:
                            all_text.append(cell.text)
                full_text = "\n".join(all_text)
                
                # Check images
                has_images = len(doc.inline_shapes) > 0
                # Check part related relationships for image
                rel_images = [rel.target_ref for rel in doc.part.rels.values() if "image" in rel.target_ref]
                
                # Section 2 analysis
                s2_text = ""
                if tbl_count >= 2:
                    s2_text = "\n".join([c.text for row in doc.tables[1].rows for c in row.cells])
                elif tbl_count == 1:
                    s2_text = full_text
                    
                has_h = any(h in s2_text for h in ["H3", "H2", "H4", "危险说明", "危害性说明"])
                has_p = any(p in s2_text for p in ["P2", "P3", "P4", "防范说明", "预防措施", "事故响应"])
                has_ghs = "象形图" in s2_text or "GHS" in s2_text or "警告" in s2_text or "危险" in s2_text
                has_hazard = "不属于危险" not in s2_text and ("危险" in s2_text or "警告" in s2_text or has_h)
                
                # Section 11 analysis
                s11_text = ""
                if tbl_count >= 11:
                    s11_text = "\n".join([c.text for row in doc.tables[10].rows for c in row.cells])
                
                has_ld50 = "LD50" in s11_text or "LC50" in s11_text or "mg/kg" in s11_text or "mg/L" in s11_text
                has_tox_data = len(s11_text.strip()) > 50 and "无数据资料" not in s11_text
                
                results.append({
                    "model": model,
                    "file": f,
                    "tables": tbl_count,
                    "images": len(rel_images),
                    "s2_hazardous": has_hazard,
                    "s2_h": has_h,
                    "s2_p": has_p,
                    "s2_ghs": has_ghs,
                    "s11_ld50": has_ld50,
                    "s11_has_data": has_tox_data,
                    "s2_snippet": s2_text[:200].replace("\n", " "),
                    "s11_snippet": s11_text[:200].replace("\n", " ")
                })
            except Exception as e:
                results.append({"model": model, "file": f, "error": str(e)})

print(f"Total scanned docx: {len(results)}")
for r in results:
    if "error" in r:
        print(f"[{r['model']}] ERROR: {r['error']}")
    else:
        print(f"\n[{r['model']}] {r['file']} (Tables: {r['tables']}, Images: {r['images']})")
        print(f"  Sec 2: Hazardous={r['s2_hazardous']}, H={r['s2_h']}, P={r['s2_p']}, GHS={r['s2_ghs']}")
        print(f"  Sec 2 Snippet: {r['s2_snippet']}")
        print(f"  Sec 11: LD50={r['s11_ld50']}, HasData={r['s11_has_data']}")
        print(f"  Sec 11 Snippet: {r['s11_snippet']}")
