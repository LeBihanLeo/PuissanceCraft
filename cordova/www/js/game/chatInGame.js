let socketInGame;
let ImRed = false;
let chatIsHidden = true

document.addEventListener('DOMContentLoaded', init, false);
document.addEventListener("resume", init, false);

function init() {
    socketInGame = io("ws://13.38.147.141/api/game/chat");
    console.log("Connecting to the chat In game...");
    socketInGame.emit('join', getTokenFromCookie());

    socketInGame.on('receiveInGame', message => appendMessage(message.content, "other"));
    bindButtons();
}

function bindButtons(){
    let msgButtons = document.getElementsByClassName("grid-item");
    for(let i = 0 ; i < msgButtons.length ; i++){
        msgButtons[i].addEventListener("click", ()=> sendMessage(event.target))
    }
    document.getElementById("chat-mobile-icon").addEventListener("click", mobileChat)
}
function mobileChat(){
    let chat = document.getElementById("mobile-chat-message-box")
    if(!(chatIsHidden = !chatIsHidden)) chat.classList.remove("visibility-hidden")
    else chat.classList.add("visibility-hidden")
}

function sendMessage(target) {
    var message = target.innerText;
    appendMessage(message, "me")

    message = {
        "senderToken" : getTokenFromCookie(),
        "receiverId": localStorage.getItem('gameOpponentId'),
        "content": message
    };
    socketInGame.emit('sendInGame', message);

}

function appendMessage(message, sender){
        if(window.hasOwnProperty("cordova") || window.matchMedia("(max-width: 768px)").matches){
            if(document.getElementById("player-red-name").innerText == getUsername())
                ImRed = true;
            let myBubbleId = ImRed ? "bubble-red" : "bubble-yellow"
            let otherBubbleId = !ImRed ? "bubble-red" : "bubble-yellow"
            let chatBubble = document.getElementById(sender == 'me'? myBubbleId : otherBubbleId);
            chatBubble.innerText = message;
            let id="red-msg_up"
            if((sender == 'me'&& !ImRed) || (!(sender == 'me') && ImRed)) id= "yellow-msg_up"
            // Création de l'élément img avec ses attributs
            var img = document.createElement("img");
            img.setAttribute("src", "../resources/game/msg_up.png");
            img.setAttribute("class", "msg-up");
            img.setAttribute("id",   id);

            chatBubble.appendChild(img);
            chatBubble.classList.add("show")
            chatBubble.addEventListener('animationend', () => {
                chatBubble.classList.remove('show');
            });
    }
    else{
        let chatBox = document.getElementById("output");
        var messageElement = document.createElement("div");
        messageElement.innerText = message;
        messageElement.classList=sender;


        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll down to the bottom of the message list
    }
}