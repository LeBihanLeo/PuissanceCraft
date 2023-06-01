document.addEventListener('DOMContentLoaded', init, false);
document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    console.log(navigator.vibrate);
}
const blockSound = new Audio('../resources/sounds/block-sound.mp3');

// Cell values should be "0" if no one placed a pawn in the cell, 1 if the first player owns the cell, 2 if it's the second player
const playerRed = "1"; // Red player is represented as 1
const playerYellow = "2";
const emptyTile = "0";
let playerRedScore = 0;
let playerYellowScore = 0;

let currentPlayer = playerYellow;
let isGameOver = false;
let winner;

let board;
let currentColumns; // Indicate the nb of avalaible tile on a column

const rows = 6;
const columns = 7;

let playerName;
let gameDuration = 0;
let clockDurationInterval;
let timeLeft;
let clockTimerInterval;
const maxTimeToPlay = 60; //Time player has each turn to set his piece

function init(){
    loadButtonSounds()
    setGame();
    initScore();
    clockDurationInterval = setInterval(clockDuration, 1000);
    changePlayer();
}

/**
 * Initialize the game board with empty tiles
 */
function setGame() {
    isGameOver = false;
    board = [];
    currentColumns = [5, 5, 5, 5, 5, 5, 5];

    for (let r = 0; r < rows; r++){
        let row = [];
        document.getElementById("board").append()
        for (let c = 0; c < columns; c++){
            // JS logic
            row.push(emptyTile);

            // HTML logic
            let tile = document.createElement("div");
            tile.id = r.toString() + '-' + c.toString();
            tile.classList.add("tile");
            tile.classList.add("column-" + c.toString());
            tile.addEventListener("click", setPiece);

            document.getElementById("board").append(tile)

        }
        board.push(row);
    }

    // Pour chaque colonne
    for (let i = 0; i < columns; i++) {
        // On récupere chaque tile qui a appartient a la colonne
        let columns = document.querySelectorAll(".column-" + i);

        // On applique sur chaque tile de la colonne un EventListener sur mouseover
        columns.forEach(function(col) {

            col.addEventListener('mouseover', function() {
                // On applique le changement de couleur pour bien voir quelle colonne est selectionnée
                columns.forEach(function(e) {
                    e.style.backgroundColor = "rgba(255,255,255,0.3)";
                });
            });

            // On applique le changement de couleur pour vbien voir quelle colonne est selectionnée
            col.addEventListener("mouseout", function() {
                // On annule le changement de couleur du background quand la souris n'est plus sur
                // une des tuiles de la colonne
                columns.forEach(function(e) {
                    e.style.backgroundColor = "inherit";
                });
            });
        });

    }

}

function clockDuration() {
    let minutes = parseInt(gameDuration / 60, 10);
    let seconds = parseInt(gameDuration % 60, 10);
    document.getElementById("duration")
        .innerText = (minutes < 10 ? '0' + minutes : minutes) + " : " + (seconds < 10 ? '0' + seconds : seconds);

    gameDuration++;
}

function startTimer() {
    timeLeft = maxTimeToPlay;
    clockTimerInterval = setInterval(clockTimer, 1000);
}

function clockTimer() {
    let timer = document.getElementById("timer")
    timer.innerText = timeLeft + "s remaining!";

    if (timeLeft === 0) {
        changePlayer();
    } else if (timeLeft <= 10) {
        timer.style.color = "#AA0000";
    } else {
        timer.style.color = "white";
    }

    timeLeft--;
}

function boardIsFull() {
    for(let i = 0; i < currentColumns.length; i++) {
        if (currentColumns[i] >= 0) {
            return false;
        }
    }
    return true;
}

/**
 * Function called after clicking a tile
 */
function setPiece() {
    if (isGameOver) {
        return;
    }

    let coords = this.id.split("-"); //"0-0" -> ["0", "0"]
    let c = parseInt(coords[1]);

    let r = currentColumns[c];
    if (r < 0) {
        return;
    }

    board[r][c] = currentPlayer;
    let tile = document.getElementById(r.toString() + "-" + c.toString());

    colorize(tile);
    animateFall(tile,c);
    blockSound.play();

    if(!checkWinner()) {
        currentColumns[c] = r-1;
        changePlayer();
    } else {
        setEndScreen(winner);
    }

    if(boardIsFull()) {
        setEndScreen("Nobody");
    }
}

function changePlayer() {
    playerName = document.getElementById("player-name");
    if (currentPlayer === playerRed) {
        currentPlayer = playerYellow;
        playerName.innerText = "Player yellow";
        playerName.style.color = "yellow";
    } else {
        currentPlayer = playerRed;
        playerName.innerText = "Player red";
        playerName.style.color = "red";
    }
    clearInterval(clockTimerInterval);
    startTimer();
}

function checkWinner() {
    //horizontally
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 3; c++) {
            if (board[r][c] !== emptyTile) {
                if (board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2] && board[r][c] === board[r][c+3]) {
                    winner = board[r][c];
                    return true;
                }
            }
        }
    }

    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 3; r++) {
            if (board[r][c] !== emptyTile) {
                if (board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c] && board[r][c] === board[r+3][c]) {
                    winner = board[r][c];
                    return true;
                }
            }
        }
    }

    for (let r = 0; r < rows - 3; r++) {
        for (let c = 0; c < columns - 3; c++) {
            if (board[r][c] !== emptyTile) {
                if (board[r][c] === board[r+1][c+1] && board[r][c] === board[r+2][c+2] && board[r][c] === board[r+3][c+3]) {
                    winner = board[r][c];
                    return true;
                }
            }
        }
    }

    for (let r = 3; r < rows; r++) {
        for (let c = 0; c < columns - 3; c++) {
            if (board[r][c] !== emptyTile) {
                if (board[r][c] === board[r-1][c+1] && board[r][c] === board[r-2][c+2] && board[r][c] === board[r-3][c+3]) {
                    winner = board[r][c];
                    return true;
                }
            }
        }
    }

    return false;
}

function colorize(tile){
    if (currentPlayer === playerRed) {
        tile.classList.add("red-piece");
    } else {
        tile.classList.add("yellow-piece");
    }
}

function animateFall(tile,c) {
    tile.animate([
        // keyframes
        { transform: 'translateY(-' + currentColumns[c] * tile.offsetHeight + 'px)' },
        { transform: 'translateY(0px)' }
    ], {
        // timing options
        duration: 200 * currentColumns[c],
        iterations: 1
        ///transitionTimingFunction : "cubic-bezier(1, 0.01, 1, 1.01)"
    })
}

function setEndScreen(winner) {
    navigator.vibrate(1000)
    isGameOver = true;
    clearInterval(clockTimerInterval);
    clearInterval(clockDurationInterval);

    const winnerName = document.getElementById("winner-name");
    let winnerText, winnerColor;

    if(winner == "Nobody") {
        winnerText = winner;
        winnerColor = "white";
    } else {
        winnerText = playerRed == winner ? "Player Red" : "Player Yellow";
        winnerColor = playerRed == winner ? "red" : "yellow";
        winnerText == "Player Red" ? playerRedScore++ : playerYellowScore++;
    }

    winnerName.innerText = winnerText;
    winnerName.style.color = winnerColor;

    let endInfo = document.querySelector("article");
    endInfo.style.display = "flex";
    endInfo.style.flexDirection = "column";
    endInfo.classList.remove("hidden");

    document.getElementById("rematchButton").addEventListener("click", function () {
        localStorage.setItem('score-local', playerRedScore+":"+playerYellowScore);
        window.location.reload(true);
    })
}

function initScore() {
    let score = localStorage.getItem('score-local');
    if (score != undefined) {
        playerRedScore = score.split(':')[0];
        playerYellowScore = score.split(':')[1];
        document.getElementById("score").innerText = playerRedScore + " - " + playerYellowScore;
    }
}

function resetScore(){
    localStorage.removeItem('score-local');
}