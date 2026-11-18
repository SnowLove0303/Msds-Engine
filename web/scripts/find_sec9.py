with open(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\pipeline-engine.js', 'r', encoding='utf-8') as f:
    for i, l in enumerate(f):
        if 'sectionNumber === 9' in l or 'sectionNumber===9' in l:
            print(f"{i+1}: {l.strip()}")
