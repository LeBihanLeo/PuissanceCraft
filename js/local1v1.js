document.addEventListener('DOMContentLoaded', init, false);
var currentColor = "R"

var playerRed = "R";
var playerYellow = "Y";
var currentPlayer = playerRed;

var isGameOver = false;
var board;
var currentColumns; // Indicate the nb of avalaible tile on a column

var rows = 6;
var columns = 7;

function init(){
    console.log("---page loaded---");
    setGame();
    let board = document.getElementById("board");
    board.addEventListener("click", color);
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


function color(){
    let element =  event.target;
    if(element.classList.contains("tile")){
        if(currentColor == "R"){
            element.style.background = "red";
            currentColor = "Y"
        }
        else{
            element.style.background = "yellow";
            currentColor = "R"
        }  
    }
}