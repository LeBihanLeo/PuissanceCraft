document.addEventListener('DOMContentLoaded', init, false);

function init(){
    document.getElementById("signupButton").addEventListener("click", sendSignUpRequest);
}

function sendSignUpRequest() {

    const values = {
        mail: document.getElementById("signupMail").value,
        username: document.getElementById("signupUsername").value,
        password: document.getElementById("signupPassword").value,
    }

    fetch("http://13.38.147.141/api/signup", {
        method: "post",
        headers: {
            'Accept': 'application/json'
        },
        body: JSON.stringify(values)
    }).then(async (response) => {
        if (response.status === 201) window.location.replace("/html/login.html");
        else {
            console.log(response)
            let errorMsg = document.getElementById("errorSignup");
            errorMsg.classList.remove("hidden");
            errorMsg.innerText = await response.text();
        }
    });
}