document.addEventListener('DOMContentLoaded', init, false);

document.addEventListener("deviceready", onDeviceReady, false);
document.addEventListener("online", onOnline, false);
document.addEventListener("offline", onOffline, false);
document.addEventListener("resume", onOnline, false);
document.addEventListener("pause", onOffline, false);

if(window.hasOwnProperty("cordova")){
    console.log("Running on device");

} else {
    window.addEventListener('load', init);
}

function onDeviceReady() {
    console.log(navigator.vibrate);
}

let statusWaitingDiv;
let textAnimationHandler;
let nbDot = 1;

function init(){
    socket = io("ws://13.38.147.141/api/game");
    console.log("Connecting to matchmaking");
    playerId = getUserId();
    statusWaitingDiv = document.getElementById("statusWaiting");
    socket.emit('matchmaking', 
        getTokenFromCookie(), 
        localStorage.getItem('gameMode'), 
        {
            'lat': localStorage.getItem("latitude"),
            'lng': localStorage.getItem("longitude")
        }
     );
    socket.on('matchFound', (matchInfo) => onMatchFound(matchInfo));
    if(!textAnimationHandler)
        textAnimationHandler = setInterval(textAnimation, 750); // Start ... animation
}

function onMatchFound(matchInfo) {
    navigator.vibrate(1000)
    console.log("Match found : ", matchInfo)
    document.getElementById("waiting").classList.add("hidden");
    document.getElementById("loading").classList.remove("hidden");
    setTimeout(() => {
        localStorage.setItem('gameRoom', matchInfo.room);
        localStorage.setItem('gameOpponentName', matchInfo.opponentName);
        localStorage.setItem('gameRedElo', matchInfo.redElo);
        localStorage.setItem('gameYellowElo', matchInfo.yellowElo);
        localStorage.setItem('gameOpponentId', matchInfo.opponentId);
        localStorage.setItem('country', matchInfo.country);
        localStorage.setItem('opponentCountry', matchInfo.opponentCountry);
        window.location.href = "multiplayer.html";
    }, 2800);
    console.log("" + matchInfo.opponentCountry); 
}

function textAnimation(){
    const baseText = "Waiting for opponent";
    if(nbDot > 3) nbDot = 1;
    let dotString = "";
    for(let i=0; i<nbDot; i++) dotString += ".";
    statusWaitingDiv.innerText = baseText + dotString;
    nbDot++;
}


function onOffline() {
    console.log("On Offline");
    document.getElementById("reconnecting").classList.remove("hidden");
    socket.disconnect();
}

function onOnline() {
    console.log("On Online");
    init();
    document.getElementById("reconnecting").classList.add("hidden");

}