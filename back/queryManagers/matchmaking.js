const userRegistry = require("../logic/app/userRegistry");



// List of sockets that are waiting for a match
let waitingRankedSocket = [];
let waitingUnrankedSocket = [];

/**
 * Add the player to the matchmaking system
 * @param id The given player id
 * @param name The given player name
 * @param gameMode
 */
async function join(id, name, gameMode, coordinates){
    let country;
    if(coordinates)
        country = await userRegistry.getCountryName(coordinates.lat, coordinates.lng);

    console.log("Country is " + country);
    if(gameMode === "ranked") {
        if (waitingRankedSocket.filter(e => e.id === id).length > 0)
            return;

        if(waitingRankedSocket.length === 0){
            waitingRankedSocket.push({id, name, country});
            return;
        }

        return waitingRankedSocket.pop();
    } else {
        if (waitingUnrankedSocket.filter(e => e.id === id).length > 0)
            return;

        if(waitingUnrankedSocket.length === 0){
            waitingUnrankedSocket.push({id, name, country});
            return;
        }

        return waitingUnrankedSocket.pop();
    }
}

function remove(id) {
    for(let i = 0; i < waitingRankedSocket.length; i++)
        if(waitingRankedSocket[i].id === id) {
            console.log(waitingRankedSocket[i].name + " removed from ranked matchmaking algorithm.")
            waitingRankedSocket.splice(i, 1);
        }

    for(let i = 0; i < waitingUnrankedSocket.length; i++)
        if(waitingUnrankedSocket[i].id === id) {
            console.log(waitingUnrankedSocket[i].name + " removed from unranked matchmaking algorithm.")
            waitingUnrankedSocket.splice(i, 1);
        }
}

function getInQueue(data, response) {

    const responseData = {
        unranked: waitingUnrankedSocket.length,
        ranked: waitingRankedSocket.length
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(responseData));
}

module.exports = {
    join:join,
    remove:remove,
    getInQueue:getInQueue
};
