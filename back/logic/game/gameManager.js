const referee = require('./referee.js');

// Cell values should be "0" if no one placed a pawn in the cell, 1 if the first player owns the cell, 2 if it's the second player
const playerRed = "1";
const playerYellow = "2";
const emptyTile = "0";

const rows = 6;
const columns = 7;

/**
 * Initialize an empty connect4 board State
 */
function initialiseBoard(gameType) {
    gameIsOver = false;
    let board = createBoard();
    return {
        'board': board,
        'lastPlayer': playerYellow,
        'lastUpdatedCoordinate': null,
        'lastUpdateTime': Date.now(),
        'gameType': gameType,
        'gameover': false
    }
}

/**
 * Initialize an empty connect4 board
 * @returns {*[]}
 */
function createBoard(){
    let board = [];
    for (let c = 0; c < columns; c++){
        let column = [];
        for (let r = 0; r < rows; r++)
            column.push(emptyTile);
        board.push(column);
    }
    return board;
}

/**
 * For a given board, add (if possible) a tile at the given coordinate
 * @param boardState The board to add the tile
 * @param coordinate The coordinate to add the tile
 */
function onNewMove(boardState, coordinate) {
    if (!boardState.gameover) {
        board = boardState.board;

        let columnCurrentHeight = 0;
        while(board[coordinate[0]][columnCurrentHeight] !== emptyTile){
            columnCurrentHeight++;
            if (columnCurrentHeight === rows)
                throw new Error("Out of bound in game manager");
        }

        let currentPlayer = findCurrentPlayer(boardState.lastPlayer);
        board[coordinate[0]][columnCurrentHeight] = currentPlayer;

        boardState.lastPlayer = currentPlayer;
        boardState.lastUpdatedCoordinate = [coordinate[0], columnCurrentHeight];
        boardState.lastUpdateTime = Date.now();

        if(referee.checkWinner(board)) {
            boardState.gameover = true;
            throw new Error("Game finished");
        }

        if(boardIsFull(board)) {
            boardState.gameover = true;
            throw new Error("Draw");
        }
    }
}

/**
 * For a given boardState find the player who has to play
 * @param lastPlayer The player that played the last
 * @returns {string} The player who has to play
 */
function findCurrentPlayer(lastPlayer){
    return lastPlayer === playerYellow ? playerRed : playerYellow;
}

function boardIsFull(board) {
    for(let i = 0; i < columns; i++) {
        if (board[i][rows-1] == "0") {
            return false;
        }
    }
    return true;
}

module.exports = {
    initialiseBoard: initialiseBoard,
    onNewMove: onNewMove
};