const gameManager = require('../logic/game/gameManager');
const mcts = require('../logic/game/ai/monte-carlo');
const userRegistry = require('../logic/app/userRegistry');
const matchmaking = require('../queryManagers/matchmaking');

const socketIo = require('socket.io');

const gameType = {
    'versusAi': "ai",
    'oneVsOne': "pvp"
}

const weightingFactor = 50;

let io;
let boardStates = {};
let playersInRoom = {};
let rematchForRoom = {};
let roomTid = {}

function start(appIo) {
    io = appIo;

    io.on('connection', (socket) => {
        console.log("Someone is connected to the socket");
        let currentRoomId;

        socket.on('setup', gameParameters => socket.on('join', (room) => initRoom(socket, gameParameters, room)));

        socket.on("matchmaking", (token, gameMode, coordinates) => {
            if(!userRegistry.verifyToken(token)) return;
            let userinfo = userRegistry.decodeJWT(token);
            currentRoomId = userinfo.id;
            proceedMatchmaking(socket, token, gameMode, coordinates);
        });

        socket.on('disconnect', () => proceedDisconnection(currentRoomId));

        socket.on('askRematch', async (room) => {
            if(rematchForRoom[room]) {
                io.to(room).emit('rematchGame', await userRegistry.getEloById(playersInRoom[room].redPlayer), await userRegistry.getEloById(playersInRoom[room].yellowPlayer));
                rematchForRoom[room] = false;
            } else {
                rematchForRoom[room] = true;
                socket.to(room).emit('rematchAsked');
            }
        });

        // Start listening the game inputs
        playGame(socket);
    });
}

function proceedDisconnection(currentRoomId) {
    console.log("User disconnected from the socket, room " + currentRoomId);
    if(currentRoomId == null) return;
    matchmaking.remove(currentRoomId); // Remove user from matchmaking
}

async function proceedMatchmaking(socket, token, gameMode, coordinates) {
    console.log("Setting up a oneVsOne game");

    let userinfo = userRegistry.decodeJWT(token);
    socket.join(userinfo.id);

    let matchmakingResult = await matchmaking.join(userinfo.id, userinfo.username, gameMode, coordinates);
    // If there is no found player at this time, then the player should wait.
    if (!matchmakingResult) {
        console.log("No match found, user (" + userinfo.username + ") is waiting");
        return;
    }

    console.log("Match found! (" + userinfo.username + " vs " + matchmakingResult.name + ")");
    io.to(userinfo.id).emit("matchFound", {
        'opponentName': matchmakingResult.name,
        'opponentId': matchmakingResult.id,

        'opponentCountry': matchmakingResult.country,
        'country': coordinates != null ? await userRegistry.getCountryName(coordinates.lat, coordinates.lng) : null,

        'redElo': (await userRegistry.getEloById(userinfo.id)),
        'yellowElo': (await userRegistry.getEloById(matchmakingResult.id)),
        'room': userinfo.id
    });
    io.to(matchmakingResult.id).emit("matchFound", {
        'opponentName': userinfo.username,
        'opponentId': userinfo.id,

        'opponentCountry': coordinates != null ? await userRegistry.getCountryName(coordinates.lat, coordinates.lng) : null,
        'country': matchmakingResult.country,


        'redElo': (await userRegistry.getEloById(userinfo.id)),
        'yellowElo': (await userRegistry.getEloById(matchmakingResult.id)),
        'room': userinfo.id
    });
    playersInRoom[userinfo.id] = {
        'redPlayer': userinfo.id,
        'yellowPlayer': matchmakingResult.id,
        'gameMode': gameMode
    }
}

function setupClashRoom(roomId, redPlayerId, yellowPlayerId) {
    playersInRoom[roomId] = {
        'redPlayer': redPlayerId,
        'yellowPlayer': yellowPlayerId,
        'gameMode': 'unranked'
    }
}

/**
 * Initialise a new game for a given roomID
 * @param socket The socket to handle the conversation
 * @param roomId The id of the room to start a new game
 * @param gameParameters The parameters of the game
 */
async function initRoom(socket, gameParameters, roomId) {
    // Let the server join the room, for the given room ID
    socket.join(roomId);

    // Check if the game is a vs AI game.
    if(gameParameters.gameType === gameType.versusAi) {
        console.log("Setting up a versusAi game");
        // Add the board to the map of <roomID, boards>
        boardStates[roomId] = gameParameters.boardState ?
            gameParameters.boardState : gameManager.initialiseBoard(gameType.versusAi);

        // If AI start first
        if (gameParameters.AIplays === 1)
            // Call the game manager to proceed the move calculated by the AI.
            gameManager.onNewMove(boardStates[roomId], await mcts.nextMove(boardStates[roomId].board));
    }

    if(gameParameters.gameType === gameType.oneVsOne) {
        if(!await userRegistry.verifyToken(gameParameters.token)) return;
        boardStates[roomId] = gameManager.initialiseBoard(gameType.oneVsOne);

        if(roomTid[roomId]  != null) {
            clearTimeout(roomTid[roomId]);
            roomTid[roomId]  = null;
        }

        roomTid[roomId] = setTimeout( async () => {
            console.log("Game timed out");
            io.to(roomId).emit("gameFinished", "2", (playersInRoom[roomId].gameMode !== undefined && playersInRoom[roomId].gameMode === "ranked") ? await updateStats(roomId, "2") : 0);
        }, 32000);
    }

    // Send the updated board to the client
    io.to(roomId).emit("updatedBoard", boardStates[roomId]);
}

/**
 * Start listening to a set-up game.
 * @param socket - The socket to listen to.
 */
function playGame(socket){
    // Listening to newMove events.
    socket.on("newMove", async (data) => {
        let roomId = data.roomId; if(!roomId) return;
        let coordinate = data.coordinate; if(!coordinate) return;
        let boardState = boardStates[roomId]; if(!boardState) return;

        // Verifying user token before allowing him to play
        if(boardState.gameType === gameType.oneVsOne && !await userRegistry.verifyToken(data.token))
            return;

        try {

            if(boardState.gameType === gameType.oneVsOne) {
                let userinfo = userRegistry.decodeJWT(data.token);

                // First move
                if(boardState.lastPlayer == null && userinfo.id == roomId){
                    gameManager.onNewMove(boardState, coordinate);
                    io.to(roomId).emit("updatedBoard", boardState);
                }

                if(boardState.lastPlayer === "1" && userinfo.id == roomId) return;
                if(boardState.lastPlayer === "2" && userinfo.id != roomId) return;
                gameManager.onNewMove(boardState, coordinate);

                if(roomTid[roomId]  != null) {
                    clearTimeout(roomTid[roomId]);
                    roomTid[roomId]  = null;
                }

                roomTid[roomId] = setTimeout( async () => {
                    console.log("Game timed out");
                    let winner = boardState.lastPlayer === "1" ? "1" : "2";
                    io.to(roomId).emit("gameFinished", winner, (playersInRoom[roomId].gameMode !== undefined && playersInRoom[roomId].gameMode === "ranked") ? await updateStats(roomId, winner) : 0);
                }, 32000);

                io.to(roomId).emit("updatedBoard", boardState);
            }

            // If the game mode is set to AI, the AI should play after the player.
            if(boardState.gameType === gameType.versusAi) {
                gameManager.onNewMove(boardState, coordinate);
                io.to(roomId).emit("updatedBoard", boardState);
                gameManager.onNewMove(boardState, await mcts.nextMove(boardState.board));
                io.to(roomId).emit("updatedBoard", boardState);
            }

        } catch (e) {
            let error = e.message
            let winner;
            let eloDiff = 0;

            if (error === "Game finished") {
                let winner = boardState.lastPlayer;
                io.to(roomId).emit("updatedBoard", boardState);

                if(boardState.gameType === gameType.oneVsOne) {
                    if(playersInRoom[roomId].gameMode !== undefined && playersInRoom[roomId].gameMode === "ranked") {
                        eloDiff = await updateStats(roomId, winner);
                    }

                    io.to(roomId).emit("gameFinished", winner, eloDiff); // Emit the end game

                    // Reset the timeout
                    if(roomTid[roomId]  != null) {
                        clearTimeout(roomTid[roomId]);
                        roomTid[roomId]  = null;
                    }

                } else if (boardState.gameType === gameType.versusAi) {
                    io.to(roomId).emit("gameFinished", winner);
                }
                boardStates[roomId] = null;
            } else if (error === "Draw"){
                winner = 0;
                io.to(roomId).emit("updatedBoard", boardState);
                if(boardState.gameType === gameType.oneVsOne) {
                    io.to(roomId).emit("gameFinished", winner, eloDiff); // Emit the end game

                    // Reset the timeout
                    if(roomTid[roomId]  != null) {
                        clearTimeout(roomTid[roomId]);
                        roomTid[roomId]  = null;
                    }
                } else if (boardState.gameType === gameType.versusAi) {
                    io.to(roomId).emit("gameFinished", winner);
                }
                boardStates[roomId] = null;
            } else {
                console.log(error);
            }
        }
    });
}

function getBoardStates(){
    return boardStates;
}

async function updateStats(roomId, winner) {
    let playerRedElo = await userRegistry.getEloById(playersInRoom[roomId].redPlayer);
    let playerYellowElo = await userRegistry.getEloById(playersInRoom[roomId].yellowPlayer);

    let redChanceToWin = 1 / (1 + Math.pow(10, (playerYellowElo - playerRedElo) / 400))
    let newEloDiff;
    // If red player won
    if (winner == 1) {
        newEloDiff = Math.round(weightingFactor * (1 - redChanceToWin));
        await userRegistry.updateStats(playersInRoom[roomId].redPlayer, playersInRoom[roomId].yellowPlayer, newEloDiff);
    } else {
        newEloDiff = Math.round(weightingFactor * redChanceToWin);
        await userRegistry.updateStats(playersInRoom[roomId].yellowPlayer, playersInRoom[roomId].redPlayer, newEloDiff);
    }

    return newEloDiff;
}

module.exports = {
    start: start,
    getBoardStates: getBoardStates,
    setupClashRoom: setupClashRoom
};