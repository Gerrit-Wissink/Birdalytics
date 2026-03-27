import os
from dotenv import load_dotenv
from psycopg import connect
from psycopg.rows import dict_row

load_dotenv()

DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

def get_connection():
    print("Connecting to database...")
    try:
        conn = connect(DATABASE_URL, row_factory=dict_row, autocommit=True)
        print("Database connection successful!")
        return conn
    except Exception as e:
        print(f"ERROR connecting to database: {e}")
        print(f"Connection string: {DATABASE_URL}")
        raise