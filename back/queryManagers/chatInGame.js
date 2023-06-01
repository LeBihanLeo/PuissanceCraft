const socketIo = require('socket.io');
const userRegistry = require("../logic/app/userRegistry");
let io;

function start(appIo) {
    io = appIo;

    io.on('connection', (socket) => {
        console.log("Someone is connected to the chat");
        socket.on('join', (token) => onJoin(socket, token));
        socket.on('sendInGame', (message) =>  onMessageInGame(socket, message));
    });
}

function onMessageInGame(socket, message) {

    let content = message.content; if (content == null) return; // Check presence of content variable
    let senderToken = message.senderToken; if (senderToken == null) return; // Check presence of senderToken variable
    let receiverId = message.receiverId; if (receiverId == null) return; // Check presence of receiverId variable

    console.log("onMessageInGame", message);

    if(!userRegistry.verifyToken(senderToken)) return; // Check client token

    let senderInformation = userRegistry.decodeJWT(senderToken);
    // Sending message to receiver
    io.to(receiverId).emit("receiveInGame", {
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
    console.log("Someone join the in game chat")
}

module.exports = {
    start: start,
};