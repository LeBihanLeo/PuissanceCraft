window.addEventListener('load', init);
document.addEventListener("offline", onOffline, false);
document.addEventListener("online", onOnline, false);
const backgroundMusic = new Audio('sounds/bgm.mp3');

document.addEventListener('deviceready', onDeviceReady, false);
document.addEventListener("resume", function () {
    if(!bgmMuted) {
        media.play();
    }
}, false);

document.addEventListener("pause", function () {
    if(!bgmMuted) {
        media.pause();
    }
}, false);

let media;
let bgmMuted = localStorage.getItem("bgmMuted") == "true" ? true : false;
let muteImg = document.getElementById("mute");


var onSuccess = function(position) {
    console.log('User position is :' + '\n' +
    'Latitude: '          + position.coords.latitude          + '\n' +
    'Longitude: '         + position.coords.longitude         + '\n' +
    'Altitude: '          + position.coords.altitude          + '\n');

    localStorage.setItem('latitude', position.coords.latitude);
    localStorage.setItem('longitude', position.coords.longitude);
    localStorage.setItem('altitude', position.coords.altitude);
};

function onDeviceReady() {
    playMP3();
    navigator.geolocation.getCurrentPosition(onSuccess);

};


/**
 * If user is not connected, we disable the multiplayer and profile button
 */
function init() {
    if(!window.hasOwnProperty("cordova")){
        navigator.geolocation.getCurrentPosition(onSuccess);
    }

    console.log("init");

    console.log(bgmMuted);
    backgroundMusic.play()
    if(!bgmMuted) {
        backgroundMusic.volume = 1.0;
        muteImg.src = "./resources/icon/mute.png";
    } else {
        backgroundMusic.volume = 0.0;
        muteImg.src = "./resources/icon/unmute.png";
    }
    backgroundMusic.addEventListener('ended', function() {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play();
    }, false);

    
    if(getTokenFromCookie() === undefined ||getTokenFromCookie()  == null) {
        document.getElementById("multiplayer-button").style.display  = "none";
        document.getElementById("profile-button").classList.add("disabled");
    }

    const img = document.querySelector("#title");

    if (window.innerWidth <= 768) {
        img.src = "./resources/app_logo_wrap.png";
    } else {
        img.src = "./resources/app_logo.png";
    }

    window.addEventListener("orientationchange", function(){
        console.log("Rotation");
        if (window.innerWidth <= 768) {
            img.src = "./resources/app_logo.png";
        } else {
            img.src = "./resources/app_logo_wrap.png";
        }
    });
}

function onMute() {
    console.log("Mute/Unmute");
    if(!bgmMuted && (window.hasOwnProperty("cordova"))) {
        media.pause();
        bgmMuted = true;
        localStorage.setItem("bgmMuted", "true");
        muteImg.src = "./resources/icon/unmute.png";
    } else if (!bgmMuted) {
        backgroundMusic.volume = 0.0;
        bgmMuted = true;
        localStorage.setItem("bgmMuted", "true");
        muteImg.src = "./resources/icon/unmute.png";
    } else if (bgmMuted && (window.hasOwnProperty("cordova"))){
        media.play();
        bgmMuted = false;
        localStorage.setItem("bgmMuted", "false");
        muteImg.src = "./resources/icon/mute.png";
    } else if (bgmMuted) {
        backgroundMusic.volume = 1.0;
        bgmMuted = false;
        localStorage.setItem("bgmMuted", "false");
        muteImg.src = "./resources/icon/mute.png";
    }
}

function playMP3() {
    console.log("Play MP3");
    var mp3URL = getMediaURL("sounds/bgm.mp3");
    media = new Media(mp3URL, null, mediaError, mediaStatus);
    if(!bgmMuted || bgmMuted == undefined) {
        media.setVolume(1.0);
        media.play();
    }
}

function getMediaURL(s) {
    if(device.platform.toLowerCase() === "android") return "/android_asset/www/" + s;
    return s;
}

function mediaError(e) {
}

function mediaStatus(status) {
    if (status === Media.MEDIA_STOPPED) {
        media.seekTo(0);
        media.play();
    }
    console.log('status', JSON.stringify(arguments));
}


function onOffline() {
    console.log("On Offline");
    document.getElementById("reconnecting").classList.remove("hidden");
    document.getElementById("multiplayer-button").classList.add("disabled");
    document.getElementById("profile-button").classList.add("disabled");
}

function onOnline() {
    console.log("On Online");
    document.getElementById("reconnecting").classList.add("hidden");
    document.getElementById("multiplayer-button").classList.remove("disabled");
    document.getElementById("profile-button").classList.remove("disabled");
}

