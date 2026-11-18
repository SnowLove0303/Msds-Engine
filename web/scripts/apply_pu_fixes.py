import os

path = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js'
with open(path, 'rb') as f:
    raw = f.read()

# Detect CRLF vs LF
crlf = b'\r\n' in raw
newline = '\r\n' if crlf else '\n'

with open(path, 'r', encoding='utf-8', newline='') as f:
    text = f.read()

# 1. translateSection9Item appearance
target1 = "    if (/黄色至浅褐色透明液体|黄.*浅褐.*透明/i.test(cnVal)) enVal = 'Yellow to light brown transparent liquid';"
replacement1 = "    if (/黄色.*透明.*半透明|黄.*半透明/i.test(cnVal)) enVal = 'Yellow transparent to translucent liquid';" + newline + "    else if (/黄色至浅褐色透明液体|黄.*浅褐.*透明/i.test(cnVal)) enVal = 'Yellow to light brown transparent liquid';"
assert target1 in text, "target1 not found"
text = text.replace(target1, replacement1, 1)

# 2. translateSection9Item odour and pH
target2 = "  } else if (/嗅觉/i.test(cnLabel)) {\n    enLabel = 'Odour threshold:';\n    enVal = /胺味/.test(cnVal) ? 'Amine-like' : (/无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal);\n  } else if (/pH/i.test(cnLabel)) {\n    enLabel = 'pH value:';\n    enVal = /无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal;"
target2 = target2.replace('\n', newline)
replacement2 = """  } else if (/嗅觉/i.test(cnLabel)) {
    enLabel = 'Odour threshold:';
    if (/酒精|乙醇/.test(cnVal)) enVal = 'Alcohol-like';
    else if (/胺味/.test(cnVal)) enVal = 'Amine-like';
    else if (/特征/.test(cnVal)) enVal = 'Characteristic odour';
    else if (/无味/.test(cnVal)) enVal = 'Odourless';
    else if (/无数据|无资料/.test(cnVal)) enVal = 'No data available.';
    else enVal = cnVal;
  } else if (/pH/i.test(cnLabel)) {
    enLabel = 'pH value:';
    if (/无数据|无资料/.test(cnVal)) enVal = 'No data available.';
    else if (/按.*稀释|稀释/.test(cnVal)) {
      const m = cnVal.match(/[\\d.-]+/);
      enVal = m ? m[0] : cnVal;
    }
    else enVal = cnVal;""".replace('\n', newline)
assert target2 in text, "target2 not found"
text = text.replace(target2, replacement2, 1)

# 3. buildEnglishFacts appearance
target3 = "        if (/外观/i.test(lbl)) {\n          if (/乳白.*蓝光|蓝光.*乳液/i.test(val)) sec9Facts.appearance = 'Milky white emulsion with bluish tint';"
target3 = target3.replace('\n', newline)
replacement3 = """        if (/外观/i.test(lbl)) {
          if (/黄色.*透明.*半透明|黄.*半透明/i.test(val)) sec9Facts.appearance = 'Yellow transparent to translucent liquid';
          else if (/乳白.*蓝光|蓝光.*乳液/i.test(val)) sec9Facts.appearance = 'Milky white emulsion with bluish tint';""".replace('\n', newline)
assert target3 in text, "target3 not found"
text = text.replace(target3, replacement3, 1)

# 4. buildEnglishFacts odour and pH
target4 = "        } else if (/嗅觉阈值/i.test(lbl)) {\n          sec9Facts.odour_threshold = /无数据/i.test(val) ? 'No data available.' : val;\n        } else if (/pH/i.test(lbl)) {\n          sec9Facts.ph = /无数据/i.test(val) ? 'No data available.' : val;"
target4 = target4.replace('\n', newline)
replacement4 = """        } else if (/嗅觉/i.test(lbl)) {
          if (/酒精|乙醇/.test(val)) sec9Facts.odour_threshold = 'Alcohol-like';
          else if (/胺味/.test(val)) sec9Facts.odour_threshold = 'Amine-like';
          else if (/无数据/i.test(val)) sec9Facts.odour_threshold = 'No data available.';
          else sec9Facts.odour_threshold = val;
        } else if (/pH/i.test(lbl)) {
          if (/无数据/i.test(val)) sec9Facts.ph = 'No data available.';
          else if (/按.*稀释|稀释/.test(val)) {
            const m = val.match(/[\\d.-]+/);
            sec9Facts.ph = m ? m[0] : val;
          }
          else sec9Facts.ph = val;""".replace('\n', newline)
assert target4 in text, "target4 not found"
text = text.replace(target4, replacement4, 1)

# 5. facts.phOverride
target5 = "    if (facts.viscosityOverride) {\n      sec9Facts.viscosity = facts.viscosityOverride;\n    }"
target5 = target5.replace('\n', newline)
replacement5 = """    if (facts.viscosityOverride) {
      sec9Facts.viscosity = facts.viscosityOverride;
    }
    if (facts.phOverride) {
      sec9Facts.ph = facts.phOverride;
    }""".replace('\n', newline)
assert target5 in text, "target5 not found"
text = text.replace(target5, replacement5, 1)

# 6. facts.section9Overrides pH
target6 = "        else if (/密度/i.test(pattern)) sec9Facts.density = val.replace(/约\\s*/g, 'Approx. ');"
replacement6 = target6 + newline + "        else if (/pH|PH/i.test(pattern)) sec9Facts.ph = val;"
assert target6 in text, "target6 not found"
text = text.replace(target6, replacement6, 1)

# 7. Section 3 comp ethanol
target7 = "            else if (/丙酮/i.test(cnName)) enName = 'Acetone';"
replacement7 = "            else if (/乙醇/i.test(cnName)) enName = 'Ethanol';" + newline + target7
assert target7 in text, "target7 not found"
text = text.replace(target7, replacement7, 1)

# 8. buildBaseChineseEngine pH override
target8 = "        } else if (/外\\s*观/i.test(coreLabel) && (facts.appearanceOverride || facts.section9Overrides?.['外观'] || facts.section9Overrides?.['外 观'])) {\n          val = facts.appearanceOverride || facts.section9Overrides?.['外观'] || facts.section9Overrides?.['外 观'];"
target8 = target8.replace('\n', newline)
replacement8 = target8 + newline + """        } else if (/pH|PH/i.test(coreLabel) && (facts.phOverride || facts.section9Overrides?.['pH'] || facts.section9Overrides?.['pH值'])) {
          val = facts.phOverride || facts.section9Overrides?.['pH'] || facts.section9Overrides?.['pH值'];""".replace('\n', newline)
assert target8 in text, "target8 not found"
text = text.replace(target8, replacement8, 1)

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(text)

print("All 8 targets successfully replaced with preserved line endings!")
