with open(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\pipeline-engine.js', 'r', encoding='utf-8') as f:
    for i, l in enumerate(f):
        if 's9' in l and ('writeCellValue' in l or 'cells[1]' in l or 'rebuild' in l or 'fill' in l or 'replace' in l):
            print(f"{i+1}: {l.strip()[:100]}")
