document.addEventListener('DOMContentLoaded', init, false);

function setElo(elo){
    let fixedElo = -1
    if(elo < 3000) fixedElo = Math.floor(elo / 500) * 500;
    else fixedElo = 3000;
    document.getElementById("r" + fixedElo).parentNode.classList.add("current-rank");
    document.getElementById("elo").innerText=elo;

}

async function setUserInfos() {
    let username = decodeJWT(getTokenFromCookie()).username;
    let email = decodeJWT(getTokenFromCookie()).email;
    let latitude = localStorage.getItem("latitude");
    let longitude = localStorage.getItem("longitude");
    let altitude = localStorage.getItem("altitude");
    let country = null;
    if (latitude != null && longitude != null) {
        country = (await getCountry(latitude, longitude));
        addToDiv(document.getElementById("flag"), getFlagCssCode(country));
    }
    document.getElementById("form-username").innerText = "Username: " + username;
    document.getElementById("form-email").innerText = "Email: " + email;

    if (latitude != null) {
        document.getElementById("x-location").classList.remove("hidden");
        document.getElementById("x-location").innerText = "x: " + latitude;
    }
    if (longitude != null) {
        document.getElementById("y-location").classList.remove("hidden");
        document.getElementById("y-location").innerText = "y: " + longitude;
    }
    if (altitude != null) {
        document.getElementById("z-location").classList.remove("hidden");
        document.getElementById("z-location").innerText = "z: " + parseFloat(altitude).toFixed(7);
    }
    if (country != null) {
        document.getElementById("country").classList.remove("hidden");
        document.getElementById("country").innerText = "Country: " + country;
    }
}

function setStats(data){
    let win = data.win;
    let lose = data.lose;
    let total = win+lose;
    let winrate = Math.round((win/total)*100);

    document.getElementById("win").innerText=win;
    document.getElementById("lose").innerText=lose;
    if(total==0)
        document.getElementById("winrate").innerText="-";
    else
        document.getElementById("winrate").innerText=winrate+"%";
}

async function getStats(){
    let response = -1;
    const data = {
        id: getUserId(),
        token: getTokenFromCookie()
    }

    response = await fetch("http://13.38.147.141/api/user/stats", {
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

async function getCountry(latitude, longitude){
    let response = -1;
    const data = {
        lat: latitude,
        lng: longitude
    }

    response = await fetch("http://13.38.147.141/api/locate", {
        method: "post",
        headers: {
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(async response => {
        if (response.ok) {
            let data = await response.json();
            console.log("Data from response", data);
            playerCountry = data;
            return data.country;
        }
        else {
            console.log(response)
        }
    })
    return response;
}

let countries;
fetch('/js/countries.json')
  .then(response => response.json())
  .then(countriesJson => {
    countries = countriesJson;
    console.log("Countries.json loaded!");
  })
  .catch(error => {
    console.error('Countries.json error: ', error);
  });

function getFlagCssCode(countryName) {
    for (let index = 0; index < countries.length; index++) {
        country = countries[index];
        if(country.Name == countryName)
            return country.flag;
    }
    return "";
}

function addToDiv(div, htmlClass) {
    console.log("html class is " + htmlClass);
    if(htmlClass == "") div.parentNode.removeChild(div);
    else div.classList.add(htmlClass);
}


/**
 * Get user's information and display them
 * @returns {Promise<void>}
 */
async function init() {
    let data = (await getStats());
    setElo(data.elo);
    setUserInfos();
    setStats(data);
}