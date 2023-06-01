document.addEventListener('DOMContentLoaded', init, false);

/**
 * Get the best players in the database and display them
 * @returns {Promise<void>}
 */
async function init() {
    let data = (await getLeaderboard());
    createPlayersDiv(data);
}

async function getLeaderboard(){
    let response = -1;
    const data = {
        id: getUserId(),
        token: getTokenFromCookie()
    }

    response = await fetch("http://13.38.147.141/api/leaderboard", {
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

function createPlayersDiv(data) {
    // Récupérer le parent avec l'id "container"
    let containerDiv = document.getElementById("container");

// Boucle à travers les données
    for (let i = 0; i < data.length; i++) {
        // Créer une nouvelle div avec la classe "container-player"
        let containerPlayerDiv = document.createElement("div");
        containerPlayerDiv.classList.add("container-player");
        if(i == 0) containerPlayerDiv.classList.add("first");
        if(i == 1) containerPlayerDiv.classList.add("second");
        if(i == 2) containerPlayerDiv.classList.add("third");

        // Créer les enfants de la div "container-player"
        let rankChildDiv = document.createElement("div");
        rankChildDiv.classList.add("rank-child");
        let rankImage = document.createElement("img");

        if(i == 0)
            rankImage.classList.add("first-img");
        else if(i == 1)
            rankImage.classList.add("second-img");
        else if(i == 2)
            rankImage.classList.add("third-img");
        else rankImage.classList.add("small-image");
        let rankImg = (Math.floor(data[i].elo / 500) * 500)
        rankImage.src = "../resources/rank/" + (rankImg >= 3000 ? 3000 : rankImg)  + ".webp";
        rankChildDiv.appendChild(rankImage);

        let smallChildDiv1 = document.createElement("div");
        smallChildDiv1.classList.add("small-child");
        let eloP = document.createElement("p");
        eloP.textContent = data[i].elo;
        smallChildDiv1.appendChild(eloP);

        let bigChildDiv = document.createElement("div");
        bigChildDiv.classList.add("big-child");
        let usernameP = document.createElement("p");
        usernameP.textContent = data[i].username;
        bigChildDiv.appendChild(usernameP);

        let smallChildDiv2 = document.createElement("div");
        smallChildDiv2.classList.add("small-child");
        let winsP = document.createElement("p");
        winsP.textContent = data[i].wins;
        smallChildDiv2.appendChild(winsP);

        let smallChildDiv3 = document.createElement("div");
        smallChildDiv3.classList.add("small-child");
        let losesP = document.createElement("p");
        losesP.textContent = data[i].loses;
        smallChildDiv3.appendChild(losesP);

        // Ajouter les enfants à la div "container-player"
        containerPlayerDiv.appendChild(rankChildDiv);
        containerPlayerDiv.appendChild(smallChildDiv1);
        containerPlayerDiv.appendChild(bigChildDiv);
        containerPlayerDiv.appendChild(smallChildDiv2);
        containerPlayerDiv.appendChild(smallChildDiv3);

        // Ajouter la div "container-player" au parent avec l'id "container"
        containerDiv.appendChild(containerPlayerDiv);
    }
}
