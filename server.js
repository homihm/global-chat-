const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

const db = new sqlite3.Database("./chat.db");

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        message TEXT,
        color TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

let users = {};
let colors = {};

function randomColor() {
    return "#" + Math.floor(Math.random()*16777215).toString(16);
}

io.on("connection", (socket) => {

    socket.on("join", (username) => {
        users[socket.id] = username;
        colors[socket.id] = randomColor();

        io.emit("users", users);

        // envoyer anciens messages
        db.all("SELECT * FROM messages ORDER BY id ASC", (err, rows) => {
            socket.emit("load messages", rows);
        });
    });

    socket.on("chat message", (msg) => {

        if (!users[socket.id]) return;

        db.run(
            "INSERT INTO messages (username, message, color) VALUES (?, ?, ?)",
            [users[socket.id], msg, colors[socket.id]]
        );

        io.emit("chat message", {
            id: socket.id,
            user: users[socket.id],
            color: colors[socket.id],
            message: msg
        });
    });

    socket.on("private message", ({ to, message }) => {
        io.to(to).emit("private message", {
            from: users[socket.id],
            message
        });
    });

    socket.on("disconnect", () => {
        delete users[socket.id];
        delete colors[socket.id];
        io.emit("users", users);
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});