const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));

let players = {};
let ball = { x: 400, y: 250, radius: 10, velocityX: 0, velocityY: 0 };
let gameStarted = false;

io.on("connection", (socket) => {
    console.log("A player connected:", socket.id);

    if (!players.red) {
        players.red = { id: socket.id, y: 200 };
        socket.emit("assignPlayer", "red");
    } else if (!players.blue) {
        players.blue = { id: socket.id, y: 200 };
        socket.emit("assignPlayer", "blue");
    } else {
        socket.disconnect();
    }

    socket.on("playerReady", () => {
        if (players.red && players.blue) {
            io.emit("startGame");
            gameStarted = true;
            ball.velocityX = 4;
            ball.velocityY = 3;
        }
    });

    socket.on("movePaddle", (data) => {
        let player = Object.values(players).find(p => p.id === socket.id);
        if (player) {
            if (data.direction === "ArrowUp" && player.y > 0) player.y -= 20;
            if (data.direction === "ArrowDown" && player.y < 400) player.y += 20;
            if (data.direction === "w" && player.y > 0) player.y -= 20;
            if (data.direction === "s" && player.y < 400) player.y += 20;
        }
        io.emit("gameState", { red: players.red, blue: players.blue, ball });
    });

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        if (players.red?.id === socket.id) delete players.red;
        if (players.blue?.id === socket.id) delete players.blue;
        gameStarted = false;
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
