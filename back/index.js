// The http module contains methods to handle http queries.
const http = require('http');
// Let's import our logic.
const fileQuery = require('./queryManagers/front');
const apiQuery = require('./queryManagers/api');
const gameSocket = require('./queryManagers/gameSocket');
const chatInGameSocket = require('./queryManagers/chatInGame');
const chatSocket = require('./queryManagers/chatSocket');
const socketIo = require('socket.io');


/* The http module contains a createServer function, which takes one argument, which is the function that
** will be called whenever a new request arrives to the server.
 */
function server(request, response) {
    // First, let's check the URL to see if it's a REST request or a file request.
    // We will remove all cases of "../" in the url for security purposes.
    let filePath = request.url.split("/").filter(function(elem) {
        return elem !== "..";
    });

    try {
        // If the URL starts by /api, then it's a REST request (you can change that if you want).
        if (filePath[1] === "api") {
            apiQuery.manage(request, response);
            // If it doesn't start by /api, then it's a request for a file.
        } else {
            fileQuery.manage(request, response);
        }
    } catch(error) {
        console.log(`error while processing ${request.url}: ${error}`)
        response.statusCode = 400;
        response.end(`Something in your request (${request.url}) is strange...`);
    }
}
const app = http.createServer(server);

// Starting the socket
let io = socketIo(app, {
    cors: {
      origin: ["http://puissancecraft.connect4.academy", "http://13.38.147.141", "http://localhost"]
    },
    //pingTimeout: 3000,
    //pingInterval: 1000
});

chatSocket.start(io.of("/api/chat"));
gameSocket.start(io.of("/api/game"));
chatInGameSocket.start(io.of("/api/game/chat"));

// For the server to be listening to request, it needs a port, which is set thanks to the listen function.
app.listen(8000);