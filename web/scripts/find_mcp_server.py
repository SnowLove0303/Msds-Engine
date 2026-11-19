import os

for root, dirs, files in os.walk(r'C:\Users\Administrator\.gemini'):
    for f in files:
        if f.endswith('.js') or f.endswith('.mjs') or f.endswith('.ts') or f.endswith('.py'):
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                    c = fp.read()
                    if 'review_diff_in_vscode' in c:
                        print(p)
            except:
                pass
