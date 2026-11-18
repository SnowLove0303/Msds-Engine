import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\src\pipeline-engine.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'[123456789]\d?\.[A-Za-z]+', text)
print('Matches in pipeline-engine.js:', set(matches))
