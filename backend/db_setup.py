import sqlite3

# Connect to SQLite database (creates file if it doesn't exist)
conn = sqlite3.connect("database/movies.db")
cursor = conn.cursor()

# Create tables
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
    title TEXT, 
    genre TEXT, 
    release_date TEXT,  -- New column for release date
    wins INTEGER DEFAULT 0, 
    losses INTEGER DEFAULT 0
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    title TEXT, 
    genre TEXT, 
    release_date TEXT,  -- New column for release date
    wins INTEGER DEFAULT 0, 
    losses INTEGER DEFAULT 0
)
""")

# Commit changes and close connection
conn.commit()
conn.close()

print("Database setup complete.")