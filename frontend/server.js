const express = require("express");
const path = require("path");
const app = express();
const jwt = require("jsonwebtoken");

//get static files from the "frontend" folder
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json()); 

const dbPath = path.join(__dirname, "../database/movies.db");
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)`);

//Sign-Up Endpoint (Register a new user) - POST
app.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password required" });
    }

    try {
        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: "Username already exists" });
            }
            res.json({ success: true, message: "User registered successfully!" });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

//Login Endpoint (Authenticate User) - POST and GET
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            // Generate a JWT token
            const token = jwt.sign({ id: user.id, username: user.username }, 'your_secret_key', { expiresIn: '1h' });

            res.json({ success: true, message: "Login successful", token: token });
        } else {
            res.status(401).json({ success: false, message: "Invalid username or password" });
        }
    });
});

//middleware to check authentication token
function checkAuth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(token, "your_secret_key");
        req.userId = decoded.id; // Store the user ID in the request
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

//GET current user data
app.get("/users/me", checkAuth, (req, res) => {
    const userId = req.userId; // The userId is set by the checkAuth middleware

    db.get("SELECT username FROM users WHERE id = ?", [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching user data" });
        }
        if (!row) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ username: row.username }); // Respond with the username
    });
});


//PUT update password - PUT
app.put("/users/:id", checkAuth, async (req, res) => {
    const { id } = req.params;
    const { password } = req.body; // New password

    if (!password) {
        return res.status(400).json({ success: false, message: "Password is required" });
    }

    try {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the password in the database
        db.run(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, id],
            function (err) {
                if (err) {
                    return res.status(500).json({ success: false, message: err.message });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ success: false, message: "User not found" });
                }
                res.json({ success: true, message: "Password updated successfully" });
            }
        );
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

//DELETE account - DELETE
app.delete("/users/:id", checkAuth, (req, res) => {
    const { id } = req.params;

    db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, message: "Account deleted successfully" });
    });
});

//GET all movies
app.get("/movies", (req, res) => {
    db.all("SELECT * FROM movies", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

//start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});