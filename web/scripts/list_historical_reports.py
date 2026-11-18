import os, glob

report_dir = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\产出物审计报告"
if os.path.exists(report_dir):
    print("REPORTS IN 产出物审计报告:")
    for f in os.listdir(report_dir):
        print("  ", f)

report_dir2 = r"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\问题研究报告"
if os.path.exists(report_dir2):
    print("\nREPORTS IN 问题研究报告:")
    for f in os.listdir(report_dir2):
        print("  ", f)
