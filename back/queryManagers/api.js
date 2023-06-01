const url = require('url');
const userRegistry = require('../logic/app/userRegistry');
const gameRegistry = require('../logic/app/gameRegistry');
const matchmaking = require('../queryManagers/matchmaking');


// Main method, exported at the end of the file. It's the one that will be called when a REST request is received.
function manageRequest(request, response) {
    addCors(response);

    const reqUrl =  url.parse(request.url, true);
    console.log('Request type: ' + request.method + '\nEndpoint: ' + request.url + '\n');

    if (request.method === 'POST') {
        // If the request is a POST, it may have a body, so the first step is to retrieve sent data. For that, the request is iterable, and once complete it is
        // possible to concatenate received data into a string, and into an object thanks to JSON.parse.
        const buffers = [];

        request.on("data", chunk => {
            buffers.push(chunk);
        });

        request.on("end", () => {
            try {
                const body = Buffer.concat(buffers).toString();
                const data = JSON.parse(body);
                
                console.log(data);

                if (reqUrl.pathname === '/api/login') {
                    userRegistry.login(data, response);
                    return;
                }

                if (reqUrl.pathname === '/api/signup') {
                    return userRegistry.register(data, response);
                }

                if (reqUrl.pathname === '/api/games/save') {
                    return gameRegistry.saveGame(data, response);
                }

                if (reqUrl.pathname === '/api/games/load') {
                    return gameRegistry.loadGame(data, response);
                }

                if (reqUrl.pathname === '/api/user/friends') {
                    userRegistry.getFriendsAPI(data, response);
                    return;
                }

                if (reqUrl.pathname === '/api/user/addFriend') {
                    userRegistry.addFriendAPI(data, response);
                    return;
                }

                if (reqUrl.pathname === '/api/user/stats') {
                    userRegistry.getStatByUserId(data, response);
                    return;
                }

                if (reqUrl.pathname === '/api/leaderboard') {
                    userRegistry.getLeaderboard(data, response);
                    return;
                }

                if (reqUrl.pathname === '/api/matchmaking') {
                    matchmaking.getInQueue(data, response);
                    return;
                }

                if(reqUrl.pathname === '/api/locate') {
                    userRegistry.getCountryNameApi(data, response);
                    return;
                }
          
                response.statusCode = 200;
                response.end(`Thanks for calling ${request.url}`);

            } 
            catch (error) {
                if(error instanceof SyntaxError) {
                    response.statusCode = 400;
                    response.end("Invalid JSON");
                } else {
                    throw error;
                }
            }
        });
    }
}


/* This method is a helper in case you stumble upon CORS problems. It shouldn't be used as-is:
** Access-Control-Allow-Methods should only contain the authorized method for the url that has been targeted
** (for instance, some of your api urls may accept GET and POST request whereas some others will only accept PUT).
** Access-Control-Allow-Headers is an example of how to authorize some headers, the ones given in this example
** are probably not the ones you will need. */
function addCors(response) {
    // Website you wish to allow to connect to your server.
    response.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow.
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow.
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent to the API.
    response.setHeader('Access-Control-Allow-Credentials', true);
}

exports.manage = manageRequest;