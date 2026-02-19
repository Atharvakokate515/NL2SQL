# backend/db/executor.py
import time
import psycopg2

# To ouput table UI 
def extract_table_name(sql: str):

    sql_lower = sql.lower()

    if "update" in sql_lower:
        return sql_lower.split("update")[1].split()[0]

    if "delete from" in sql_lower:
        return sql_lower.split("delete from")[1].split()[0]

    if "insert into" in sql_lower:
        return sql_lower.split("insert into")[1].split()[0]

    return None


def execute_sql(db_url: str, sql: str):
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    start_time = time.time()

    try:
        cur.execute(sql)

        query_type = sql.strip().split()[0].upper()

        if query_type == "SELECT":
            data = cur.fetchall()
            result = {
                "type": "select",
                "rows": data,
                "row_count": len(data)
            }
        # To output table UI 
        else:
            conn.commit()

            rows_affected = cur.rowcount

            table_name = extract_table_name(sql)

            updated_rows = []

            if table_name:

                cur.execute(f"SELECT * FROM {table_name}")

                data = cur.fetchall()
                columns = [desc[0] for desc in cur.description]

                updated_rows = [
                    dict(zip(columns, row))
                    for row in data
                ]

            result = {
                "type": "mutation",
                "rows_affected": rows_affected,
                "updated_table": updated_rows
            }


        exec_time = round(time.time() - start_time, 4)

        return {
            "success": True,
            "query_type": query_type,
            "execution_time_sec": exec_time,
            "result": result
        }

    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "error": str(e)
        }

    finally:
        cur.close()
        conn.close()
