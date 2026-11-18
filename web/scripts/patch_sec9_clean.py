import re

path = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target_wrong = """    if (/无数据|无资料/.test(cnVal)) enVal = 'No data available.';
    else if (/按.*稀释|稀释/.test(cnVal)) {
      const m = cnVal.match(/[\\d.-]+/);
      enVal = m ? m[0] : cnVal;
    }
    else enVal = cnVal;"""

replacement_normal = "    enVal = /无数据|无资料/.test(cnVal) ? 'No data available.' : cnVal;"

# The first one is in pH! We want to keep it in pH, but replace it back in the other 5 places.
parts = text.split(target_wrong)
print(f"Split into {len(parts)} parts")
if len(parts) == 7:
    # parts[0] is before pH
    # parts[1] is after pH (before 相对蒸气密度)
    # parts[2] is after 相对蒸气密度 (before 表面张力)
    # parts[3] is after 表面张力 (before 分配系数)
    # parts[4] is after 分配系数 (before 分解温度)
    # parts[5] is after 分解温度 (before 爆炸特性)
    # parts[6] is after 爆炸特性
    new_text = parts[0] + target_wrong + parts[1] + replacement_normal + parts[2] + replacement_normal + parts[3] + replacement_normal + parts[4] + replacement_normal + parts[5] + replacement_normal + parts[6]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("Successfully patched pipeline-engine.js!")
else:
    print("Unexpected parts count!")
