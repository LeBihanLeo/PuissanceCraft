document.addEventListener('DOMContentLoaded', init, false);

function init(){
    document.getElementById("loginButton").addEventListener("click", sendLoginRequest);
}

/**
 * Send a login request to the server.
 * If the login is successful, the user JWT is stored to the cookie.
 */
function sendLoginRequest() {
    const values = {
        mail: document.getElementById("loginMail").value,
        password: document.getElementById("loginPassword").value
    }

    fetch("http://13.38.147.141/api/login", {
        method: "post",
        headers: {
            'Accept': 'application/json'
        },
        body: JSON.stringify(values)
    }).then(async response => {
            if (response.ok) {
                let data = await response.json();
                console.log("Data from response", data);
                console.log("Decoded token", decodeJWT(data.token))
                storeTokenInCookie(data.token);
                window.location.replace("../index.html");
            }
            else {
                console.log(response)
                let errorMsg = document.getElementById("errorLogin");
                errorMsg.classList.remove("hidden");
                errorMsg.innerText = await response.text();
            }
        });
}

/**
 * For a given token, store it to the client cookie
 * @param token
 */
function storeTokenInCookie(token) {
    document.cookie = "jwt=" + token + ";path=/;";
}