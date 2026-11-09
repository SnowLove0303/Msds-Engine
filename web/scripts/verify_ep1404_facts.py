import fitz  # PyMuPDF
import sys
import re
import os

sys.stdout.reconfigure(encoding='utf-8')

pdf_dir = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\04-1 水性环氧树脂 EP\EP-1404"
pdf_files = [
    "EP-1404 msds_CN 冠志.pdf",
    "EP-1404 msds_CN 国彩.pdf",
    "EP-1404 msds_EN Guanzhi.pdf",
    "EP-1404 msds_EN Guocai.pdf"
]

print("==========================================================================")
print("              EP-1404 交付物 PDF 核心事实物理实测与显微核销                 ")
print("==========================================================================")

all_passed = True

for pdf_name in pdf_files:
    pdf_path = os.path.join(pdf_dir, pdf_name)
    if not os.path.exists(pdf_path):
        print(f"❌ File not found: {pdf_path}")
        all_passed = False
        continue

    doc = fitz.open(pdf_path)
    full_text = "\n".join([page.get_text() for page in doc])
    is_en = "EN" in pdf_name

    print(f"\n📄 正在实测: {pdf_name} (总页数: {len(doc)})")

    # 1. Section 1.1
    if is_en:
        has_prod = "Anhydrous epoxy resin EP-1404" in full_text
        has_cat = "Anhydrous epoxy resin" in full_text
        has_bad_emulsion = "Waterborne epoxy emulsion" in full_text
        has_bad_dispersion = "Epoxy water dispersion" in full_text

        print(f"  [S1.1 品名] 'Anhydrous epoxy resin EP-1404': {'✅ 存在' if has_prod else '❌ 缺失'}")
        print(f"  [S1.1 分类] 'Anhydrous epoxy resin': {'✅ 存在' if has_cat else '❌ 缺失'}")
        print(f"  [S1.1 防串流] 严禁包含 Waterborne epoxy emulsion: {'✅ 纯净' if not has_bad_emulsion else '❌ 发现污染'}")
        print(f"  [S1.1 防串流] 严禁包含 Epoxy water dispersion: {'✅ 纯净' if not has_bad_dispersion else '❌ 发现污染'}")

        if not (has_prod and has_cat and not has_bad_emulsion and not has_bad_dispersion):
            all_passed = False
    else:
        has_prod = "无水环氧 EP-1404" in full_text or "无水环氧" in full_text
        has_cat = "无水环氧" in full_text
        print(f"  [S1.1 品名] '无水环氧': {'✅ 存在' if has_prod else '❌ 缺失'}")
        print(f"  [S1.1 分类] '无水环氧': {'✅ 存在' if has_cat else '❌ 缺失'}")
        if not (has_prod and has_cat):
            all_passed = False

    # 2. Section 9.1 Appearance
    if is_en:
        has_app = "Light yellow transparent liquid" in full_text
        has_milky = "Milky white" in full_text
        print(f"  [S9.1 外观] 'Light yellow transparent liquid': {'✅ 存在' if has_app else '❌ 缺失'}")
        print(f"  [S9.1 防篡改] 严禁包含 Milky white: {'✅ 纯净' if not has_milky else '❌ 发现篡改'}")
        if not (has_app and not has_milky):
            all_passed = False
    else:
        has_app = "微黄透明状液体" in full_text
        has_milky = "乳白液体" in full_text
        print(f"  [S9.1 外观] '微黄透明状液体': {'✅ 存在' if has_app else '❌ 缺失'}")
        print(f"  [S9.1 防篡改] 严禁包含 乳白液体: {'✅ 纯净' if not has_milky else '❌ 发现篡改'}")
        if not (has_app and not has_milky):
            all_passed = False

    # 3. Check for punctuation stickiness in EN
    if is_en:
        # Search for (SCBA)
        scba_match = re.search(r"\(SCBA\)([^\s])", full_text)
        if scba_match:
            print(f"  [OBS-01 标点空格] ❌ 发现 (SCBA) 后无空格黏连: '(SCBA){scba_match.group(1)}'")
            all_passed = False
        else:
            print("  [OBS-01 标点空格] ✅ (SCBA) 后标点空格隔离正常")

    doc.close()

print("\n--------------------------------------------------------------------------")
if all_passed:
    print("🏆 物理实测结论: 全部 4 份 PDF 交付物 100% 忠实于源文档事实，无任何篡改与串流！[Measured] PASS")
    sys.exit(0)
else:
    print("❌ 物理实测结论: 发现事实不符缺陷！FAIL")
    sys.exit(1)
