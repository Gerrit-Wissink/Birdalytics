import os
from dotenv import load_dotenv
from psycopg import connect
from psycopg.rows import dict_row

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    print("Connecting to database...")
    return connect(DATABASE_URL, row_factory=dict_row, autocommit=True)