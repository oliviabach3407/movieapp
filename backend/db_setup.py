import sqlite3

#connect to SQLite database (creates file if it doesn't exist)
conn = sqlite3.connect("database/movies.db")
cursor = conn.cursor()

#create tables
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    username TEXT UNIQUE, 
    password TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    title TEXT UNIQUE, 
    genre TEXT, 
    release_date TEXT,  -- New column for release date
    wins INTEGER DEFAULT 0, 
    losses INTEGER DEFAULT 0
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    title TEXT UNIQUE, 
    genre TEXT, 
    release_date TEXT,  -- New column for release date
    wins INTEGER DEFAULT 0, 
    losses INTEGER DEFAULT 0
)
""")

#commit changes and close connection
conn.commit()
conn.close()

print("Database setup complete.")