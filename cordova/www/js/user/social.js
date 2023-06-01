const serverBaseUrl = "http://13.38.147.141/api/user/";

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    console.log(navigator.vibrate);
}
let appIsOnPause = false;
document.addEventListener("resume", onResume, false);
document.addEventListener("pause", onPause, false);

function onResume() {
    appIsOnPause = false;
}


function onPause() {
    appIsOnPause = true;
}

let socialSocket;

if(window.hasOwnProperty("cordova")){
    console.log("Running on device");
    document.addEventListener("online", onOnlineSocial, false);
    document.addEventListener("offline", onOfflineSocial, false);
    document.addEventListener("resume", socialInit, false);
} else {
    window.addEventListener('load', socialInit);
}

function onOnlineSocial(){
    console.log("On online social");
    document.getElementById("notification-button").classList.remove("disabled");
    document.getElementById("social-button").classList.remove("disabled");
    socialInit();
}

function onOfflineSocial(){
    document.getElementById("notification-button").classList.add("disabled");
    document.getElementById("social-button").classList.add("disabled");
}


let friends = [];
let messageHistory = {};
let activeConversation = "";
let friendNotifications = []


function socialInit() {
    console.log("Social init");
    if(!getTokenFromCookie()) {
        document.getElementById('iconMenus').classList.add("hidden");
        return;
    }

    if(socialSocket) socialSocket.disconnect();

    // Socket behavior
    socialSocket = io("ws://13.38.147.141/api/chat");
    console.log("Connecting to the chat...");
    socialSocket.emit('join', getTokenFromCookie());

    socialSocket.on('receive', message => receiveMessage(message));
    socialSocket.on('friend-request', friendRequestData => addFriendNotification(friendRequestData));

    // Clash handling
    socialSocket.on('receiveMatch', receiveMatch => onReceiveMatch(receiveMatch));
    socialSocket.on('matchFound', matchInfo => onClashFound(matchInfo));


    // Html behavior
    let messageInput = document.getElementById("message-input");
    messageInput.addEventListener("keyup", ({key}) => {
        if (key !== "Enter") return;

        sendMessage(messageInput.value, activeConversation)
        messageInput.value = "";
    })

    let friendInput = document.getElementById("friend-input");
    friendInput.addEventListener("keyup", ({key}) => {
        friendInput.placeholder = "Add friend...";
        if (key !== "Enter") return;
        addFriend(friendInput.value, false);
    })

    if(activeConversation === "") {
        messageInput.placeholder = "Start a conversation by clicking on a friend";
        messageInput.disabled = true;
    }

    messageHistory = JSON.parse(localStorage.getItem('messageHistory'));
    if(messageHistory == null) messageHistory = {};
}

/**
 * Add a friend
 * @param friendName
 * @param notif boolean, need a notification or not
 */
function addFriend(friendName, notif){
    if(friendName === "") return;

    fetch(serverBaseUrl + "addFriend", {
        method: "post",
        body: JSON.stringify({
            token: getTokenFromCookie(),
            username:friendName
        })
    }).then(async response => {
        let friendInput = document.getElementById("friend-input");
        if(!response.ok) {
            friendInput.placeholder = await response.text();
            friendInput.value = "";
            return;
        }
        friendInput.value = "";
        await fetchFriends();
        if(!notif){
            let friendRequest = {
                "senderToken" : getTokenFromCookie(),
                "friendName": friendName,
                "senderName": decodeJWT(getTokenFromCookie()).username
            };
            socialSocket.emit('send-friend-request', friendRequest);
        }
    });
}

/**
 * Add a friend notification
 * @param friendRequestData
 */
function addFriendNotification(friendRequestData) {
    console.log("5) receive a friend request from "+friendRequestData.username)

    // Avoid invitation flooding
    for(let i=0; i<friendNotifications.length; i++)
        if (friendNotifications[i] === friendRequestData.username)
            return;
    if(window.hasOwnProperty("cordova")){
        var notification = cordova.plugins.notification.local;
        if(appIsOnPause)
            notification.schedule({
                title: "Puissance Craft",
                text: friendRequestData.username+" want to be your friend!",
                foreground: true,
                icon: "../../ressources/icon/app.jpg",
                smallIcon: "../../ressources/icon/app-little.png"
            });
    }
    navigator.vibrate(1000)

    friendNotifications.push(friendRequestData.username);
    let notificationList = document.getElementById("notificationList");
    notificationList.append(createFriendNotification(friendRequestData.username))
    let notifIcon = document.getElementById("bell");
    notifIcon.src="../resources/icon/bell_notif.png";
}

/**
 * Create the html friend notification
 * @param username
 * @returns {HTMLDivElement}
 */
function createFriendNotification(username){
    let friendNotif = document.createElement("div");
    friendNotif.classList.add("notif");
    friendNotif.classList.add("match-request");

    let entete = document.createElement("div")
    entete.innerHTML="<span class=\"user\">"+username+"</span> want to be your friend!"
    friendNotif.append(entete);

    let decision = document.createElement("div");
    decision.classList.add("decision");

    let accept = document.createElement("div");
    accept.innerText="Accept";
    accept.classList.add("button");
    accept.classList.add("accept");
    accept.addEventListener("click", () => friendRequestDecision(username, true, event.target));


    let refuse = document.createElement("div");
    refuse.innerText="Refuse";
    refuse.classList.add("button");
    refuse.classList.add("accept");
    refuse.addEventListener("click", () => friendRequestDecision(username, false, event.target));


    decision.append(accept);
    decision.append(refuse);

    friendNotif.append(decision);
    return friendNotif;
}

/**
 * add the friend or not in user's information depends on his decision
 * @param username
 * @param decision
 * @param element
 */
function friendRequestDecision(username, decision, element){
    if(decision) addFriend(username, true)
    element.parentElement.parentElement.remove();
}

/**
 * Get all friends
 * @returns {Promise<void>}
 */
async function fetchFriends(){
    await fetch(serverBaseUrl + "friends", {
        method: "post",
        headers: {
            'Accept': 'application/json'
        },
        body: JSON.stringify({token: getTokenFromCookie()})
    }).then(async response => {
        if(!response.ok) return;
        friends = await response.json();
    });

}

/**
 * Add friend to html
 */
function displayFriendList(){
    let friendsDiv = document.getElementById("friends");
    while (friendsDiv.firstChild) friendsDiv.removeChild(friendsDiv.lastChild); // Nul et inefficace

    for(let i=0; i < friends.length; i++){
        let friendDiv = document.createElement("button");
        friendDiv.id = friends[i].id;
        friendDiv.classList.add("friend-button");
        friendDiv.innerText = friends[i].username;
        friendDiv.addEventListener("click", switchConversation);

        if(friends[i].id === activeConversation) {
            friendDiv.append(clashVisual(friends[i].id));
            friendDiv.classList.add("selected");
        }
        friendsDiv.append(friendDiv)
    }
}

/**
 * Add the clash button in html
 * @param friendId
 * @returns {HTMLElement}
 */
function clashVisual(friendId){
    let challengeImg = document.createElement("IMG");
    challengeImg.src="../resources/icon/sword.png";
    challengeImg.classList.add("small-icon");
    challengeImg.classList.add("image_on");
    challengeImg.id = "challengeImg";

    challengeImg.addEventListener("mouseover", ()=>{
        event.target.src="../resources/icon/red_sword.png";
    })
    challengeImg.addEventListener("mouseout", ()=>{
        event.target.src="../resources/icon/sword.png";
    })
    challengeImg.addEventListener("click", () => {
        let messageDiv = document.createElement("div");
        messageDiv.classList.add("info-message");
        messageDiv.innerText = "A clash invitation has been sent!"

        let messagesDiv = document.getElementById("messages"); // Find the messages div
        messagesDiv.append(messageDiv) // Add message to messages div
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll down to the bottom of the message list

        sendMatch(friendId);
    });
    return challengeImg
}

/**
 * Update chat box when switch between friend conversation
 * @returns {Promise<void>}
 */
async function switchConversation(){
    if(this.id === activeConversation) return;
    await fetchFriends();
    let messages = document.getElementById("messages");
    while (messages.firstChild) messages.removeChild(messages.lastChild); // Clear messages

    let friendDiv = document.getElementById(this.id);
    friendDiv.classList.add("selected");

    if(activeConversation !== "") {
        let lastSelectedDiv = document.getElementById(activeConversation);
        lastSelectedDiv.classList.remove("selected");

        let challengeImg = document.getElementById("challengeImg");
        if(challengeImg != null) challengeImg.remove();
    }

    activeConversation = this.id;

    let messageInput = document.getElementById("message-input");
    messageInput.value = "";

    for(let i=0; i<friends.length; i++)
        if(friends[i].id === this.id && !friends[i].mutualFriend){
            messageInput.placeholder = "You need to be mutual-friend to start a conversation.";
            messageInput.disabled = true;
            return;
        }

    friendDiv.append(clashVisual(this.id));

    messageInput.placeholder = "Type your message here...";
    messageInput.disabled = false;
    let history = messageHistory[activeConversation];
    if(history == null) return;

    for(let i = 0; i < history.length; i++){
        // Html logic
        let messageDiv = document.createElement("div");
        messageDiv.classList.add(history[i].senderId === getUserId() ? "self-message" : "message");
        messageDiv.innerText = history[i].content;
        messages.append(messageDiv);
    }
}

/**
 * Remove notification and friend button when opening the social window
 * @returns {Promise<void>}
 */
async function displaySocialMenu(){
    await fetchFriends();
    displayFriendList();

    // Set correct display
    document.getElementById('social').classList.remove("hidden");
    document.getElementById('iconMenus').classList.add("hidden");
    document.getElementById('sound-button').classList.add("hidden");

    document.getElementById('username').innerHTML = decodeJWT(getTokenFromCookie()).username;
}

/**
 * Remove the social window and display notification and friend buttons when quitting the social window
 */
function quitSocialMenu() {
    // Set correct display
    document.getElementById('social').classList.add("hidden");
    document.getElementById('iconMenus').classList.remove("hidden");
    document.getElementById('sound-button').classList.remove("hidden");
}

function sendMessage(content, receiverId){
    if(content === '') return;

    console.log("Send message to " + receiverId);

    let message = {
        "senderToken" : getTokenFromCookie(),
        "receiverId": receiverId,
        "content": content
    };
    socialSocket.emit('send', message);
}

/**
 * Display and save the new message received
 * @param message
 */
function receiveMessage(message){
    if(message.senderId !== getUserId()) {
        if(messageHistory[message.senderId] == null) messageHistory[message.senderId] = [];
        messageHistory[message.senderId].push(message);
    } else {
        if(messageHistory[activeConversation] == null) messageHistory[activeConversation] = [];
        messageHistory[activeConversation].push(message);
    }
    localStorage.setItem('messageHistory', JSON.stringify(messageHistory));

    if(message.senderId === activeConversation || message.senderId === getUserId()){
        // Html logic
        let messageDiv = document.createElement("div");
        messageDiv.classList.add(message.senderId === getUserId() ? "self-message" : "message");
        messageDiv.innerText = message.content;

        let messagesDiv = document.getElementById("messages"); // Find the messages div
        messagesDiv.append(messageDiv) // Add message to messages div
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll down to the bottom of the message list


    }
}

/**
 * Change the notification icon when receiving a notification
 * @param matchData
 */
function receiveNotification(matchData){

    // Avoid invitation flooding
    for(let i=0; i<notifications.length; i++)
        if (notifications[i] === matchData.senderId)
            return;

    if(window.hasOwnProperty("cordova")){
        var notification = cordova.plugins.notification.local;
        if(appIsOnPause)
            notification.schedule({
                title: "Puissance Craft",
                text: matchData.senderUsername+" challenge you!",
                foreground: true,
                icon: "../../ressources/icon/app.jpg",
                smallIcon: "../../ressources/icon/app-little.png"
        });
    }



    navigator.vibrate(1000)

    notifications.push(matchData.senderId);
    let notificationList = document.getElementById("notificationList");
    notificationList.append(createMatchNotification(matchData.senderId, matchData.senderUsername, matchData.friendToken))
    let notifIcon = document.getElementById("bell");
    notifIcon.src="../resources/icon/bell_notif.png";
}

function createMatchNotification(friendId, friendName, friendToken){
    let matchNotif = document.createElement("div");
    matchNotif.classList.add("notif");
    matchNotif.classList.add("match-request");

    let entete = document.createElement("div")
    entete.innerHTML="<span class=\"user\">"+friendName+"</span> challenge you!"
    matchNotif.append(entete);

    let decision = document.createElement("div");
    decision.classList.add("decision");

    let accept = document.createElement("div");
    accept.innerText="Accept";
    accept.classList.add("button");
    accept.classList.add("accept");
    accept.addEventListener("click", () => matchDecision(friendId, friendName, friendToken, true, event.target));


    let refuse = document.createElement("div");
    refuse.innerText="Refuse";
    refuse.classList.add("button");
    refuse.classList.add("accept");
    refuse.addEventListener("click", () => matchDecision(friendId, friendName, friendToken,false, event.target));


    decision.append(accept);
    decision.append(refuse);

    matchNotif.append(decision);
    return matchNotif;
}

let notifications = [];

function displayNotificationMenu(){
    document.getElementById('notifications').classList.remove("hidden");
    document.getElementById('iconMenus').classList.add("hidden");
    document.getElementById('sound-button').classList.add("hidden");

    document.getElementById('username').innerHTML = decodeJWT(getTokenFromCookie()).username;
    let notifIcon = document.getElementById("bell");
    notifIcon.src="../resources/icon/bell.png";
}

function quitNotificationsMenu() {
    document.getElementById('notifications').classList.add("hidden");
    document.getElementById('iconMenus').classList.remove("hidden");
    document.getElementById('sound-button').classList.remove("hidden");
}

function sendMatch(friendId){
    let sendMatch = {
        "senderToken" : getTokenFromCookie(),
        "friendId": friendId
    };
    socialSocket.emit('sendMatch', sendMatch);
}

function onReceiveMatch(receiveMatch){
    receiveNotification(receiveMatch)
}

function matchDecision(friendId, friendName, friendToken, decision, target){
    for(let i= 0; i < notifications.length; i++)
        if (notifications[i] === friendId){
            notifications.splice(i, 1);
        }

    if(!decision)
        console.log("You refuse to match with "+ friendName);
    else{
        console.log("You accept to match with "+ friendName);
        let matchDecision = {
            "senderToken" : getTokenFromCookie(),
            "userId": getUserId(),
            "friendId": friendId,
            "friendToken":friendToken,
            "friendName":friendName,
            "decision": decision
        };
        socialSocket.emit('matchDecision', matchDecision);
    }
    target.parentElement.parentElement.remove();
}

/**
 * Set information in localStorage and switch to the multiplayer page
 * @param matchInfo
 */
function onClashFound(matchInfo) {
    console.log("Clash found : ", matchInfo)
    setTimeout(() => {
        localStorage.setItem('gameRoom', matchInfo.room);
        localStorage.setItem('gameOpponentName', matchInfo.opponentName);
        localStorage.setItem('gameOpponentId', matchInfo.opponentId);
        localStorage.setItem('gameRedElo', matchInfo.redElo);
        localStorage.setItem('gameYellowElo', matchInfo.yellowElo);
        localStorage.setItem('gameMode', 'unranked');
        window.location.href = "/html/multiplayer.html";
    }, 1500);
}