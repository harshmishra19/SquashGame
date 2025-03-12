const canvas = document.getElementById("squashGame");
const ctx = canvas.getContext("2d");
const socket = io();

let player = null;
let opponent = null;
let ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 10, velocityX: 0, velocityY: 0 };
let gameStarted = false;

const paddles = {
    red: { x: 50, y: canvas.height / 2 - 50, width: 10, height: 100, color: "red" },
    blue: { x: canvas.width - 60, y: canvas.height / 2 - 50, width: 10, height: 100, color: "blue" }
};

document.getElementById("startGame").addEventListener("click", () => {
    socket.emit("playerReady");
});

// Receive player assignment
socket.on("assignPlayer", (data) => {
    player = data;
    opponent = player === "red" ? "blue" : "red";
});

// Start game when both players are ready
socket.on("startGame", () => {
    gameStarted = true;
    ball.velocityX = 4;
    ball.velocityY = 3;
});

// Update game state
socket.on("gameState", (gameState) => {
    paddles.red.y = gameState.red.y;
    paddles.blue.y = gameState.blue.y;
    ball = gameState.ball;
});

// Move paddles
document.addEventListener("keydown", (event) => {
    if (!gameStarted || !player) return;

    if (player === "red" && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        socket.emit("movePaddle", { direction: event.key });
    }
    if (player === "blue" && (event.key === "w" || event.key === "s")) {
        socket.emit("movePaddle", { direction: event.key });
    }
});

// Draw elements
function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

// Render game
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRect(paddles.red.x, paddles.red.y, paddles.red.width, paddles.red.height, paddles.red.color);
    drawRect(paddles.blue.x, paddles.blue.y, paddles.blue.width, paddles.blue.height, paddles.blue.color);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
}

function gameLoop() {
    render();
    requestAnimationFrame(gameLoop);
}
gameLoop();
