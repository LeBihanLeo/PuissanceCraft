document.addEventListener('DOMContentLoaded', init, false);

function init(){

}

async function loadSave(){
    const body = {
        userId: getUserId(),
    }

    let response =  await fetch("http://13.38.147.141/api/games/load", {
        method: "post",
        headers: {
            'Accept': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(async (response) => {
        let data = await response.json();
        console.log("Data receive : ", data);
        return data;
    });
    return response;
}

function saveGame(doAiPlayFirst){
    const body = {
        userId: getUserId(),
        gameInformation: gameInformation,
    }

    fetch("http://13.38.147.141/api/games/save", {
        method: "post",
        headers: {
            'Accept': 'application/json'
        },
        body: JSON.stringify(body)
    }).then((response) => {
        if(response.status == 200)  window.location.replace("/");
        else{
            console.log(response)
        }
    });
}