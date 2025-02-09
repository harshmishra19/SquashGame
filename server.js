const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public")); // Serve frontend files

let players = {};
let ball = { x: 400, y: 250, vx: 5, vy: 5 };
let scores = { p1: 0, p2: 0 };
let gameStarted = false;

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    if (Object.keys(players).length < 2) {
        players[socket.id] = { y: 200, number: Object.keys(players).length + 1 };
        socket.emit("playerNumber", players[socket.id].number);
    } else {
        socket.emit("gameFull");
        return;
    }

    socket.on("movePaddle", (y) => {
        if (players[socket.id]) {
            players[socket.id].y = y;
            io.emit("updatePaddles", players);
        }
    });

    socket.on("startGame", () => {
        if (!gameStarted) {
            gameStarted = true;
            resetBall();
        }
    });

    socket.on("resetGame", () => {
        scores = { p1: 0, p2: 0 };
        gameStarted = false;
        resetBall();
        io.emit("updateGame", { paddles: players, ball, scores });
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        console.log("Player disconnected:", socket.id);
    });
});

function resetBall() {
    ball = { x: 400, y: 250, vx: 5, vy: 5 };
}

setInterval(() => {
    if (!gameStarted) return;

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y <= 0 || ball.y >= 500) ball.vy *= -1; // Bounce off top and bottom

    let player1 = Object.values(players)[0];

    if (player1 && ball.x <= 20 && ball.y >= player1.y && ball.y <= player1.y + 100) {
        ball.vx *= -1; // Ball bounces from paddle
    }

    if (ball.x > 800) {
        scores.p1++; // Score if ball goes past right wall
        resetBall();
    }

    io.emit("updateGame", { paddles: players, ball, scores });
}, 1000 / 60);

server.listen(3000, () => console.log("✅ Server running on port 3000"));
