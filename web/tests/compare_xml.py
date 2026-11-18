import zipfile
import xml.etree.ElementTree as ET

tpl_zip = zipfile.ZipFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/dist/templates/custom/custom_mcp_template_v1_正式模板_MSDS_CN_冠志(1).docx')
out_zip = zipfile.ZipFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-6013Bio/PU-6013BIO msds_CN 冠志.docx')

tpl_xml = tpl_zip.read('word/footer1.xml').decode('utf-8')
out_xml = out_zip.read('word/footer1.xml').decode('utf-8')

print("=== TEMPLATE FOOTER XML ===")
print(tpl_xml)

print("\n=== OUTPUT FOOTER XML ===")
print(out_xml)
