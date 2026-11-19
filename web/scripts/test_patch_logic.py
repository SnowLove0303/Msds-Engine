import docx
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import copy

def test_patch_docx():
    src_cn = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-4 水溶性丙烯酸树脂 PA\PA-4914\PA-4914 msds_CN 冠志.docx"
    doc = docx.Document(src_cn)
    
    # 1. Section 1: Table 0 Row 3 化学品分类
    t0 = doc.tables[0]
    t0.rows[3].cells[1].text = "丙烯酸聚合物"
    print("Table 0 Row 3 patched:", [c.text.strip() for c in t0.rows[3].cells])
    
    # 2. Section 9: Table 8 Row 1 外观
    t8 = doc.tables[8]
    t8.rows[1].cells[1].text = "微黄色透明液体"
    print("Table 8 Row 1 patched:", [c.text.strip() for c in t8.rows[1].cells])
    
    # 3. Section 8: Table 7
    t7 = doc.tables[7]
    # R11 工程控制
    eng_text = "使用局部排风或全面通风，保持工作场所空气中浓度低于职业接触限值；工作场所设置洗眼器与安全淋浴设施。"
    for c_i in range(2, 5):
        t7.rows[11].cells[c_i].text = eng_text
    print("Table 7 Row 11 patched:", [c.text.strip() for c in t7.rows[11].cells])
    
    # R14 and R15: Add OEL rows for 丙二醇甲醚
    # clone row 13 structure
    tr_template = copy.deepcopy(t7.rows[13]._tr)
    
    # Row 14: TLVTN
    r14 = copy.deepcopy(tr_template)
    cells_14 = r14.xpath('.//w:tc')
    print(f"Template row has {len(cells_14)} tc elements")
    
test_patch_docx()
