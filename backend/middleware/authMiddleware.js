// const jwt = require("jsonwebtoken");

// function checkAuth(req, res, next) {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) {
//         return res.status(401).json({ message: "Authentication required" });
//     }

//     try {
//         const decoded = jwt.verify(token, "your_secret_key");
//         req.userId = decoded.id; //store the user ID in the request
//         next();
//     } catch (error) {
//         return res.status(401).json({ message: "Invalid or expired token" });
//     }
// }

// module.exports = checkAuth;