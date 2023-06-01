document.addEventListener('DOMContentLoaded', init, false);
document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    console.log(navigator.vibrate);
}
const blockSound = new Audio('../resources/sounds/block-sound.mp3');
let gameInformation;

let socket;

// Cell values should be "0" if no one placed a pawn in the cell, 1 if the first player owns the cell, 2 if it's the second player
const playerRed = "1";
let playerRedScore = 0;
let playerYellowScore = 0;
let gameDuration;
let playerId;
let board = [];
let finished = false;

function init(){
    socket = io("ws://13.38.147.141/api/game");
    searchToObject();

    socket.emit('setup', {
        token: getTokenFromCookie(),
        gameType: "pvp"
    });

    socket.emit('join', gameInformation.room);

    socket.on('gameFinished', onGameFinished);
    socket.on('updatedBoard', (boardState) => onUpdatedBoard(boardState));
    socket.on('rematchGame', (newRedElo, newYellowElo) => {
        localStorage.setItem('gameRedElo', newRedElo);
        localStorage.setItem('gameYellowElo', newYellowElo);
        window.location.reload(true);
    });
    socket.on('rematchAsked', () => {
        document.getElementById("rematchStatus").classList.remove("hidden");
        document.getElementById("rematchStatus").innerText = gameInformation.opponentName + " want to rematch!"
    });

    gameDuration = 30;
}

/**
 * Get information from the local storage
 */
function searchToObject() {
    gameInformation = {
        'opponentName': localStorage.getItem('gameOpponentName'),
        'opponentId': localStorage.getItem('gameOpponentId'),
        'redElo': localStorage.getItem('gameRedElo'),
        'yellowElo': localStorage.getItem('gameYellowElo'),
        'room': localStorage.getItem('gameRoom'),
        'opponentCountry':  localStorage.getItem('opponentCountry'),
        'country':  localStorage.getItem('country'),
    }
}

/**
 * Update the board when receiving from the backend
 * @param newBoardState
 */
function onUpdatedBoard(newBoardState) {
    console.log("Receiving updatedBoard event with parameters", newBoardState);
    let newBoard = newBoardState.board;

    // If the board isn't yet instanced
    if(board.length === 0) {
        setupFrontEnd();
        initBoard(newBoard);
    } else {
        updateNewPiece(newBoardState)
    }

    gameDuration = 30;

    board = newBoard;
}

let countries;
fetch('/js/countries.json')
  .then(response => response.json())
  .then(countriesJson => {
    countries = countriesJson;
    console.log("Countries.json loaded!");
  })
  .catch(error => {
    console.error('Countries.json error: ', error);
  });

function getFlagCssCode(countryName) {
    for (let index = 0; index < countries.length; index++) {
        country = countries[index];
        if(country.Name == countryName)
            return country.flag;
    }
    return "";
}

function addToDiv(div, htmlClass) {
    console.log("html class is " + htmlClass);
    if(htmlClass == "") div.parentNode.removeChild(div);
    else div.classList.add(htmlClass);
}


function setupFrontEnd(){
    let playerPlayFirst = gameInformation.room === getUserId();
    initScore();

    if(playerPlayFirst) {
        document.getElementById("player-red-name").innerText = decodeJWT(getTokenFromCookie()).username;
        document.getElementById("player-yellow-name").innerText = gameInformation.opponentName;

        addToDiv(document.getElementById("player-red-flag"), getFlagCssCode(gameInformation.country));
        addToDiv(document.getElementById("player-yellow-flag"), getFlagCssCode(gameInformation.opponentCountry));
    } else {
        document.getElementById("player-red-name").innerText = gameInformation.opponentName;
        document.getElementById("player-yellow-name").innerText = decodeJWT(getTokenFromCookie()).username;

        addToDiv(document.getElementById("player-red-flag"), getFlagCssCode(gameInformation.opponentCountry));
        addToDiv(document.getElementById("player-yellow-flag"), getFlagCssCode(gameInformation.country));
    }

    document.getElementById("player-red-avatar").style.borderColor = "red";
    document.getElementById("player-red-name").style.color = "red";
    document.getElementById("player-yellow-name").style.color = "yellow";

    document.getElementById("player-red-elo").innerText = "(" + gameInformation.redElo + ")";
    document.getElementById("player-yellow-elo").innerText = "(" + gameInformation.yellowElo + ")";
    let playerRedRankImg = (Math.floor(parseInt(gameInformation.redElo) / 500) * 500);
    let playerYellowRankImg = (Math.floor(parseInt(gameInformation.yellowElo) / 500) * 500);
    document.getElementById("playerRedRank").src = "../resources/rank/" + (playerRedRankImg >= 3000 ? 3000 : playerRedRankImg) + ".webp";
    document.getElementById("playerYellowRank").src = "../resources/rank/" + (playerYellowRankImg >= 3000 ? 3000 : playerYellowRankImg) + ".webp";

    clockDurationInterval = setInterval(clockDuration, 1000);
}


function updateNewPiece(newBoardState) {
    let lastUpdatedCoordinate = newBoardState.lastUpdatedCoordinate;

    if(lastUpdatedCoordinate == null && board !== []) return;

    let lastPlayer = newBoardState.lastPlayer;

    updatePlayerBorders(lastPlayer);

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
                tile.classList.add(board[c][r] == 1 ? "red-piece" : "yellow-piece");
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

            // On supprime le background color pour revenir a la normale
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

function updatePlayerBorders(lastPlayer){
    let red = "red";
    let yellow = "yellow";

    if(lastPlayer === playerRed) {
        document.getElementById("player-red-avatar").style.borderColor = "transparent";
        document.getElementById("player-yellow-avatar").style.borderColor = yellow;
    } else {
        document.getElementById("player-red-avatar").style.borderColor = red;
        document.getElementById("player-yellow-avatar").style.borderColor = "transparent";
    }
}

/**
 * When the user click on a tile, fire a new moveEvent through the socket.
 */
function newMoveEvent() {
    let coordinates = this.id.split("-");
    console.log("Emitting newMove event with parameters ", coordinates, getTokenFromCookie());

    socket.emit("newMove", {
        'roomId': gameInformation.room,
        'coordinate': [parseInt(coordinates[0]), parseInt(coordinates[1])],
        'token': getTokenFromCookie()
    });
}

function clockDuration() {
    let minutes = parseInt(gameDuration / 60, 10);
    let seconds = parseInt(gameDuration % 60, 10);
    document.getElementById("duration")
        .innerText = (minutes < 10 ? '0' + minutes : minutes) + " : " + (seconds < 10 ? '0' + seconds : seconds);

    if(gameDuration >= 1)
        gameDuration--;
}

/**
 * When the game is finished
 * @param winner
 * @param eloDiff that will be added or substract to current player elo
 */
function onGameFinished(winner, eloDiff) {
    navigator.vibrate(1000)
    finished = true;
    clearInterval(clockDurationInterval);

    const winnerName = document.getElementById("winner-name");
    const eloDiffText = document.getElementById("eloDiffText");
    const myBar = document.getElementById("myBar");
    const previousRankEloText = document.getElementById("previousRankElo");
    const nextRankEloText = document.getElementById("nextRankElo");

    let winnerText, winnerColor, newElo;

    // setup front end game information
    if(winner == 0) {
        winnerText = "Nobody";
        winnerColor = "white";
        if(gameInformation.room === getUserId()) {
            newElo = gameInformation.redElo;
        } else {
            newElo = gameInformation.yellowElo;
        }
        eloDiffText.innerText = "+0 (" + newElo + ")";
    } else {
        if(gameInformation.room === getUserId()) {
            if(winner == playerRed) { // If i'm red and i won
                newElo = parseInt(gameInformation.redElo) + eloDiff;
                winnerText = decodeJWT(getTokenFromCookie()).username
                winnerColor = "red";
                playerRedScore++;
                eloDiffText.innerText = "+" + eloDiff + " (" + newElo + ")";
            } else { // If i'm red and i lost
                newElo = ((parseInt(gameInformation.redElo) - eloDiff) < 0) ? 0 : parseInt(gameInformation.redElo) - eloDiff;
                winnerText = gameInformation.opponentName;
                winnerColor = "yellow";
                playerYellowScore++;
                eloDiffText.innerText = "-" + eloDiff + " (" + newElo + ")";
            }
        } else {
            if(winner == playerRed) { // If i'm yellow and i lost
                newElo = ((parseInt(gameInformation.yellowElo) - eloDiff) < 0) ? 0 : parseInt(gameInformation.yellowElo) - eloDiff;
                winnerText = gameInformation.opponentName
                winnerColor = "red";
                playerRedScore++;
                eloDiffText.innerText = "-" + eloDiff + " (" + newElo + ")";

            } else { // If i'm yellow and i won
                newElo = parseInt(gameInformation.yellowElo) + eloDiff;
                winnerText = decodeJWT(getTokenFromCookie()).username
                winnerColor = "yellow";
                playerYellowScore++;
                eloDiffText.innerText = "+" + eloDiff + " (" + newElo + ")";
            }
        }
    }

    winnerName.innerText = winnerText;
    winnerName.style.color = winnerColor;

    if(newElo > 3000) {
        document.getElementById("elo-progress").classList.add("hidden");
        document.getElementById("netherstar").classList.remove("hidden");
        document.getElementById("netherstarElo").innerText = newElo;
    } else {
        let previousRankElo = Math.floor(newElo / 500) * 500;
        let nextRankElo = Math.ceil(newElo / 500) * 500;
        let percentageToNextElo = (Math.abs(previousRankElo - newElo) / 500) * 100;

        myBar.innerHTML = newElo;
        myBar.style.width = percentageToNextElo + "%";
        previousRankEloText.innerText = "" + previousRankElo;
        nextRankEloText.innerText = "" + nextRankElo;
        document.getElementById("previousRankImg").src="../resources/rank/" + previousRankElo +".webp"
        document.getElementById("nextRankImg").src="../resources/rank/" + nextRankElo +".webp"
    }

    let endInfo = document.querySelector("article");
    endInfo.style.display = "flex";
    endInfo.style.flexDirection = "column";

    endInfo.classList.remove("hidden");
    if(localStorage.getItem('gameMode') === "unranked") {
        document.getElementById("elo").classList.add("hidden");
    }
    if(window.hasOwnProperty("cordova") || window.matchMedia("(max-width: 768px)").matches){
        document.getElementById("game-menu").classList.add("overlay")
        document.getElementById("quit-button").classList.remove("hidden-mobile")
    }

    // Add score and active the rematch button
    localStorage.setItem('score', playerRedScore + ":" + playerYellowScore);
    const rematchButton = document.getElementById("rematchButton");
    rematchButton.addEventListener("click", function () {
        socket.emit('askRematch', gameInformation.room);
        rematchButton.classList.add("disabled");
        document.getElementById("rematchStatus").innerText = "Rematch request sent!"
        document.getElementById("rematchStatus").classList.remove("hidden");
    })
}

function initScore() {
    let score = localStorage.getItem('score');
    if (score != undefined) {
        playerRedScore = score.split(':')[0];
        playerYellowScore = score.split(':')[1];
        document.getElementById("score").innerText = playerRedScore + " - " + playerYellowScore;
    }
}

function resetScore(){
    localStorage.removeItem('score');
}
