# -*- coding: utf-8 -*-
import os
import sys
import win32com.client

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-1 单组份水性丙烯酸乳液 PA"

doc_files = []
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.lower().endswith(".doc") and "msds" in f.lower():
            doc_files.append((os.path.basename(root), f, os.path.join(root, f)))

print(f"Found {len(doc_files)} .doc files.")

word = win32com.client.DispatchEx("Word.Application")
word.Visible = False
word.DisplayAlerts = False

try:
    for model, fname, fpath in doc_files:
        try:
            doc = word.Documents.Open(fpath, ReadOnly=True, ConfirmConversions=False)
            tbl_count = doc.Tables.Count
            
            s2_text = ""
            if tbl_count >= 2:
                s2_text = doc.Tables(2).Range.Text
            
            has_h = any(h in s2_text for h in ["H3", "H2", "H4", "危险说明", "危害性说明"]) or "H" in s2_text
            has_p = any(p in s2_text for p in ["P2", "P3", "P4", "防范说明", "预防措施", "事故响应"])
            has_ghs = "象形图" in s2_text or "GHS" in s2_text or "警告" in s2_text or "危险" in s2_text
            has_hazard = "不属于危险" not in s2_text and ("危险" in s2_text or "警告" in s2_text or has_h)
            
            s11_text = ""
            if tbl_count >= 11:
                s11_text = doc.Tables(11).Range.Text
            
            has_ld50 = "LD50" in s11_text or "LC50" in s11_text or "mg/kg" in s11_text or "mg/L" in s11_text
            has_tox_data = len(s11_text.strip()) > 50 and "无数据资料" not in s11_text
            
            shapes_count = doc.InlineShapes.Count + doc.Shapes.Count
            
            s2_snip = s2_text[:200].replace("\r", " ").replace("\x07", " ").replace("\n", " ")
            s11_snip = s11_text[:200].replace("\r", " ").replace("\x07", " ").replace("\n", " ")
            
            print(f"\n[{model}] {fname} (Tables: {tbl_count}, Shapes: {shapes_count})")
            print(f"  Sec 2: Hazardous={has_hazard}, H={has_h}, P={has_p}, GHS={has_ghs}")
            print(f"  Sec 2 Snippet: {s2_snip}")
            print(f"  Sec 11: LD50={has_ld50}, HasData={has_tox_data}")
            print(f"  Sec 11 Snippet: {s11_snip}")
            doc.Close(False)
        except Exception as e:
            print(f"[{model}] {fname} ERROR: {e}")
finally:
    try:
        word.Quit(0)
    except:
        pass
