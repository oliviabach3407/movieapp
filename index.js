#!/usr/bin/env node
const http = require("http");
const url = require("url");
const db = require('/var/www/html/backend/models/db');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const handleRequest = (req, res) => {
    const { method, url: requestUrl } = req;
    const parsedUrl = url.parse(requestUrl, true);
    const { pathname, query } = parsedUrl;

    res.setHeader("Content-Type", "application/json");

    //GET /movies
    //if no parameters given, GET Endpoint returns "everything" - whatever that means in the context of your API
    if (method === "GET" && pathname === "/movies") {
        let sqlQuery = "SELECT * FROM movies";
        let params = [];
        let conditions = [];

        //The GET endpoint accepts parameters and responds with something different than "everything."
        //you can:
        //filter by title
        if (query.title) {
            const title = decodeURIComponent(query.title).trim();
            conditions.push("TRIM(title) LIKE TRIM(?) COLLATE NOCASE");
            params.push(`%${title}%`);
        }

        //filter by genre
        if (query.genre) {
            const genreList = query.genre.split(",").map(g => g.trim());
            conditions.push(
                genreList.map(() => "genre LIKE ?").join(" AND ")
            );
            params.push(...genreList.map(g => `%${g}%`));
        }

        //add conditions to query
        if (conditions.length > 0) {
            sqlQuery += " WHERE " + conditions.join(" AND ");
        }

        //apply limit if provided
        if (query.limit) {
            sqlQuery += " LIMIT ?";
            params.push(parseInt(query.limit, 10));
        }

        // Execute the query
        db.all(sqlQuery, params, (err, rows) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: err.message }));
            }

            //A GET request with parameters that relate to no "thing" responds with a 404 code.
            if (rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "No movies found." }));
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(rows));
        });
    }

    //POST /movies (update wins/losses)
    //POST endpoint allows creation of things that is observable in subsequent GET requests
    else if (method === "POST" && pathname === "/movies") {
        const title = query.title;
        const wins = query.wins;
        const losses = query.losses;

        //If a POST is performed without required parameters or with unacceptable parameters, the endpoint responds with an appropriate code and does not change global state.
        if (!title) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Title is required as a query parameter." }));
        }

        //If a POST is performed without required parameters or with unacceptable parameters, the endpoint responds with an appropriate code and does not change global state.
        if (wins === undefined && losses === undefined) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "At least one of 'wins' or 'losses' must be provided as query parameters." }));
        }

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

        const queryString = `UPDATE movies SET ${updateFields.join(", ")} WHERE TRIM(title) = TRIM(?) COLLATE NOCASE`;

        //update the movie in the database
        db.run(queryString, params, function (err) {
            if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: err.message }));
            }

            if (this.changes === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Movie not found." }));
            }

            //fetch the updated movie
            const selectQuery = `SELECT * FROM movies WHERE TRIM(title) = TRIM(?) COLLATE NOCASE`;
            db.get(selectQuery, [title], (err, row) => {
                if (err) {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: err.message }));
                }

                //POST Endpoint responds with an appropriate code. (201)
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify(row)); // Return updated movie
            });
        });
    } 
    
    else if (pathname === "/signup" && method === "POST") {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", async () => {
            const { username, password } = JSON.parse(body);
            const hashedPassword = await bcrypt.hash(password, 10);
            
            db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function (err) {
                if (err) {
                    res.statusCode = err.code === "SQLITE_CONSTRAINT" ? 400 : 500;
                    return res.end(JSON.stringify({ message: "Error creating account" }));
                }
                res.statusCode = 201;
                res.end(JSON.stringify({ message: "User created successfully" }));
            });
        });
    } 

    else if (pathname === "/login" && method === "POST") {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", () => {
            const { username, password } = JSON.parse(body);
            
            db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
                if (err) {
                    res.statusCode = 500;
                    return res.end(JSON.stringify({ message: "Database error" }));
                }
                if (!user || !(await bcrypt.compare(password, user.password))) {
                    res.statusCode = 401;
                    return res.end(JSON.stringify({ message: "Invalid credentials" }));
                }
                
                const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });
                res.statusCode = 200;
                res.end(JSON.stringify({ token }));
            });
        });
    } 
    
    else if (pathname === "/users/me" && method === "PUT") {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", async () => {
            const { username, password } = JSON.parse(body);
            const token = req.headers.authorization?.split(" ")[1];
            
            if (!token) {
                res.statusCode = 401;
                return res.end(JSON.stringify({ message: "Authentication required" }));
            }
            
            try {
                const decoded = jwt.verify(token, SECRET_KEY);
                const userId = decoded.id;
                let updateFields = [];
                let params = [];
                
                if (username) {
                    updateFields.push("username = ?");
                    params.push(username);
                }
                
                if (password) {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    updateFields.push("password = ?");
                    params.push(hashedPassword);
                }
                
                if (updateFields.length === 0) {
                    res.statusCode = 400;
                    return res.end(JSON.stringify({ message: "No changes provided" }));
                }
                
                params.push(userId);
                const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
                
                db.run(sql, params, function (err) {
                    if (err) {
                        res.statusCode = 500;
                        return res.end(JSON.stringify({ message: "Error updating account" }));
                    }
                    res.statusCode = 200;
                    res.end(JSON.stringify({ message: "Account updated successfully" }));
                });
            } catch (error) {
                res.statusCode = 401;
                res.end(JSON.stringify({ message: "Invalid or expired token" }));
            }
        });
    } 
    
    else {
        //handle 404 for any other routes
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
};

//create server and listen on port 3000
const server = http.createServer(handleRequest);
server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});