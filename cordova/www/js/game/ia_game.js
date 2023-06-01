document.addEventListener('DOMContentLoaded', init, false);
document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    console.log(navigator.vibrate);
}
const blockSound = new Audio('../resources/sounds/block-sound.mp3');
let socket;

// Cell values should be "0" if no one placed a pawn in the cell, 1 if the first player owns the cell, 2 if it's the second player
const playerRed = "1";
let playerScore = 0;
let iaScore = 0;
let gameDuration;
let playerId;
let aiFirst;
let board;
let finished = false;
let gameInformation;

function init(){
    console.log("Connecting to socket");
    socket = io("ws://13.38.147.141/api/game");

    if(getTokenFromCookie() === undefined || getTokenFromCookie()  == null) {
        document.getElementById("save-container").style.display  = "none";
        document.getElementById("saveButton").style.display = "none";
    } else {
        document.getElementById("player-name").innerText = decodeJWT(getTokenFromCookie()).username
    }


    loadButtonSounds()

    document.getElementById("saveButton").addEventListener("click", saveGame);
    document.getElementById("loadSave").addEventListener("click", resumeGame);

    document.getElementById("playerButton").addEventListener("click", () => (createNewGame(false)));
    document.getElementById("aiButton").addEventListener("click", () => (createNewGame(true)));
}

function startGame(board, whoPlay, gameInformation, boardState){
    setupFrontEnd(gameInformation.doAiPlayFirst);

    playerId = getUserId();
    //créer la room
    socket.emit('setup', {
        token: getTokenFromCookie(),
        gameType: 'ai',
        AIplays: gameInformation.ia.gamePosition,
        boardState: boardState
    });
    socket.emit('join', playerId);
    socket.on('gameFinished', onGameFinished);
    socket.on('updatedBoard', (boardState) => onUpdatedBoard(boardState));
}

function createNewGame(DoAiPlayFirst){
    //créer un board
    aiFirst = DoAiPlayFirst;
    board = [];
    initBoard(board);

    //définir les informations des joueurs
    gameInformation = GameInformation(DoAiPlayFirst);
    console.log("GameInformation = " + JSON.stringify(gameInformation));

    //Qui commence
    let whoPlay = 1;

    //start the game
    startGame(board, whoPlay, gameInformation, undefined)
}

async function resumeGame() {
    let data = await loadSave();

    board = data.boardState.board;
    let whoPlay = data.boardState.lastPlayer === 1 ? 2 : 1;
    let gameInformation = data.gameInformation;

    aiFirst = gameInformation.doAiPlayFirst;
    initBoard(board)

    startGame(board, whoPlay, gameInformation, data.boardState)
}

function GameInformation(DoAiPlayFirst){
    return {
        doAiPlayFirst: DoAiPlayFirst,
        player:{
            gamePosition: DoAiPlayFirst ? 2 : 1,
            color: DoAiPlayFirst? "yellow-piece":"red-piece"
        },
        ia:{
            gamePosition: DoAiPlayFirst ? 1 : 2,
            color: DoAiPlayFirst? "red-piece":"yellow-piece"
        }
    }
}

function setupFrontEnd(DoAiPlayFirst){
    initScore();
    gameDuration = 0;

    document.querySelector("nav").classList.add("hidden");
    document.querySelector("header").classList.add("hidden");
    document.querySelector("main").classList.remove("hidden");

    let playerColor;
    let iaColor;

    if(DoAiPlayFirst) {
        playerColor = "yellow";
        iaColor = "red";
    } else {
        playerColor = "red";
        iaColor = "yellow";
    }

    document.getElementById("player-name").style.color = playerColor;
    document.getElementById("ia-name").style.color = iaColor;

    document.getElementById("player-avatar").style.borderColor = playerColor;
    document.getElementById("ia-avatar").style.borderColor = iaColor;

    clockDurationInterval = setInterval(clockDuration, 1000);
}

function onUpdatedBoard(newBoardState) {
    console.log("Receiving updatedBoard event with parameters", newBoardState);
    let newBoard = newBoardState.board;
    console.log(newBoardState);


    // If the board isn't yet instanced
    if(board.length === 0) {
        initBoard(newBoard);
        if (aiFirst) {
            updateNewPiece(newBoardState);
        }
    } else {
        updateNewPiece(newBoardState)
    }

    board = newBoard;
}

function updateNewPiece(newBoardState) {
    let lastUpdatedCoordinate = newBoardState.lastUpdatedCoordinate;
    let lastPlayer = newBoardState.lastPlayer;

    let lastPlayedTile = document.getElementById(lastUpdatedCoordinate[0].toString() + "-" + lastUpdatedCoordinate[1].toString());


    if (lastPlayer === playerRed){
        lastPlayedTile.classList.add("red-piece");
    }
    else
        lastPlayedTile.classList.add("yellow-piece");

    if (!finished) {
        blockSound.play();
        lastPlayedTile.animate([
            // keyframes
            { transform: 'translateY(-' + (5-lastUpdatedCoordinate[1]) * lastPlayedTile.offsetHeight + 'px)' },
            { transform: 'translateY(0px)' }
        ], {
            // timing options
            duration: 200 * (7-lastUpdatedCoordinate[1]),
            iterations: 1
        })
    }
}

/**
 * When a new game is detected, generate the HTML of te board based on the given board.
 * @param board The board to initialize
 */
function initBoard(board) {
    for (let c = 0; c < board.length; c++){
        for (let r = board[0].length - 1; r >= 0; r--){
            // HTML logic
            let tile = document.createElement("div");
            tile.id = c.toString() + '-' + r.toString();
            tile.classList.add("tile");
            tile.classList.add("column-" + c.toString());
            tile.addEventListener("click", newMoveEvent);
            document.getElementById("board").append(tile)
            if(board[c][r] != 0)
                tile.classList.add(board[c][r] == 1 ? "red-piece":"yellow-piece");
        }

        let columns = document.querySelectorAll(".column-" + c);

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

/**
 * When the user click on a tile, fire a new moveEvent through the socket.
 */
function newMoveEvent() {
    let coordinates = this.id.split("-");
    console.log("Emitting newMove event with parameters ",playerId, coordinates, getTokenFromCookie());

    socket.emit("newMove", {
        'roomId': playerId,
        'coordinate': [parseInt(coordinates[0]), parseInt(coordinates[1])],
        'token': getTokenFromCookie()
    });
}

function clockDuration() {
    let minutes = parseInt(gameDuration / 60, 10);
    let seconds = parseInt(gameDuration % 60, 10);
    document.getElementById("duration")
        .innerText = (minutes < 10 ? '0' + minutes : minutes) + " : " + (seconds < 10 ? '0' + seconds : seconds);

    gameDuration++;
}

function onGameFinished(winner) {
    navigator.vibrate(1000)
    document.getElementById("saveButton").classList.add("hidden");
    finished = true;
    clearInterval(clockDurationInterval);
    const winnerName = document.getElementById("winner-name");
    let winnerText, winnerColor;

    if(winner == 0) {
        winnerText = "Nobody";
        winnerColor = "white";
    } else {
        if (aiFirst) {
            winnerText = playerRed == winner ? "AI" : (getTokenFromCookie() === undefined || getTokenFromCookie()  == null) ? "You" : decodeJWT(getTokenFromCookie()).username;
        } else {
            winnerText = playerRed == winner ? (getTokenFromCookie() === undefined || getTokenFromCookie()  == null) ? "You" : decodeJWT(getTokenFromCookie()).username : "AI";
        }
        winnerColor = playerRed == winner ? "red" : "yellow";
        winnerText == "AI" ? iaScore++ : playerScore++;
    }

    winnerName.innerText = winnerText;
    winnerName.style.color = winnerColor;

    let endInfo = document.querySelector("article");
    endInfo.style.display = "flex";
    endInfo.style.flexDirection = "column";
    endInfo.classList.remove("hidden");

    document.getElementById("rematchButton").addEventListener("click", function () {
        localStorage.setItem('score', playerScore+":"+iaScore);
        window.location.reload(true);
    })
}

function initScore() {
    let score = localStorage.getItem('score');
    if (score != undefined) {
        playerScore = score.split(':')[0];
        iaScore = score.split(':')[1];
        document.getElementById("score").innerText = playerScore + " - " + iaScore;
    }
}
function resetScore(){
    localStorage.removeItem('score');
}