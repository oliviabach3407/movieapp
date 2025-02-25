// const express = require("express");
// const bcrypt = require("bcrypt");
// const db = require("../models/db");
// const checkAuth = require("../middleware/authMiddleware");

// const router = express.Router();

// //get current user data (for filling account data) - GET
// router.get("/me", checkAuth, (req, res) => {
//     const userId = req.userId;

//     db.get("SELECT username FROM users WHERE id = ?", [userId], (err, row) => {
//         if (err) return res.status(500).json({ message: "Error fetching user data" });
//         if (!row) return res.status(404).json({ message: "User not found" });
//         res.json({ username: row.username });
//     });
// });

// //Sign-Up Endpoint (Register a new user) - POST
// router.post("/signup", async (req, res) => {
//     const { username, password } = req.body;

//     if (!username || !password) {
//         return res.status(400).json({ success: false, message: "Username and password required" });
//     }

//     try {
//         // Hash the password before storing
//         const hashedPassword = await bcrypt.hash(password, 10);
//         db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], (err) => {
//             if (err) {
//                 return res.status(400).json({ success: false, message: "Username already exists" });
//             }
//             res.json({ success: true, message: "User registered successfully!" });
//         });
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// });

// //Login Endpoint (Authenticate User) - POST and GET
// router.post("/login", (req, res) => {
//     const { username, password } = req.body;
//     db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
//         if (err || !user) {
//             return res.status(401).json({ success: false, message: "Invalid username or password" });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (isMatch) {
//             // Generate a JWT token
//             const token = jwt.sign({ id: user.id, username: user.username }, 'your_secret_key', { expiresIn: '1h' });

//             res.json({ success: true, message: "Login successful", token: token });
//         } else {
//             res.status(401).json({ success: false, message: "Invalid username or password" });
//         }
//     });
// });

// //GET current user data
// router.get("/users/me", checkAuth, (req, res) => {
//     const userId = req.userId; // The userId is set by the checkAuth middleware

//     db.get("SELECT username FROM users WHERE id = ?", [userId], (err, row) => {
//         if (err) {
//             return res.status(500).json({ message: "Error fetching user data" });
//         }
//         if (!row) {
//             return res.status(404).json({ message: "User not found" });
//         }
//         res.json({ username: row.username }); // Respond with the username
//     });
// });


// //PUT update password - PUT
// router.put("/users/:id", checkAuth, async (req, res) => {
//     const { id } = req.params;
//     const { password } = req.body; // New password

//     if (!password) {
//         return res.status(400).json({ success: false, message: "Password is required" });
//     }

//     try {
//         // Hash the new password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Update the password in the database
//         db.run(
//             "UPDATE users SET password = ? WHERE id = ?",
//             [hashedPassword, id],
//             function (err) {
//                 if (err) {
//                     return res.status(500).json({ success: false, message: err.message });
//                 }
//                 if (this.changes === 0) {
//                     return res.status(404).json({ success: false, message: "User not found" });
//                 }
//                 res.json({ success: true, message: "Password updated successfully" });
//             }
//         );
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// });

// //DELETE account - DELETE
// router.delete("/users/:id", checkAuth, (req, res) => {
//     const { id } = req.params;

//     db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
//         if (err) {
//             return res.status(500).json({ success: false, message: err.message });
//         }
//         if (this.changes === 0) {
//             return res.status(404).json({ success: false, message: "User not found" });
//         }
//         res.json({ success: true, message: "Account deleted successfully" });
//     });
// });