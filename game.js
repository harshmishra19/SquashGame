const cvs = document.getElementById("squashGame");
const ctx = cvs.getContext("2d");

// Function to draw rectangles (paddles, background)
function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

// Winning Score
const WINNING_SCORE = 10;
let showingWinScreen = false;
let turn = 1; // 1 = Player 1's turn, 2 = Player 2's turn

// Player 1 (Controlled by Arrow Keys)
const player1 = {
    x: 30, // Left Side Paddle
    y: cvs.height / 2 - 50,
    width: 10,
    height: 100,
    color: "WHITE",
    score: 0
};

// Player 2 (Controlled by 'A' and 'D' Keys)
const player2 = {
    x: 60, // Player 2 is slightly right of Player 1
    y: cvs.height / 2 - 50,
    width: 10,
    height: 100,
    color: "WHITE",
    score: 0
};

// Ball
const ball = {
    x: cvs.width / 2,
    y: cvs.height / 2,
    radius: 10,
    speed: 5,
    velocityX: 5,
    velocityY: 5,
    color: "WHITE"
};

// Function to Reset the Ball
function resetBall() {
    if (player1.score >= WINNING_SCORE || player2.score >= WINNING_SCORE) {
        showingWinScreen = true;
    }
    ball.x = cvs.width / 2;
    ball.y = cvs.height / 2;
    ball.velocityX = 5;
    ball.velocityY = 5;
    turn = 1; // Reset turn to Player 1
}

// Function to Detect Collision Between Ball and Paddle
function collision(b, p) {
    return (
        b.x - b.radius < p.x + p.width &&
        b.x + b.radius > p.x &&
        b.y - b.radius < p.y + p.height &&
        b.y + b.radius > p.y
    );
}

// Update the Game (Ball Movement & Scoring)
function update() {
    if (showingWinScreen) return;

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Bounce Ball off the Top and Bottom Walls
    if (ball.y < 0 || ball.y > cvs.height) {
        ball.velocityY = -ball.velocityY;
    }

    // Player 1 Paddle Collision (Only during Player 1's turn)
    if (turn === 1 && collision(ball, player1)) {
        ball.velocityX = -ball.velocityX;
        turn = 2; // Switch turn to Player 2
    }

    // Player 2 Paddle Collision (Only during Player 2's turn)
    if (turn === 2 && collision(ball, player2)) {
        ball.velocityX = -ball.velocityX;
        turn = 1; // Switch turn to Player 1
    }

    // Ball hits the right wall → Switch turn without scoring
    if (ball.x >= cvs.width - ball.radius) {
        ball.velocityX = -ball.velocityX;
    }

    // If the player whose turn it is **misses the ball**, opponent gets a point
    if (ball.x < 0) {
        if (turn === 1) {
            player2.score++; // Player 2 scores if Player 1 misses
        } else {
            player1.score++; // Player 1 scores if Player 2 misses
        }
        resetBall();
    }
}

// Render the Game on the Canvas
function render() {
    drawRect(0, 0, cvs.width, cvs.height, "black"); // Background
    drawRect(player1.x, player1.y, player1.width, player1.height, player1.color); // Player 1 Paddle
    drawRect(player2.x, player2.y, player2.width, player2.height, player2.color); // Player 2 Paddle

    // Draw Ball
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw Scores
    ctx.fillStyle = "WHITE";
    ctx.font = "20px Arial";
    ctx.fillText(`Player 1: ${player1.score}`, 150, 30);
    ctx.fillText(`Player 2: ${player2.score}`, 500, 30);

    // Show Turn Indicator
    ctx.fillText(`Turn: Player ${turn}`, 350, 30);

    // Display Win Screen
    if (showingWinScreen) {
        ctx.fillStyle = "RED";
        ctx.font = "40px Arial";
        if (player1.score >= WINNING_SCORE) {
            ctx.fillText("Player 1 Wins!", cvs.width / 4, cvs.height / 2);
        } else if (player2.score >= WINNING_SCORE) {
            ctx.fillText("Player 2 Wins!", cvs.width / 4, cvs.height / 2);
        }
        ctx.fillText("Click to Restart", cvs.width / 4, cvs.height / 1.5);
    }
}

// Handle Paddle Movement for Both Players
document.addEventListener("keydown", (event) => {
    switch (event.key) {
        // Player 1 (Arrow Keys)
        case "ArrowUp":
            if (player1.y > 0) player1.y -= 20;
            break;
        case "ArrowDown":
            if (player1.y < cvs.height - player1.height) player1.y += 20;
            break;

        // Player 2 (A & D Keys)
        case "a":
        case "A":
            if (player2.y > 0) player2.y -= 20;
            break;
        case "d":
        case "D":
            if (player2.y < cvs.height - player2.height) player2.y += 20;
            break;
    }
});

// Restart Game When Clicking After Win
cvs.addEventListener("click", () => {
    if (showingWinScreen) {
        player1.score = 0;
        player2.score = 0;
        showingWinScreen = false;
    }
});

// Game Loop
function game() {
    update();
    render();
}
const framePerSecond = 50;
setInterval(game, 1000 / framePerSecond);
