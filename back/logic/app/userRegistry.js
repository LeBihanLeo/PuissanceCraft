// Database import
const { MongoClient, ObjectId} = require("mongodb");

// Security imports
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const regex = require("./regex");
const {use} = require("bcrypt/promises");


const all_the_security_is_maintain_by_this_secret =
    "Zǎoshang hǎo zhōngguó xiànzài wǒ yǒu BING CHILLING wǒ hěn xǐhuān BING CHILLING"

// Create a mongodb client
const uri = "mongodb://puissancecraft:bihbonbuq@db:27017/?authSource=admin";
const client = new MongoClient(uri);

async function login(data, response) {

    let errorMessage = "";

    if (!regex.validateMail(data.mail))
        errorMessage = "Invalid email address. ";

    errorMessage += !regex.validatePassword(data.password) ? "Password must be at least 6 characters long. " : "";

    if (errorMessage.length == 0) {
        try {
            // Connect the client to the server
            await client.connect();

            // Enter the admin db
            const db = client.db("admin");

            const user = await db.collection("users").findOne({mail: data.mail});

            if(user && await bcrypt.compare(data.password, user.password)) {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json');
                const payload = {
                    id: user._id,
                    username: user.username,
                    email: user.mail,
                    elo: user.elo
                };
                const token = jwt.sign(payload, all_the_security_is_maintain_by_this_secret);
                response.end(JSON.stringify({ 'token': token }));
            } else {
                response.statusCode = 401;
                response.end("Bad credentials");
            }
        } catch (err) {
            console.log(err);
        }
        finally {
            // Ensures that the client will close after finish/error
            //await client.close();
        }
    } else {
        response.statusCode = 400;
        response.end(errorMessage);
    }
}

async function register(data, response) {

    let errorMessage = "";

    if (!regex.validateUsername(data.username))
        errorMessage = "Username must be between 3 and 15 characters long and can only contain letters and numbers. ";

    errorMessage += !regex.validateMail(data.mail) ? "Invalid email address. " : "";

    errorMessage += !regex.validatePassword(data.password) ? "Password must be at least 6 characters long. " : "";

    if(errorMessage.length === 0) {
        try {
            // Connect the client to the server
            await client.connect();

            // Enter the admin db
            const db = client.db("admin");

            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);

            //Check if the email or username is already use
            let emailResult = await db.collection("users").findOne({"mail":data.mail});
            let usernameResult = await db.collection("users").findOne({"username":data.username});

            if (emailResult == null && usernameResult == null){

                // Insert the user's information (which was in the body of the request) in the collection "users" of admin db
                await db.collection("users").insertOne({
                    'mail': data.mail,
                    'username': data.username,
                    'password': hashedPassword,
                    'friends': [],
                    'elo': 500,
                    'wins': 0,
                    'loses': 0
                }, function (err, res) {
                    if (err) throw err;
                });
                response.statusCode = 201;
                response.end("User successfully registered");
            }
            else{
                response.statusCode = 400;
                response.end("An account with the same mail or username already exists");
            }
        } catch (err) {
            console.log(err);
        }
        finally {
            // Ensures that the client will close after finish/error
            //await client.close();
        }
    } else {
        response.statusCode = 400;
        response.end(errorMessage);
    }
}

async function findUserById(id) {
    if(id == null) return;
    try{
        await client.connect(); // Connect the client to the server
        const db = client.db("admin"); // Enter the admin db

        const user = await db.collection("users").findOne({_id: new ObjectId(id)});
        if(user != null) return {
            'id': user._id,
            'username': user.username,
            'elo': user.elo,
            'wins': user.wins,
            'loses': user.loses
        }
    } catch (err) {
        console.log(err);
    }
    finally {
        // Ensures that the client will close after finish/error
        //await client.close();
    }
}

async function addFriendAPI(data, response) {
    if(data.username == null) {
        response.statusCode = 400;
        response.end("No username in data!")
        return;
    }

    if(!await verifyToken(data.token)) {
        response.statusCode = 401;
        response.end("Bad token!");
        return;
    }

    let userData = decodeJWT(data.token);
    let friendUsername = data.username;

    if(userData.username === friendUsername){
        response.statusCode = 400;
        response.end("Can not add yourself!")
        return;
    }
    try{
        await client.connect(); // Connect the client to the server
        const db = client.db("admin"); // Enter the admin db

        // Check if user is already friend with the future friend
        let user = await db.collection("users").findOne({_id: new ObjectId(userData.id)});

        for(let i = 0; i < user.friends.length; i++) {
            let f = user.friends[i];
            if (f.username === friendUsername){
                response.statusCode = 409;
                response.end("You are already friend!")
                return;
            }
        }

        let futureFriend = await db.collection("users").findOne({username:friendUsername})

        if(futureFriend == null){
            response.statusCode = 404;
            response.end("User not found!")
            return;
        }

        // Check for mutual friendship
        let mutualFriend = false;
        for(let i = 0; i < futureFriend.friends.length; i++){
            let f = futureFriend.friends[i];
            if (f.username !== userData.username) continue;
            mutualFriend = true;
        }

        await db.collection("users").updateOne({_id : new ObjectId(userData.id)}, { $push: { friends: {
                    id: futureFriend._id,
                    username: futureFriend.username,
                    mutualFriend: mutualFriend
                }
            }})

        if(mutualFriend) {
            await db.collection("users").updateOne(
                {_id : futureFriend._id, "friends.id": new ObjectId(userData.id)},
                {$set: {'friends.$.mutualFriend': true}}
            )
        }

        response.statusCode = 200;
        response.end("User added to your friend list!");
    }catch (err) {
        console.log(err);
    }
    finally {
        // Ensures that the client will close after finish/error
        //await client.close();
    }
}

async function getFriendsAPI(data, response) {
    // Check user token
    if(!await verifyToken(data.token)) {
        response.statusCode = 401;
        response.end("Bad token");
        return;
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(await getFriends(data.token)));
}

async function getStatByUserId(data, response) {

    // Check user token
    if(!await verifyToken(data.token)) {
        response.statusCode = 401;
        response.end("Bad token");
        return;
    }
    let userData = (await findUserById(data.id))
    let elo = userData.elo;
    const responseData = {
        elo: elo,
        win: userData.wins,
        lose: userData.loses
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(responseData));
}

async function getLeaderboard(data, response) {

    // Check user token
    if(!await verifyToken(data.token)) {
        response.statusCode = 401;
        response.end("Bad token");
        return;
    }
    try{
        await client.connect(); // Connect the client to the server
        const db = client.db("admin"); // Enter the admin db

        const responseData = await db.collection("users").find().sort({elo: -1}).limit(10).toArray();
        //await client.close();

        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(responseData));
    }catch (err) {
        console.log(err);
    }
    finally {
        // Ensures that the client will close after finish/error
        //await client.close();
    }
}

async function getFriends(token) {
    try{
        await client.connect(); // Connect the client to the server
        const db = client.db("admin"); // Enter the admin db

        let userData = decodeJWT(token);
        const user = await db.collection("users").findOne({_id: new ObjectId(userData.id)});

        const mutualFriends = user.friends.filter(friend => friend.mutualFriend === true);

        return mutualFriends;
    }catch (err) {
        console.log(err);
    }
    finally {
        // Ensures that the client will close after finish/error
        //await client.close();
    }
}


async function verifyToken(token) {
    if (token == null) return false;

    try {
        return jwt.verify(token, all_the_security_is_maintain_by_this_secret);
    } catch (err) {
        console.error(err);
        return false;
    }
}

/**
 * For a given Json Web token, decode the payload and return the decoded payload as a json
 * @param token The token to decode
 * @returns {any}
 */
function decodeJWT(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

async function updateStats(winnerId, loserId, eloDiff) {

    let winner = await findUserById(winnerId);
    let loser = await findUserById(loserId);

    try{
        await client.connect(); // Connect the client to the server
        const db = client.db("admin"); // Enter the admin db

        await db.collection("users").updateOne({_id : new ObjectId(winnerId)}, {$set: {'elo': winner.elo + eloDiff}});
        await db.collection("users").updateOne({_id : new ObjectId(loserId)}, {$set: {'elo': (loser.elo - eloDiff) < 0 ? 0 : loser.elo - eloDiff}});

        await db.collection("users").updateOne({_id : new ObjectId(winnerId)}, {$set: {'wins': winner.wins + 1}});
        await db.collection("users").updateOne({_id : new ObjectId(loserId)}, {$set: {'loses': loser.loses + 1}});
    }catch (err) {
        console.log(err);
    }
    finally {
        // Ensures that the client will close after finish/error
        ////await client.close();
    }
}


async function getFriendIdByName(name) {
    if(name == null) return;
    
    try{
        await client.connect(); // Connect the client to the server
        const db = client.db("admin"); // Enter the admin db
        const user = await db.collection("users").findOne({username: name});
        if(user != null) return user._id+""
    }catch (err) {
        console.log(err);
    }
    finally {
        // Ensures that the client will close after finish/error
        ////await client.close();
    } 
}

async function getEloById(id) {
    return (await findUserById(id)).elo
}

async function getCountryName(lat, lng) {
    if(lat == null || lng == null) return;
    try  {
        const url = `http://api.geonames.org/countryCodeJSON?lat=${lat}&lng=${lng}&username=estoult`;
        const response = await fetch(url);
        const data = await response.json();
        return data.countryName;
    } catch(e) {
        console.log(e);
        return;
    }
}

async function getCountryNameApi(data, response) {
    const lat = data.lat;
    const lng = data.lng;
    const countryName = await getCountryName(lat, lng);

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({'country': countryName}));
}




module.exports = {
    decodeJWT:decodeJWT,
    login: login,
    register: register,
    verifyToken: verifyToken,
    getFriendsAPI:getFriendsAPI,
    addFriendAPI:addFriendAPI,
    findUserById:findUserById,
    getEloById:getEloById,
    getStatByUserId:getStatByUserId,
    getLeaderboard:getLeaderboard,
    updateStats:updateStats,
    getFriendIdByName:getFriendIdByName,
    getCountryNameApi:getCountryNameApi,
    getCountryName:getCountryName
};