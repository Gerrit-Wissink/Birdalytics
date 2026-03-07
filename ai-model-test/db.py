import os
from psycopg import connect
from psycopg.rows import dict_row

# TODO: env file for url
DATABASE_URL = "postgresql://postgres:student@localhost:5432/birdalytics"

def get_connection():
    return connect(DATABASE_URL, row_factory=dict_row, autocommit=True)