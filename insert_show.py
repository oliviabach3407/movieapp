import sqlite3
import requests

# Connect to SQLite database
conn = sqlite3.connect("database/movies.db")
cursor = conn.cursor()

# Function to insert shows into the database
def insert_show(title, genre, release_date):
    cursor.execute("""
    INSERT INTO shows (title, genre, release_date)
    VALUES (?, ?, ?)
    """, (title, genre, release_date))
    conn.commit()

# Function to fetch all shows from the TMDB API
def fetch_all_shows(api_key):
    page = 1
    while True:
        url = f"https://api.themoviedb.org/3/discover/tv"
        
        params = {
            "api_key": api_key,
            "include_adult": "false",  # Filter out adult content
            "page": page,
            "language": "en-US"
        }

        response = requests.get(url, params=params)
        data = response.json()

        if "results" in data:
            for show in data["results"]:
                title = show.get("name")
                genre_ids = show.get("genre_ids", [])
                release_date = show.get("first_air_date")
                
                # Join genre IDs as a comma-separated string
                genre = ",".join(map(str, genre_ids))
                
                # Insert show into database
                insert_show(title, genre, release_date)

            # Check if there are more pages
            if data["page"] >= data["total_pages"]:
                break

            # Go to the next page
            page += 1
        else:
            print("No more shows found.")
            break

# Example usage:
api_key = "f0b574bcef41aafc4bc021e2f0e06f76"  # Replace with your actual TMDB API key
fetch_all_shows(api_key)

# Close the connection
conn.close()
