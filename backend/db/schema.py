# backend/db/schema.py
import psycopg2

def get_schema(db_url: str) -> str:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    cur.execute("""
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    schema = {}
    for table, column, dtype in rows:
        schema.setdefault(table, []).append(f"{column} ({dtype})")

    schema_text = ""
    for table, columns in schema.items():
        schema_text += f"Table: {table}\n"
        for col in columns:
            schema_text += f"  - {col}\n"
        schema_text += "\n"

    return schema_text.strip()


def get_table_list(db_url: str) -> list[str]:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public';
    """)

    tables = [row[0] for row in cur.fetchall()]

    cur.close()
    conn.close()

    return tables
