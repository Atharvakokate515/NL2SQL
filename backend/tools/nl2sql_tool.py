from nl2sql.generator import generate_sql
from nl2sql.validator import is_safe_sql
from db.executor import execute_sql
from db.schema import get_table_list


def nl2sql_tool(user_input: str, db_url: str):

    # Generate SQL
    sql = generate_sql(user_input, db_url)

    # Validate
    tables = get_table_list(db_url)
    validation = is_safe_sql(sql, tables)

    if not validation["safe"]:
        return {
            "tool": "nl2sql",
            "success": False,
            "error": validation["reason"],
            "sql": sql
        }

    # Execute
    result = execute_sql(db_url, sql)

    return {
        "tool": "nl2sql",
        "success": True,
        "sql": sql,
        "execution": result
    }
