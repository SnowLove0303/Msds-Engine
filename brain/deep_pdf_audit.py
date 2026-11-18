import os
import sys
import fitz  # PyMuPDF

sys.stdout.reconfigure(encoding='utf-8')

TARGET_BASE = r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP'
MODELS = ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737']

def audit_pdfs():
    print('========================================================================')
    print('                    20 份 PDF 交付物页面与视觉完整性深度审计             ')
    print('========================================================================\n')

    results = []

    for model in MODELS:
        m_dir = os.path.join(TARGET_BASE, model)
        pdf_files = [
            f'{model} msds_CN 冠志.pdf', f'{model} msds_CN 国彩.pdf',
            f'{model} msds_EN Guanzhi.pdf', f'{model} msds_EN Guocai.pdf',
        ]

        for pdf_name in pdf_files:
            pdf_path = os.path.join(m_dir, pdf_name)
            doc = fitz.open(pdf_path)
            num_pages = len(doc)
            
            # Inspect last page
            last_page = doc[num_pages - 1]
            last_text = last_page.get_text().strip()
            last_lines = [l.strip() for l in last_text.splitlines() if l.strip()]
            
            # Check for header/footer and substantive content
            has_substantive = any('16.' in l or 'SECTION 16' in l or '免责' in l or 'disclaimer' in l.lower() or '法规' in l or '15.' in l for l in last_lines)
            
            results.append({
                'model': model,
                'file': pdf_name,
                'pages': num_pages,
                'last_page_lines': len(last_lines),
                'substantive': has_substantive,
                'last_page_sample': last_lines[-3:] if len(last_lines) >= 3 else last_lines
            })

    for r in results:
        status = 'PASS' if r['last_page_lines'] >= 5 and r['substantive'] else 'WARN'
        print(f"[{status}] {r['file']}: {r['pages']} 页, 末页 {r['last_page_lines']} 行正文")
        if status == 'WARN':
            print(f"   末页样例: {r['last_page_sample']}")

if __name__ == '__main__':
    audit_pdfs()
