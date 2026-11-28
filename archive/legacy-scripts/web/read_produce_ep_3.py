import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\produce_ep_five_models.mjs', 'r', encoding='utf-8') as f:
    text = f.read()

print(text[6000:])
