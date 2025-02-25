const express = require("express");
const db = require("../models/db");

const router = express.Router();

//POST endpoint to update 'wins' and 'losses' for a movie by title
router.post("/", (req, res) => {
    let title = req.query.title;
    const wins = req.query.wins;
    const losses = req.query.losses;

    if (!title) {
        return res.status(400).json({ error: "Title is required as a query parameter." });
    }

    //If a POST is performed without required parameters or with unacceptable parameters, the endpoint responds with an appropriate code and does not change global state.
    if (wins === undefined && losses === undefined) {
        return res.status(400).json({ error: "At least one of 'wins' or 'losses' must be provided as query parameters." });
    }

    title = decodeURIComponent(title).trim();
    
    //POST endpoint allows creation of things that is observable in subsequent GET requests
    let updateFields = [];
    let params = [];

    if (wins !== undefined) {
        updateFields.push("wins = ?");
        params.push(wins);
    }
    
    if (losses !== undefined) {
        updateFields.push("losses = ?");
        params.push(losses);
    }

    params.push(title);

    const query = `UPDATE movies SET ${updateFields.join(", ")} WHERE TRIM(title) = TRIM(?) COLLATE NOCASE`;

    //debugging
    console.log("Executing query:", query);
    console.log("With parameters:", params);

    db.run(query, params, function (err) {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Movie not found." });
        }

        //fetch the updated movie and send it in the response
        const selectQuery = `SELECT * FROM movies WHERE TRIM(title) = TRIM(?) COLLATE NOCASE`;
        db.get(selectQuery, [title], (err, row) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: err.message });
            }
            //POST Endpoint responds with an appropriate code.
            res.status(201).json(row);  //return the updated movie
        });
    });
});

//get movies with optional filters (title, genre, limit)
//GET Endpoint returns "everything" - whatever that means in the context of your API
router.get("/", (req, res) => {
    let title = req.query.title;
    const genre = req.query.genre;
    const limit = req.query.limit;
    
    let query = "SELECT * FROM movies";
    let params = [];
    let conditions = [];

    //The GET endpoint accepts parameters and responds with something different than "everything."

    //filter by title (case-insensitive search)
    if (title) {
        title = decodeURIComponent(title).trim();
        conditions.push("TRIM(title) LIKE TRIM(?) COLLATE NOCASE");
        params.push(`%${title}%`);
    }    

    //filter by genre (exact match or multiple genres)
    if (genre) {
        const genreList = genre.split(",").map(g => g.trim());
        conditions.push(
            genreList.map(() => "genre LIKE ?").join(" AND ")
        );
        params.push(...genreList.map(g => `%${g}%`));
    }

    //append WHERE clause if conditions exist
    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    //apply limit if provided
    if (limit) {
        query += " LIMIT ?";
        params.push(parseInt(limit, 10));
    }

    //debugging: Log the query and parameters
    console.log("Executing query:", query);
    console.log("With parameters:", params);

    //execute the query (search database)
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }
        console.log("Query result:", rows); // <-- Debugging line

        //A GET request with parameters that relate to no "thing" responds with a 404 code.
        if (rows.length === 0) {
            console.log("No movies found for title:", title);
            return res.status(404).json({ error: "No movies found." });
        }
        res.json(rows);
    });    
});

module.exports = router;