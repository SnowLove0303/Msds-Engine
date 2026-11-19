with open(r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\web\scripts\detailed_diff_analysis.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

def print_range(start_sec, end_sec):
    printing = False
    for l in lines:
        if any(f"SECTION / TABLE {i}:" in l for i in range(start_sec, end_sec+1)):
            printing = True
        elif any(f"SECTION / TABLE {i}:" in l for i in range(end_sec+1, 20)):
            printing = False
        if printing:
            print(l.rstrip())

print("=== SECTIONS 0 to 4 ===")
print_range(0, 4)
