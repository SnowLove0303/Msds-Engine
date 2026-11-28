import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\pipeline-engine.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(2780, min(len(lines), 2860)):
    print(f'{i+1}: {lines[i]}', end='')
