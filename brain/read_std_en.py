import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\pipeline-engine.js', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('standardizeEnglishTypographyAndLabels')
if idx != -1:
    print(text[idx:idx+2500])
