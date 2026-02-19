from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel
from db.connection import test_connection
from db.executor import execute_sql
from db.schema import get_schema
from nl2sql.validator import is_safe_sql
from db.schema import get_table_list
from nl2sql.generator import generate_sql

app = FastAPI()

class DBUrl(BaseModel):
    db_url: str

class DBRequest(BaseModel):
    db_url: str
    sql:str

class Userinput(BaseModel):
    db_url:str
    user_input:str

@app.post("/connect_db")
def connect_db(data: DBUrl):
    test_connection(data.db_url)
    return {"status": "connected"}

@app.post("/execute-raw-sql")
def run_sql(data:DBRequest):
    return execute_sql(data.db_url, data.sql)

@app.post("/schema")
def fetch_schema(data: DBUrl):
    return {"schema": get_schema(data.db_url)}

@app.post("/validate")
def validate_sql(data: DBRequest):
    tables = get_table_list(data.db_url)
    return is_safe_sql(data.sql, tables)

@app.post("/nl2sql")
def nl_to_sql(data:Userinput):
    sql = generate_sql(data.user_input, data.db_url)
    return {"generated_sql": sql}



from api.chat import router as chat_router
app.include_router(chat_router)



if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)
