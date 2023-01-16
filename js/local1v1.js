var playerRed = "R";
var playerYellow = "Y";
var currentPlayer = playerRed;

var isGameOver = false;
var board;
var currentColumns; // Indicate the nb of avalaible tile on a column

var rows = 6;
var columns = 7;

window.onload = function() {
    setGame();
}

/**
 * Initialize the game board with empty tiles
 */
function setGame() {
    board = []
    currentColumns = [5, 5, 5, 5, 5, 5, 5];

    // TODO : Work with grid 
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

}