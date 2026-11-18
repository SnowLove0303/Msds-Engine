with open(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\smart-matching.js', 'r', encoding='utf-8') as f:
    for i, l in enumerate(f):
        if 's === 9' in l or 'sectionNumber === 9' in l or 'section 9' in l.lower():
            print(f"{i+1}: {l.strip()[:100]}")
