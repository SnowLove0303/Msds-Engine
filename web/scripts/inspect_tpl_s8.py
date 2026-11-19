import docx

tpl_cn = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\public\templates\正式模板_MSDS_CN_冠志(1).docx"
tpl_en = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\public\templates\正式模板_MSDS_EN_冠志(1).docx"

def inspect_tpl(path, name):
    print(f"\n==================== {name} ====================")
    doc = docx.Document(path)
    t = doc.tables[7]
    print(f"Table 7 has {len(t.rows)} rows:")
    for r_idx, r in enumerate(t.rows):
        cells = [c.text.strip().replace("\n", " ") for c in r.cells]
        dedup = []
        for c in cells:
            if not dedup or c != dedup[-1]:
                dedup.append(c)
        print(f"  R{r_idx} (cols {len(r.cells)}): {' || '.join(dedup)}")

inspect_tpl(tpl_cn, "CN TEMPLATE")
inspect_tpl(tpl_en, "EN TEMPLATE")
