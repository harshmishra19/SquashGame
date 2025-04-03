const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));

let players = { left: null, right: null };
let ball = { x: 400, y: 250, radius: 10, velocityX: 0, velocityY: 0 };
let turn = "left"; // Start with left player serving
let gameStarted = false;
let gameActive = false;

// Handle player connection
io.on("connection", (socket) => {
    console.log("A player connected:", socket.id);

    if (!players.left) {
        players.left = { id: socket.id, x: 50, y: 200, score: 0 };
        socket.emit("playerType", "left");
    } else if (!players.right) {
        players.right = { id: socket.id, x: 100, y: 200, score: 0 };
        socket.emit("playerType", "right");
    } else {
        socket.emit("playerType", "spectator");
        return;
    }

    // Broadcast game state
    io.emit("gameState", { 
        left: players.left, 
        right: players.right, 
        ball, 
        turn,
        gameActive,
        gameStarted
    });

    // Handle paddle movement
    socket.on("movePaddle", (data) => {
        if (!gameStarted) return;

        let player = players[data.player];
        if (!player) return;

        if (data.direction === "ArrowUp" && player.y > 0) player.y -= 20;
        if (data.direction === "ArrowDown" && player.y < 400) player.y += 20;
        if (data.direction === "w" && player.y > 0) player.y -= 20;
        if (data.direction === "s" && player.y < 400) player.y += 20;

        io.emit("gameState", { 
            left: players.left, 
            right: players.right, 
            ball, 
            turn,
            gameActive,
            gameStarted
        });
    });

    // Handle game start
    socket.on("startGame", () => {
        if (players.left && players.right) {
            gameStarted = true;
            gameActive = true;
            serveBall();
            io.emit("gameState", { 
                left: players.left, 
                right: players.right, 
                ball, 
                turn,
                gameActive,
                gameStarted
            });
        }
    });

    // Handle serve request
    socket.on("serveBall", () => {
        if (gameStarted) {
            gameActive = true;
            serveBall();
            io.emit("gameState", { 
                left: players.left, 
                right: players.right, 
                ball, 
                turn,
                gameActive,
                gameStarted
            });
        }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("A player disconnected:", socket.id);

        if (players.left?.id === socket.id) players.left = null;
        if (players.right?.id === socket.id) players.right = null;

        gameStarted = false;
        gameActive = false;
        io.emit("gameState", { 
            left: players.left, 
            right: players.right, 
            ball, 
            turn,
            gameActive,
            gameStarted
        });
    });
});

// Move ball periodically
setInterval(() => {
    if (!gameActive) return;

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Bounce off top & bottom walls
    if (ball.y < 0 || ball.y > 490) {
        ball.velocityY = -ball.velocityY;
    }

    // Bounce off right wall (front wall)
    if (ball.x > 790) {
        ball.velocityX = -ball.velocityX;
    }

    // Paddle collisions
    if (ball.x < 110) {
        // Left paddle collision
        if (ball.x < 60 && ball.y >= players.left.y && ball.y <= players.left.y + 100) {
            if (turn === "left") {
                ball.velocityX = Math.abs(ball.velocityX); // Ensure ball goes right
                ball.velocityY += (Math.random() * 2 - 1);
                turn = "right"; // Switch turn to right player
            }
        }
        // Right paddle collision
        else if (ball.x < 110 && ball.y >= players.right.y && ball.y <= players.right.y + 100) {
            if (turn === "right") {
                ball.velocityX = Math.abs(ball.velocityX); // Ensure ball goes right
                ball.velocityY += (Math.random() * 2 - 1);
                turn = "left"; // Switch turn to left player
            }
        }
    }

    // Scoring (ball goes out on the left side)
    if (ball.x < 0) {
        gameActive = false;
        if (turn === "left") {
            players.right.score++;
            turn = "right"; // Right player serves next
        } else {
            players.left.score++;
            turn = "left"; // Left player serves next
        }
        
        resetBall();
    }

    io.emit("gameState", { 
        left: players.left, 
        right: players.right, 
        ball, 
        turn,
        gameActive,
        gameStarted
    });
}, 1000 / 60);

// Serve the ball
function serveBall() {
    ball.x = 50;
    ball.y = 250;
    ball.velocityX = 5;
    ball.velocityY = (Math.random() * 4) - 2;
    if (turn === "right") {
        ball.x = 100; // Serve from right paddle position
    }
}

// Reset ball position
function resetBall() {
    ball.x = turn === "left" ? 50 : 100;
    ball.y = 250;
    ball.velocityX = 0;
    ball.velocityY = 0;
}

server.listen(3000, () => console.log("Server running on http://localhost:3000"));