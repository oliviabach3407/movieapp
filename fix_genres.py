import sqlite3
import requests

# Connect to SQLite database
conn = sqlite3.connect("database/movies.db")
cursor = conn.cursor()

#my API returns genres as numbers - have to map them to the actual words
def get_genre_mapping(api_key):
    url = f"https://api.themoviedb.org/3/genre/movie/list"
    params = {"api_key": api_key, "language": "en-US"}

    response = requests.get(url, params=params)
    data = response.json()

    genre_mapping = {str(genre["id"]): genre["name"] for genre in data.get("genres", [])}
    return genre_mapping

api_key = "f0b574bcef41aafc4bc021e2f0e06f76"

#get the genre mapping from TMDB
genre_mapping = get_genre_mapping(api_key)

#fetch all movies
cursor.execute("SELECT id, genre FROM movies")
movies = cursor.fetchall()

for movie_id, genre_ids in movies:
    genre_ids_list = genre_ids.split(",")  # Split numeric genre IDs
    genre_names = [genre_mapping.get(genre_id, "Unknown") for genre_id in genre_ids_list]
    genre_text = ", ".join(genre_names)

    # Update the movie record with genre names
    cursor.execute("UPDATE movies SET genre = ? WHERE id = ?", (genre_text, movie_id))

#commit changes and close connection
conn.commit()
conn.close()

print("Database updated with proper genre names!")
