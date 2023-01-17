document.addEventListener('DOMContentLoaded', init, false);

const playerRed = "R";
const playerYellow = "Y";
let currentPlayer = playerRed;
let winner;

let isGameOver = false;
let board;
let currentColumns; // Indicate the nb of avalaible tile on a column

const rows = 6;
const columns = 7;

function init(){
    console.log("---page loaded---");
    setGame();
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

        for (let c = 0; c < columns; c++){
            // JS logic
            row.push(' '); // An empty tile is represented as a ' '

            // HTML logic
            let tile = document.createElement("div");
            tile.id = r.toString() + '-' + c.toString();
            tile.classList.add("tile");
            tile.addEventListener("click", setPiece);

            document.getElementById("board").append(tile)
        }
        board.push(row);
    }
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

    color(tile);

    currentColumns[c] = r-1;

    checkWinner();
}

function checkWinner() {
    //horizontally
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 3; c++) {
            if (board[r][c] != ' ') {
                if (board[r][c] == board[r][c+1] && board[r][c] == board[r][c+2] && board[r][c] == board[r][c+3]) {
                    setWinner(r,c);
                    return;
                }
            }
        }
    }

    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 3; r++) {
            if (board[r][c] != ' ') {
                if (board[r][c] == board[r+1][c] && board[r][c] == board[r+2][c] && board[r][c] == board[r+3][c]) {
                    setWinner(r,c);
                    return;
                }
            }
        }
    }

    for (let r = 0; r < rows - 3; r++) {
        for (let c = 0; c < columns - 3; c++) {
            if (board[r][c] != ' ') {
                if (board[r][c] == board[r+1][c+1] && board[r][c] == board[r+2][c+2] && board[r][c] == board[r+3][c+3]) {
                    setWinner(r,c);
                    return;
                }
            }
        }
    }

    for (let r = 3; r < rows; r++) {
        for (let c = 0; c < columns - 3; c++) {
            if (board[r][c] != ' ') {
                if (board[r][c] == board[r-1][c+1] && board[r][c] == board[r-2][c+2] && board[r][c] == board[r-3][c+3]) {
                    setWinner(r,c);
                    return;
                }
            }
        }
    }
}

const cubeFallingAnimation = [
    { transform: 'rotate(0) scale(1)' },
    { transform: 'rotate(360deg) scale(0)' }
];

const cubeFallingTiming = {
    duration: 2000,
    iterations: 1,
}

function color(tile){
    if (currentPlayer == playerRed) {
        tile.classList.add("red-piece");
        tile.animate(cubeFallingAnimation, cubeFallingTiming);
        currentPlayer = playerYellow
    } else {
        tile.classList.add("yellow-piece");
        tile.animate(cubeFallingAnimation, cubeFallingTiming);
        currentPlayer = playerRed;
    }
}

function setWinner(r,c) {
    winner = board[r][c];
    isGameOver = true;
}