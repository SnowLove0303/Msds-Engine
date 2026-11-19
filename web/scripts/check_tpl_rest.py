import docx

tpl = docx.Document(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\public\templates\正式模板_MSDS_CN_冠志(1).docx")

for idx in [9, 10, 11, 12, 13, 14, 15]:
    t = tpl.tables[idx]
    print(f"\n=== TEMPLATE TABLE {idx} ({len(t.rows)} rows) ===")
    for r_i, r in enumerate(t.rows):
        cells = [c.text.strip().replace('\n', ' ') for c in r.cells]
        dedup = []
        for c in cells:
            if not dedup or c != dedup[-1]:
                dedup.append(c)
        print(f"  R{r_i}: {' || '.join(dedup)}")
