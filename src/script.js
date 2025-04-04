const socket = io("http://localhost:3000");
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const gameContainer = document.getElementById("gameContainer");
const winnerBanner = document.getElementById("winnerBanner");

let board = Array(9).fill(null);
let currentPlayer = "X";
let playerSymbol = null;
let gameActive = false;
let roomId = prompt("Enter room ID to join:");

socket.emit("joinGame", roomId);

socket.on("roomFull", () => {
  alert("This room is already full. Please join another room.");
  location.reload();
});

socket.on("playerAssignment", (symbol) => {
  playerSymbol = symbol;
  statusElement.textContent = `You are Player ${symbol}. Waiting for opponent...`;
});

socket.on("gameStart", () => {
  gameActive = true;
  currentPlayer = "X";
  statusElement.textContent = `Game started! Player X goes first.`;
  renderBoard();
});

socket.on("moveMade", ({ index, player }) => {
  board[index] = player;
  currentPlayer = player === "X" ? "O" : "X";
  renderBoard();
  if (checkWin(player)) {
    showWinner(player);
    gameActive = false;
  } else if (board.every((cell) => cell)) {
    showDraw();
    gameActive = false;
  } else {
    statusElement.textContent = `Player ${currentPlayer}'s turn`;
  }
});

socket.on("restart", () => {
  board = Array(9).fill(null);
  currentPlayer = "X";
  gameActive = true;
  gameContainer.classList.remove("blurred");
  winnerBanner.style.display = "none";
  statusElement.textContent = `Player ${playerSymbol}'s turn`;
  renderBoard();
});

function renderBoard() {
  boardElement.innerHTML = "";
  board.forEach((cell, index) => {
    const cellDiv = document.createElement("div");
    cellDiv.classList.add("cell");
    if (cell) {
      cellDiv.classList.add(cell.toLowerCase());
      cellDiv.textContent = cell;
    }
    if (!cell && currentPlayer === playerSymbol && gameActive) {
      cellDiv.addEventListener("click", () => handleCellClick(index));
    }
    boardElement.appendChild(cellDiv);
  });
}

function handleCellClick(index) {
  if (!gameActive || board[index] || currentPlayer !== playerSymbol) return;
  board[index] = playerSymbol;
  renderBoard();
  socket.emit("makeMove", { roomId, index, player: playerSymbol });
  if (checkWin(playerSymbol)) {
    showWinner(playerSymbol);
    gameActive = false;
  } else if (board.every((cell) => cell)) {
    showDraw();
    gameActive = false;
  }
  currentPlayer = playerSymbol === "X" ? "O" : "X";
  statusElement.textContent = `Player ${currentPlayer}'s turn`;
}

function checkWin(player) {
  const win = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  return win.some((combo) => combo.every((i) => board[i] === player));
}

function showWinner(player) {
  statusElement.textContent =
    player === playerSymbol ? `🎉 You win!` : `😢 You lose!`;
  gameContainer.classList.add("blurred");
  confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  setTimeout(() => {
    winnerBanner.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 2.5rem; color: ${
          player === playerSymbol ? "green" : "red"
        }; margin-bottom: 20px;">
          ${
            player === playerSymbol
              ? "🎉 You Win! 🎉"
              : "💻 Opponent Wins! 💻"
          }
        </div>
        <button onclick="restartGame()" style="
          padding: 12px 25px; font-size: 1.1rem; background-color: #333;
          color: white; border: none; border-radius: 8px; cursor: pointer;">
          🔁 Play Again</button>
      </div>`;
    winnerBanner.style.display = "block";
  }, 300);
}

function showDraw() {
  statusElement.textContent = `🤝 It's a draw!`;
  gameContainer.classList.add("blurred");
  confetti({ particleCount: 80, spread: 50, origin: { y: 0.6 } });
  setTimeout(() => {
    winnerBanner.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 2.5rem; color: blue; margin-bottom: 20px;">
          🤝 It's a Draw! 🤝
        </div>
        <button onclick="restartGame()" style="
          padding: 12px 25px; font-size: 1.1rem; background-color: #333;
          color: white; border: none; border-radius: 8px; cursor: pointer;">
          🔁 Restart Again</button>
      </div>`;
    winnerBanner.style.display = "block";
  }, 300);
}

function restartGame() {
  socket.emit("restartGame", roomId); // Notify the server to broadcast restart
}
