import sqlite3
import requests

# Connect to SQLite database
conn = sqlite3.connect("database/movies.db")
cursor = conn.cursor()

# Function to insert movie into the database
def insert_movie(title, genre, release_date):
    cursor.execute("""
    INSERT INTO movies (title, genre, release_date)
    VALUES (?, ?, ?)
    """, (title, genre, release_date))
    conn.commit()

# Function to fetch all movies from the TMDB API
def fetch_all_movies(api_key):
    page = 1
    while True:
        url = f"https://api.themoviedb.org/3/discover/movie"
        
        params = {
            "api_key": api_key,
            "include_adult": "false",  # Filter out adult content
            "page": page,
            "language": "en-US"
        }

        response = requests.get(url, params=params)
        data = response.json()

        if "results" in data:
            for movie in data["results"]:
                title = movie.get("title")
                genre_ids = movie.get("genre_ids", [])
                release_date = movie.get("release_date")
                
                # Join genre IDs as a comma-separated string
                genre = ",".join(map(str, genre_ids))
                
                # Insert movie into database
                insert_movie(title, genre, release_date)

            # Check if there are more pages
            if data["page"] >= data["total_pages"]:
                break

            # Go to the next page
            page += 1
        else:
            print("No more movies found.")
            break

# Example usage:
api_key = "f0b574bcef41aafc4bc021e2f0e06f76"  # Replace with your actual TMDB API key
fetch_all_movies(api_key)

# Close the connection
conn.close()
