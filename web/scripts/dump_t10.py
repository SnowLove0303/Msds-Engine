with open("audit_src_dump.txt", "r", encoding="utf-8") as f:
    text = f.read()
src_part = text.split("DELIVERED FILE")[0]
idx = src_part.find("Table 10")
print(src_part[idx:idx+1500])
