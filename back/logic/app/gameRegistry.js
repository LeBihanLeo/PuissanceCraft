const { MongoClient } = require("mongodb");
const socket = require('../../queryManagers/gameSocket');


// Create a mongodb client
const uri = "mongodb://puissancecraft:bihbonbuq@db:27017/?authSource=admin";
const client = new MongoClient(uri);

async function saveGame(data, response) {
    let boardStates = socket.getBoardStates();
    try {
        // Connect the client to the server
        await client.connect();

        // Enter the admin db
        const db = client.db("admin");

        await db.collection("game").deleteOne({userId: data.userId});
        // Insert the user's information (which was in the body of the request) in the collection "users" of admin db
        await db.collection("game").insertOne({
            'userId': data.userId,
            'gameInformation': data.gameInformation,
            'boardState': boardStates[data.userId],
        }, function (err, res) {
            if (err) throw err;
        });
        response.statusCode = 200;
        response.end("User successfully registered");
    } catch (err) {
        console.log(err);
    }
    finally {
        // Ensures that the client will close after finish/error
        await client.close();
    }
}

async function loadGame(data, response) {
    try {
        // Connect the client to the server
        await client.connect();

        // Enter the admin db
        const db = client.db("admin");

        const request = await db.collection("game").findOne({userId: data.userId});
        if(request){
            response.statusCode = 200;
            response.end(JSON.stringify(request));
        }
        else{
            response.statusCode = 404;
            response.end("NO SAVE FOUNDED WITH USERID");
        }


    } catch (err) {
        console.log(err);
    }
    finally {
        // Ensures that the client will close after finish/error
        await client.close();
    }
}


module.exports = {
    saveGame: saveGame,
    loadGame: loadGame,
};
