import pymupdf

doc = pymupdf.open("E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A/PU-2346A msds_CN 冠志.pdf")

print("Checking character/span positions for Section 11:")
for pno in [3, 4, 5, 6]:
    page = doc[pno]
    text_page = page.get_text("dict")
    for block in text_page["blocks"]:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            line_text = "".join(span.get("text", "") for span in line["spans"])
            if any(k in line_text for k in ['11.1', '11.7', '性：', '8.1', '9.1', '呼吸', '手部']):
                print(f"p{pno+1}: text='{line_text}' bbox={line['bbox']}")
                for span in line["spans"]:
                    print(f"   span text='{span['text']}', bbox=({span['bbox'][0]:.2f}, {span['bbox'][1]:.2f}, {span['bbox'][2]:.2f}, {span['bbox'][3]:.2f})")
