import subprocess
import os
import pypdf

WPS_CLI = r'C:\Users\Administrator\AppData\Local\Kingsoft\WPS Office\12.1.0.17885\office6\wps.exe'
p1 = r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-4 水溶性丙烯酸树脂 PA\PA-4840\PA-4840 msds_CN 冠志_源文件留存.docx'
p2 = r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-1 单组份水性丙烯酸乳液 PA\PA-4902\PA-4902msds_CN 冠志___源文件留存.docx'

print('=== CHECKING SOURCE FILE PAGE COUNTS ===')

def check_doc(doc_path):
    tmp_pdf = doc_path.replace('.docx', '_src_test.pdf')
    try:
        subprocess.run([WPS_CLI, '/exportpdf', doc_path, tmp_pdf], timeout=30, check=True)
        reader = pypdf.PdfReader(tmp_pdf)
        print(os.path.basename(doc_path), '-> Source PDF pages:', len(reader.pages))
        os.remove(tmp_pdf)
    except Exception as e:
        print('Error converting:', e)

check_doc(p1)
check_doc(p2)
