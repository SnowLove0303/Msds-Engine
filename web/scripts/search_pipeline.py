with open(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\pipeline-engine.js', 'r', encoding='utf-8') as f:
    for i, l in enumerate(f):
        if any(k in l for k in ['乳白', 'Milky', 'Waterborne epoxy emulsion', 'Epoxy water dispersion', 'section 9', 'Section 9', 'buildSection9', 'buildSection1', 'appearance', 'Appearance']):
            print(f"{i+1}: {l.strip()[:100]}")
