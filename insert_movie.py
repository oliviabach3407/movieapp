import sqlite3
import requests

#connect to the db
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

#function to insert movie into the database
def insert_or_update_movie(title, genre, release_date):
    # Check if the movie already exists
    cursor.execute("SELECT id FROM movies WHERE title = ?", (title,))
    existing_movie = cursor.fetchone()

    if existing_movie:
        # Update the existing movie
        cursor.execute("""
        UPDATE movies SET genre = ?, release_date = ? WHERE title = ?
        """, (genre, release_date, title))
    else:
        # Insert a new movie
        cursor.execute("""
        INSERT INTO movies (title, genre, release_date)
        VALUES (?, ?, ?)
        """, (title, genre, release_date))

    conn.commit()

#function to fetch all movies from the TMDB API
def fetch_all_movies(api_key):
    genre_mapping = get_genre_mapping(api_key)  #get the genre ID to name mapping
    page = 1

    while True:
        url = "https://api.themoviedb.org/3/discover/movie"
        params = {
            "api_key": api_key,
            "include_adult": "false",
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

                # Convert genre IDs to names
                genre_names = [genre_mapping.get(str(genre_id), "Unknown") for genre_id in genre_ids]
                genre = ", ".join(genre_names)

                # Insert movie into database
                insert_or_update_movie(title, genre, release_date)

            # Check if there are more pages
            if data["page"] >= data["total_pages"]:
                break

            page += 1
        else:
            print("No more movies found.")
            break

api_key = "f0b574bcef41aafc4bc021e2f0e06f76"
fetch_all_movies(api_key)

#close the connection
conn.close()
