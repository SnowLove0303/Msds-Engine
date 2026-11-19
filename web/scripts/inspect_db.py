import sqlite3

db_path = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/data/msds_repo.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print('Tables:', tables)

for (t,) in tables:
    count = cursor.execute(f'SELECT count(*) FROM "{t}"').fetchone()[0]
    print(f'Table {t}: {count} rows')
    cols = cursor.execute(f'PRAGMA table_info("{t}")').fetchall()
    print(f'  Cols: {[c[1] for c in cols]}')
