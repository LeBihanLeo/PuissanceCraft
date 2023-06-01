document.addEventListener('DOMContentLoaded', init, false);

function init(){
    let logout = document.getElementById("logout");
    logout.addEventListener("click", () =>{
        document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.reload();
        localStorage.clear();
    });

    let token = getTokenFromCookie();
    if(!token) return;

    let login = document.getElementById("login");
    login.classList.add("hidden");
    logout.classList.remove("hidden");
}
