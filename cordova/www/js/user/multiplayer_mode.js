document.addEventListener('DOMContentLoaded', init, false);
document.addEventListener("offline", onOffline, false);
document.addEventListener("online", onOnline, false);
//In minute
let batteryCookieDuration = 30;
let batteryLevelAlert = 1;
/**
 * Get players in queue information and display them
 * @returns {Promise<void>}
 */
async function init() {
    localStorage.removeItem('gameMode');
    let data = (await getInQueue());
    document.getElementById("unrankedQueue").innerText = "In queue: " + data.unranked;
    document.getElementById("rankedQueue").innerText = "In queue: " + data.ranked;

    navigator.getBattery().then(function(battery) {
        var level = battery.level;
        let batteryIsCharging = battery.charging;
        console.log(level+ " bool = " + level <= batteryLevelAlert);
        if(level <= batteryLevelAlert && batteryIsCharging == false){
            // Définir le nom
            const nomCookie = "LowBattery";
            if(cookieExiste(nomCookie)) {
                console.log("Le cookie existe.");
            } else {
                console.log("Le cookie n'existe pas.");
                const valeurCookie = true;

                // Définir la date d'expiration du cookie (30 min à partir de maintenant)
                const dateExpiration = new Date();
                dateExpiration.setTime(dateExpiration.getTime() + (batteryCookieDuration * 60 * 1000));

                // Créer le cookie en utilisant la méthode document.cookie
                document.cookie = nomCookie + "=" + valeurCookie + "; expires=" + dateExpiration.toUTCString() + "; path=/";
                sendBatteryAlert();
            }
        }
    });
}

function sendBatteryAlert(){
    let batteryWarning = document.getElementById("battery-warning");
    batteryWarning.classList.add("battery-alert");
    batteryWarning.classList.remove('hidden');
    batteryWarning.addEventListener('animationend', () => {
        batteryWarning.classList.remove('battery-alert');
        batteryWarning.classList.add('hidden');

    });
}

// Vérifier si le cookie existe
function cookieExiste(nom) {
    const cookies = document.cookie.split(';');
    for(let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if(cookie.startsWith(nom + '=')) {
            return true;
        }
    }
    return false;
}

async function getInQueue(){
    let response;
    const data = {
        id: getUserId(),
        token: getTokenFromCookie()
    }

    response = await fetch("http://13.38.147.141/api/matchmaking", {
        method: "post",
        headers: {
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(async response => {
        if (response.ok) {
            let data = await response.json();
            console.log("Data from response", data);
            return data;
        }
        else {
            console.log(response)
        }
    })
    return response;
}

function onOffline() {
    document.getElementById("unranked").classList.add("disabled");
    document.getElementById("ranked").classList.add("disabled");
    document.getElementById("reconnecting").classList.remove("hidden");
}

function onOnline() {
    document.getElementById("reconnecting").classList.add("hidden");
    document.getElementById("unranked").classList.remove("disabled");
    document.getElementById("ranked").classList.remove("disabled");
}