from llm.client import generate_text
from backend.llm.nl2sql_prompts import NL2SQL_PROMPT
from db.schema import get_schema


def clean_sql(sql: str) -> str:
    sql = sql.replace("\\n", " ")
    sql = sql.replace("\n", " ")
    sql = sql.strip()
    return sql


def generate_sql(
    user_input: str,
    db_url: str,
    last_sql: str | None = None) -> str:

    schema = get_schema(db_url)

    prompt = NL2SQL_PROMPT.format(
        schema=schema,
        user_input=user_input,
        last_sql=last_sql or "None"
    )


    raw_output = generate_text(prompt)

    # Extract SQL (basic cleanup)
    sql = raw_output.content.strip()

    sql = clean_sql(sql)

    return sql
