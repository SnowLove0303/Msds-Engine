import os
import sys
import zipfile
import re
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')

TARGET_BASE = r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP'
MODELS = ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737']
W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def get_xml(docx_path):
    with zipfile.ZipFile(docx_path) as z:
        return z.read('word/document.xml')

def check_micro_anomalies():
    print('========================================================================')
    print('                    微观排版、标点与文本忠实度敌手挑刺                   ')
    print('========================================================================\n')

    issues = []

    for model in MODELS:
        m_dir = os.path.join(TARGET_BASE, model)
        cn_doc = os.path.join(m_dir, f'{model} msds_CN 冠志.docx')
        en_doc = os.path.join(m_dir, f'{model} msds_EN Guanzhi.docx')

        cn_xml = get_xml(cn_doc)
        en_xml = get_xml(en_doc)

        cn_root = ET.fromstring(cn_xml)
        en_root = ET.fromstring(en_xml)

        # 1. 检查英文版中的全角字符 (除了允许的特殊符号如 ℃ 摄氏度需转换为 °C，全角标点应为半角)
        en_text = ''.join(en_root.itertext())
        fullwidth_colons = len(re.findall(r'：', en_text))
        fullwidth_commas = len(re.findall(r'，', en_text))
        fullwidth_periods = len(re.findall(r'。', en_text))
        fullwidth_semicolons = len(re.findall(r'；', en_text))
        chinese_chars = re.findall(r'[\u4e00-\u9fa5]', en_text)

        if fullwidth_colons > 0:
            issues.append(f'[{model} EN] 存在 {fullwidth_colons} 处全角冒号 "："')
        if fullwidth_commas > 0:
            issues.append(f'[{model} EN] 存在 {fullwidth_commas} 处全角逗号 "，"')
        if fullwidth_periods > 0:
            issues.append(f'[{model} EN] 存在 {fullwidth_periods} 处全角句号 "。"')
        if fullwidth_semicolons > 0:
            issues.append(f'[{model} EN] 存在 {fullwidth_semicolons} 处全角分号 "；"')
        if chinese_chars:
            issues.append(f'[{model} EN] 存在 {len(chinese_chars)} 个残留中文字符: {"".join(chinese_chars[:10])}')

        # 2. 检查英文版 Section 9 编号连续性
        en_tables = en_root.findall(f'.//{{{W_NS}}}tbl')
        en_s9 = en_tables[8]
        en_s9_text = ''.join(en_s9.itertext())
        # Check numbers 9.1 to 9.19
        for n in range(1, 20):
            tag = f'9.{n}'
            if tag not in en_s9_text:
                issues.append(f'[{model} EN] Section 9 缺少编号 {tag}')

        # 3. 检查英文版 Section 14 正温符号
        en_s14 = en_tables[13]
        en_s14_text = ''.join(en_s14.itertext())
        if '-5' in en_s14_text and '+5' not in en_s14_text:
            issues.append(f'[{model} EN] Section 14 温度误写为负温 -5°C')

        # 4. 检查英文版 Section 15 法规引用
        en_s15 = en_tables[14]
        en_s15_text = ''.join(en_s15.itertext())
        if '344' in en_s15_text:
            issues.append(f'[{model} EN] Section 15 引用了已废止的国务院第 344 号令')

        # 5. 检查中文版 Section 9 固含和粘度
        cn_tables = cn_root.findall(f'.//{{{W_NS}}}tbl')
        cn_s9 = cn_tables[8]
        cn_s9_text = ''.join(cn_s9.itertext())
        if model == 'EP-1736' and '＜400' not in cn_s9_text and '<400' not in cn_s9_text:
            issues.append(f'[{model} CN] Section 9 粘度缺少 ＜400mPa.s')

    print(f'微观审计发现问题总数: {len(issues)}')
    for issue in issues:
        print('  *', issue)

if __name__ == '__main__':
    check_micro_anomalies()
