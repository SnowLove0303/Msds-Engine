import os
import sys
import zipfile
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')

TARGET_BASE = r'F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP'
MODELS = ['EP-1736', 'EP-1704', 'EP-1505', 'EP-1501', 'EP-1737']
W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def get_xml(docx_path):
    with zipfile.ZipFile(docx_path) as z:
        return z.read('word/document.xml')

def inspect_entities_and_sections():
    print('========================================================================')
    print('          双实体（冠志 vs 国彩）隔离性与 16 章节实质内容深度穿透         ')
    print('========================================================================\n')

    anomalies = []

    for model in MODELS:
        m_dir = os.path.join(TARGET_BASE, model)

        # 1. 实体对账: 冠志中文 vs 国彩中文
        gz_cn_doc = os.path.join(m_dir, f'{model} msds_CN 冠志.docx')
        gc_cn_doc = os.path.join(m_dir, f'{model} msds_CN 国彩.docx')
        gz_en_doc = os.path.join(m_dir, f'{model} msds_EN Guanzhi.docx')
        gc_en_doc = os.path.join(m_dir, f'{model} msds_EN Guocai.docx')

        gz_cn_txt = ''.join(ET.fromstring(get_xml(gz_cn_doc)).itertext())
        gc_cn_txt = ''.join(ET.fromstring(get_xml(gc_cn_doc)).itertext())
        gz_en_txt = ''.join(ET.fromstring(get_xml(gz_en_doc)).itertext())
        gc_en_txt = ''.join(ET.fromstring(get_xml(gc_en_doc)).itertext())

        # 冠志中文必须包含“冠志”，严禁包含“国彩”
        if '国彩' in gz_cn_txt:
            anomalies.append(f'[{model}] 冠志中文版串扰出现 "国彩"')
        if '冠志' not in gz_cn_txt:
            anomalies.append(f'[{model}] 冠志中文版缺少 "冠志"')
        if '020-36772341' not in gz_cn_txt:
            anomalies.append(f'[{model}] 冠志中文版缺少冠志法定电话 020-36772341')

        # 国彩中文必须包含“国彩”，严禁包含“冠志”
        if '冠志' in gc_cn_txt:
            anomalies.append(f'[{model}] 国彩中文版串扰出现 "冠志"')
        if '国彩' not in gc_cn_txt:
            anomalies.append(f'[{model}] 国彩中文版缺少 "国彩"')
        if '0763-2661888' not in gc_cn_txt:
            anomalies.append(f'[{model}] 国彩中文版缺少国彩法定电话 0763-2661888')

        # 冠志英文必须包含 Guanzhi，严禁出现 Guocai
        if 'Guocai' in gz_en_txt:
            anomalies.append(f'[{model}] 冠志英文版串扰出现 "Guocai"')
        if 'Guanzhi' not in gz_en_txt:
            anomalies.append(f'[{model}] 冠志英文版缺少 "Guanzhi"')

        # 国彩英文必须包含 Guocai，严禁出现 Guanzhi
        if 'Guanzhi' in gc_en_txt:
            anomalies.append(f'[{model}] 国彩英文版串扰出现 "Guanzhi"')
        if 'Guocai' not in gc_en_txt:
            anomalies.append(f'[{model}] 国彩英文版缺少 "Guocai"')

        # 检查 Section 7 标签
        gz_cn_root = ET.fromstring(get_xml(gz_cn_doc))
        tbl7 = gz_cn_root.findall(f'.//{{{W_NS}}}tbl')[6]
        s7_text = ''.join(tbl7.itertext())
        if '安全操作注意事项' not in s7_text:
            anomalies.append(f'[{model}] CN Section 7 缺少 "安全操作注意事项"')
        if '安全储存条件' not in s7_text:
            anomalies.append(f'[{model}] CN Section 7 缺少 "安全储存条件"')

        # 检查 Section 11 内容
        tbl11 = gz_cn_root.findall(f'.//{{{W_NS}}}tbl')[10]
        s11_text = ''.join(tbl11.itertext())
        if '急性毒性' not in s11_text:
            anomalies.append(f'[{model}] CN Section 11 缺少 "急性毒性"')

        # 检查 Section 12 内容
        tbl12 = gz_cn_root.findall(f'.//{{{W_NS}}}tbl')[11]
        s12_text = ''.join(tbl12.itertext())
        if '生态毒性' not in s12_text and '毒性' not in s12_text:
            anomalies.append(f'[{model}] CN Section 12 缺少 "生态毒性"')

        # 检查 Section 13 内容
        tbl13 = gz_cn_root.findall(f'.//{{{W_NS}}}tbl')[12]
        s13_text = ''.join(tbl13.itertext())
        if '废弃处置方法' not in s13_text:
            anomalies.append(f'[{model}] CN Section 13 缺少 "废弃处置方法"')

        # 检查 Section 14 内容
        tbl14 = gz_cn_root.findall(f'.//{{{W_NS}}}tbl')[13]
        s14_text = ''.join(tbl14.itertext())
        if '联合国危险货物编号' not in s14_text and '联合国编号' not in s14_text:
            anomalies.append(f'[{model}] CN Section 14 缺少联合国编号字段')

        # 检查 Section 15 内容
        tbl15 = gz_cn_root.findall(f'.//{{{W_NS}}}tbl')[14]
        s15_text = ''.join(tbl15.itertext())
        if '591' not in s15_text:
            anomalies.append(f'[{model}] CN Section 15 缺少国务院令第591号')

        # 检查 Section 16 内容
        tbl16 = gz_cn_root.findall(f'.//{{{W_NS}}}tbl')[15]
        s16_text = ''.join(tbl16.itertext())
        if '免责声明' not in s16_text:
            anomalies.append(f'[{model}] CN Section 16 缺少免责声明')

    print(f'深度穿透审计异常发现总数: {len(anomalies)}')
    for a in anomalies:
        print('  !', a)

if __name__ == '__main__':
    inspect_entities_and_sections()
