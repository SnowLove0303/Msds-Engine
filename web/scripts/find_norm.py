with open(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\smart-matching.js', 'r', encoding='utf-8') as f:
    for i, l in enumerate(f):
        if 'function normalizeLabelKey' in l or 'const normalizeLabelKey' in l:
            print(f"{i+1}: {l.strip()[:100]}")
