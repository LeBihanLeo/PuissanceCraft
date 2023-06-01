const rows = 6;
const columns = 7;

const emptyTile = "0";

/**
 * For a given board, check if the game has a winner
 * @param board The board to check if there is a winner
 * @returns {boolean} If there is a winner
 */
function checkWinner(board) {
    // Horizontally check
    for (let c = 0; c < columns - 3; c++)
        for (let r = 0; r < rows; r++)
            if (board[c][r] !== emptyTile)
                if (board[c][r] === board[c + 1][r] && board[c][r] === board[c + 2][r] && board[c][r] === board[c + 3][r])
                    return true;

    // Vertical check
    for (let c = 0; c < columns; c++)
        for (let r = 0; r < rows - 3; r++)
            if (board[c][r] !== emptyTile)
                if (board[c][r] === board[c][r + 1] && board[c][r] === board[c][r + 2] && board[c][r] === board[c][r + 3])
                    return true;

    // Diagonal check /
    for (let c = 0; c < columns - 3; c++)
        for (let r = 0; r < rows - 3; r++)
            if (board[c][r] !== emptyTile)
                if (board[c][r] === board[c + 1][r + 1] && board[c][r] === board[c + 2][r + 2] && board[c][r] === board[c + 3][r + 3])
                    return true;

    // Diagonal check \
    for (let c = 0; c < columns - 3; c++)
        for (let r = 3; r < rows; r++)
            if (board[c][r] !== emptyTile){
                if (board[c][r] === board[c + 1][r - 1] && board[c][r] === board[c + 2][r - 2] && board[c][r] === board[c + 3][r - 3])
                    return true;
            }

    return false;
}

module.exports = {
    checkWinner: checkWinner
};