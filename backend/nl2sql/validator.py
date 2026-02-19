# backend/nl2sql/validator.py

FORBIDDEN_KEYWORDS = [
    "drop",
    "alter",
    "truncate",
    "grant",
    "revoke"
]


def is_safe_sql(sql: str, allowed_tables: list[str]) -> dict:
    sql_lower = sql.lower()

    # 1️ Block forbidden keywords
    for word in FORBIDDEN_KEYWORDS:
        if word in sql_lower:
            return {
                "safe": False,
                "reason": f"Forbidden keyword detected: {word}"
            }

    # 2️ Enforce WHERE for UPDATE / DELETE
    if sql_lower.startswith("update") or sql_lower.startswith("delete"):
        if "where" not in sql_lower:
            return {
                "safe": False,
                "reason": "UPDATE/DELETE without WHERE is not allowed"
            }

    # 3️ Check table usage
    table_safe = any(table in sql_lower for table in allowed_tables)

    if not table_safe:
        return {
            "safe": False,
            "reason": "Query uses unknown table"
        }

    return {"safe": True}
