// Game state
let gameState = {
    currentPlayer: 1,
    board: Array(9).fill(null),
    playerCategories: { 1: null, 2: null },
    playerEmojis: { 1: [], 2: [] },
    playerHistory: { 1: [], 2: [] }, // Track placement order for FIFO
    gamePhase: 'category-selection', // 'category-selection', 'playing', 'ended'
    winner: null
};

// Emoji categories
const emojiCategories = {
    animals: ['🐶', '🐱', '🐵', '🐰', '🦊', '🐻', '🐼', '🐨'],
    food: ['🍕', '🍟', '🍔', '🍩', '🍰', '🍪', '🧁', '🍎'],
    sports: ['⚽️', '🏀', '🏈', '🎾', '🏐', '🏓', '🥎', '🏸'],
    nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🌿', '🍀']
};

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    initializeCategorySelection();
    updateDisplay();
});

function initializeCategorySelection() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const startButton = document.getElementById('startGame');

    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const player = this.closest('.category-options').dataset.player;
            const category = this.dataset.category;
            selectCategory(parseInt(player), category);
        });
    });

    startButton.addEventListener('click', startGame);
}

function selectCategory(player, category) {
    // Check if the other player has already selected this category
    const otherPlayer = player === 1 ? 2 : 1;
    if (gameState.playerCategories[otherPlayer] === category) {
        alert('This category is already taken by the other player!');
        return;
    }

    gameState.playerCategories[player] = category;
    
    // Update UI
    updateCategorySelection();
    checkStartButton();
}

function updateCategorySelection() {
    for (let player = 1; player <= 2; player++) {
        const playerOptions = document.querySelector(`[data-player="${player}"]`);
        const selectedDiv = document.getElementById(`player${player}Selected`);
        const buttons = playerOptions.querySelectorAll('.category-btn');

        // Reset all buttons
        buttons.forEach(btn => {
            btn.classList.remove('selected', 'disabled');
        });

        // Mark selected category
        if (gameState.playerCategories[player]) {
            const selectedBtn = playerOptions.querySelector(`[data-category="${gameState.playerCategories[player]}"]`);
            selectedBtn.classList.add('selected');
            selectedDiv.textContent = `Selected: ${gameState.playerCategories[player]}`;
        } else {
            selectedDiv.textContent = '';
        }

        // Disable categories selected by other players
        for (let otherPlayer = 1; otherPlayer <= 2; otherPlayer++) {
            if (otherPlayer !== player && gameState.playerCategories[otherPlayer]) {
                const disabledBtn = playerOptions.querySelector(`[data-category="${gameState.playerCategories[otherPlayer]}"]`);
                disabledBtn.classList.add('disabled');
            }
        }
    }
}

function checkStartButton() {
    const startButton = document.getElementById('startGame');
    const canStart = gameState.playerCategories[1] && gameState.playerCategories[2];
    startButton.disabled = !canStart;
}

function startGame() {
    gameState.gamePhase = 'playing';
    gameState.currentPlayer = 1;
    
    // Initialize game board
    initializeGameBoard();
    updateDisplay();
    generateNextEmoji();
}

function initializeGameBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        cell.textContent = '';
        cell.classList.remove('winning', 'vanishing');
        cell.addEventListener('click', () => makeMove(index));
    });
}

function generateNextEmoji() {
    const category = gameState.playerCategories[gameState.currentPlayer];
    const emojis = emojiCategories[category];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    document.getElementById('nextEmoji').textContent = randomEmoji;
    return randomEmoji;
}

function makeMove(cellIndex) {
    if (gameState.gamePhase !== 'playing' || gameState.board[cellIndex] !== null) {
        return;
    }

    const player = gameState.currentPlayer;
    const emoji = document.getElementById('nextEmoji').textContent;
    
    // Check if this is the 4th emoji and if it's being placed where the 1st emoji was
    if (gameState.playerHistory[player].length === 3) {
        const firstEmojiPosition = gameState.playerHistory[player][0].position;
        if (cellIndex === firstEmojiPosition) {
            alert("You cannot place your 4th emoji where your 1st emoji was!");
            return;
        }
    }

    // Handle vanishing rule
    if (gameState.playerHistory[player].length === 3) {
        // Remove the oldest emoji (FIFO)
        const oldestEmoji = gameState.playerHistory[player].shift();
        const oldCell = document.querySelector(`[data-index="${oldestEmoji.position}"]`);
        
        // Add vanishing animation
        oldCell.classList.add('vanishing');
        setTimeout(() => {
            oldCell.textContent = '';
            oldCell.classList.remove('vanishing');
            gameState.board[oldestEmoji.position] = null;
        }, 500);
        
        // Remove from player emojis array
        const emojiIndex = gameState.playerEmojis[player].findIndex(e => e.position === oldestEmoji.position);
        if (emojiIndex !== -1) {
            gameState.playerEmojis[player].splice(emojiIndex, 1);
        }
    }

    // Place new emoji
    gameState.board[cellIndex] = { player, emoji };
    gameState.playerEmojis[player].push({ emoji, position: cellIndex });
    gameState.playerHistory[player].push({ emoji, position: cellIndex });
    
    // Update cell
    const cell = document.querySelector(`[data-index="${cellIndex}"]`);
    cell.textContent = emoji;

    // Check for winner
    const winner = checkWinner();
    if (winner) {
        gameState.winner = winner;
        gameState.gamePhase = 'ended';
        setTimeout(() => showWinScreen(winner), 500);
        return;
    }

    // Switch players
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    generateNextEmoji();
    updateDisplay();
}

function checkWinner() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        const cellA = gameState.board[a];
        const cellB = gameState.board[b];
        const cellC = gameState.board[c];

        if (cellA && cellB && cellC && 
            cellA.player === cellB.player && 
            cellB.player === cellC.player) {
            
            // Highlight winning cells
            pattern.forEach(index => {
                document.querySelector(`[data-index="${index}"]`).classList.add('winning');
            });
            
            return {
                player: cellA.player,
                pattern: pattern,
                emojis: [cellA.emoji, cellB.emoji, cellC.emoji]
            };
        }
    }
    return null;
}

function showWinScreen(winner) {
    document.getElementById('winnerText').textContent = `🎉 Player ${winner.player} Wins!`;
    document.getElementById('winningLine').textContent = winner.emojis.join(' ');
    updateDisplay();
}

function updateDisplay() {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });

    // Show appropriate screen
    switch (gameState.gamePhase) {
        case 'category-selection':
            document.getElementById('categorySelection').classList.remove('hidden');
            break;
        case 'playing':
            document.getElementById('gameScreen').classList.remove('hidden');
            updateGameInfo();
            break;
        case 'ended':
            document.getElementById('winScreen').classList.remove('hidden');
            break;
    }
}

function updateGameInfo() {
    // Update current player
    document.getElementById('currentPlayer').textContent = `Player ${gameState.currentPlayer}`;
    
    // Update player emoji displays
    for (let player = 1; player <= 2; player++) {
        const emojiDisplay = document.getElementById(`player${player}Emojis`);
        const countDisplay = document.getElementById(`player${player}Count`);
        
        const emojis = gameState.playerEmojis[player].map(e => e.emoji).join(' ');
        emojiDisplay.textContent = emojis;
        countDisplay.textContent = `${gameState.playerEmojis[player].length}/3`;
    }
}

function resetGame() {
    // Reset game state
    gameState = {
        currentPlayer: 1,
        board: Array(9).fill(null),
        playerCategories: { 1: null, 2: null },
        playerEmojis: { 1: [], 2: [] },
        playerHistory: { 1: [], 2: [] },
        gamePhase: 'category-selection',
        winner: null
    };

    // Reset UI
    document.querySelectorAll('.cell').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('winning', 'vanishing');
    });

    // Reset category selection
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('selected', 'disabled');
    });

    document.querySelectorAll('.selected-category').forEach(div => {
        div.textContent = '';
    });

    document.getElementById('startGame').disabled = true;
    document.getElementById('nextEmoji').textContent = '';

    updateDisplay();
}

function toggleHelp() {
    const modal = document.getElementById('helpModal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('helpModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}