import re

with open(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\full_16_sections_comparison.txt", "r", encoding="utf-8") as f:
    text = f.read()

sections = text.split("=======================================================")

with open(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\detailed_diff_analysis.txt", "w", encoding="utf-8") as out:
    for idx, sec in enumerate(sections):
        if not sec.strip():
            continue
        lines = sec.strip().split("\n")
        header = lines[0]
        out.write(f"\n=======================================================\n")
        out.write(f"ANALYSIS OF {header}\n")
        out.write(f"=======================================================\n")
        
        src_map = {}
        deliv_map = {}
        mode = None
        for line in lines[1:]:
            if "--- SOURCE ---" in line:
                mode = "src"
                continue
            elif "--- DELIVERED ---" in line:
                mode = "deliv"
                continue
            if mode == "src" and line.strip().startswith("S_R"):
                parts = line.strip().split(": ", 1)
                if len(parts) == 2:
                    src_map[parts[0]] = parts[1]
            elif mode == "deliv" and line.strip().startswith("D_R"):
                parts = line.strip().split(": ", 1)
                if len(parts) == 2:
                    deliv_map[parts[0]] = parts[1]
        
        out.write("--- SOURCE ROWS ---\n")
        for k, v in src_map.items():
            out.write(f"{k}: {v}\n")
            
        out.write("\n--- DELIVERED ROWS ---\n")
        for k, v in deliv_map.items():
            out.write(f"{k}: {v}\n")
