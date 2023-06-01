const socketIo = require('socket.io');
const userRegistry = require('../logic/app/userRegistry');
const {setupClashRoom} = require("./gameSocket");


let io;

function start(appIo) {
    io = appIo;

    io.on('connection', (socket) => {
        console.log("Someone is connected to the chat");
        socket.on('join', (token) => onJoin(socket, token));
        socket.on('send', (message) =>  onMessage(socket, message));
        socket.on('sendMatch', (sendMatch) => onSendMatch(socket, sendMatch));
        socket.on('matchDecision', (matchDecision) => onMatchDecision(socket, matchDecision));
        socket.on('send-friend-request', (friendRequest) => onSendFriendRequest(socket, friendRequest));



    });
}


function onMessage(socket, message) {
    let content = message.content; if (content == null) return; // Check presence of content variable
    let senderToken = message.senderToken; if (senderToken == null) return; // Check presence of senderToken variable
    let receiverId = message.receiverId; if (receiverId == null) return; // Check presence of receiverId variable

    console.log("onMessage", message);

    if(!userRegistry.verifyToken(senderToken)) return; // Check client token

    let senderInformation = userRegistry.decodeJWT(senderToken);
    // Sending message to receiver
    io.to(receiverId).emit("receive", {
        'senderId': senderInformation.id,
        'senderUsername': senderInformation.username,
        'content': content
    });

    // Sending message to sender (to be sure that its message was proceeded
    io.to( senderInformation.id).emit("receive", {
        'senderId': senderInformation.id,
        'senderUsername': senderInformation.username,
        'content': content
    });
}

function onJoin(socket, token) {
    if(token == null) return; // Check presence of token variable
    if(!userRegistry.verifyToken(token)) return; // Check client token

    let clientInformation = userRegistry.decodeJWT(token);
    socket.join(clientInformation.id);
}


function onSendMatch(socket, sendMatch){
    let senderToken = sendMatch.senderToken; if (senderToken == null) return; // Check presence of senderToken variable
    let friendId = sendMatch.friendId; if (friendId == null) return; // Check presence of friendId variable

    console.log("onMatch", sendMatch);

    if(!userRegistry.verifyToken(senderToken)) return; // Check client token

    let friendInformation = userRegistry.decodeJWT(senderToken);
    // Sending message to receiver
    io.to(friendId).emit("receiveMatch", {
        'senderId': friendInformation.id,
        'senderUsername': friendInformation.username,
        "friendToken": senderToken
    });
}

async function onMatchDecision(socket, matchDecision) {
    let senderToken = matchDecision.senderToken;
    if (senderToken == null) return; // Check presence of senderToken variable
    let userId = matchDecision.userId;
    if (userId == null) return; // Check presence of userId variable
    let friendId = matchDecision.friendId;
    if (friendId == null) return; // Check presence of friendId variable
    let friendName = matchDecision.friendName;
    if (friendName == null) return; // Check presence of friendName variable
    let decision = matchDecision.decision;
    if (decision == null) return; // Check presence of decision variable

    console.log("onMatchDecision", matchDecision);

    if (!await userRegistry.verifyToken(senderToken)) return; // Check client token


    let userinfo = userRegistry.decodeJWT(senderToken);
    console.log("friendId = " + friendId + " and userId = " + userId)
    io.to(userId).emit("matchFound", {
        'opponentName': friendName,
        'redElo': (await userRegistry.getEloById(userId)),
        'yellowElo': (await userRegistry.getEloById(friendId)),
        'opponentId': friendId,
        'room': userId
    });


    io.to(friendId).emit("matchFound", {
        'opponentName': userinfo.username,
        'redElo': (await userRegistry.getEloById(userId)),
        'yellowElo': (await userRegistry.getEloById(friendId)),
        'opponentId': userId,
        'room': userId
    });

    setupClashRoom(userId, userId, friendId);
}

async function onSendFriendRequest(socket, friendRequest){
    console.log("1) receive socket onSendFriendRequest, friendRequest = ", friendRequest);

    let senderToken = friendRequest.senderToken; if (senderToken == null) return; // Check presence of senderToken variable
    let friendName = friendRequest.friendName; if (friendName == null) return; // Check presence of friendName variable
    let senderName = friendRequest.senderName; if (senderName == null) return; // Check presence of friendName variable


    if(!await userRegistry.verifyToken(senderToken)) return; // Check client token
    console.log("2) Search friend id named "+friendName)
    let friendId = await userRegistry.getFriendIdByName(friendName);
    console.log("3) friendId= "+friendId)
    sendFriendRequest(friendId, senderName)
}


function sendFriendRequest(userWhoReceiveRequestId, userWhoSendRequestName){
    console.log("4) In sendFriendRequest, send to userId =  "+userWhoReceiveRequestId)

    io.to(userWhoReceiveRequestId).emit("friend-request", {
        'username': userWhoSendRequestName,
    });
}

module.exports = {
    start: start,
};