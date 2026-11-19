with open(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\full_16_sections_comparison.txt", "r", encoding="utf-8") as f:
    text = f.read()

sections = text.split("=======================================================")
for sec in sections:
    if not sec.strip():
        continue
    lines = sec.strip().split("\n")
    header = lines[0]
    print(f"\n*** {header} ***")
    src_lines = []
    deliv_lines = []
    mode = None
    for line in lines[1:]:
        if "--- SOURCE ---" in line:
            mode = "src"
            continue
        elif "--- DELIVERED ---" in line:
            mode = "deliv"
            continue
        if mode == "src" and line.strip():
            src_lines.append(line.strip())
        elif mode == "deliv" and line.strip():
            deliv_lines.append(line.strip())
            
    print(f"Source lines count: {len(src_lines)}, Delivered lines count: {len(deliv_lines)}")
    for sl in src_lines:
        print(f"  [SRC] {sl}")
    print("  vs")
    for dl in deliv_lines:
        print(f"  [DELIV] {dl}")
