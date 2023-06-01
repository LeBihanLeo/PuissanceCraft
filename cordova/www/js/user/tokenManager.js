/**
 * Reading the token from the cookie
 * @returns {string}
 */
function getTokenFromCookie() {
    let key = "jwt=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let cookieArray = decodedCookie.split(';');

    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(key) === 0) {
            return cookie.substring(key.length, cookie.length);
        }
    }
}

/**
 * For a given Json Web token, decode the payload and return the decoded payload as a json.
 * @param token The token to decode
 * @returns {any}
 */
function decodeJWT(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

/**
 * Return the id of the user, if he is logged, it's his id, else it's a random id.
 * @returns {*|number}
 */
function getUserId(){
    let jwt = getTokenFromCookie();

    if(!jwt)
        return Date.now();

    let token = decodeJWT(jwt);
    return token['id'];
}

/**
 * Return the username of the user, if he is logged, it's his id, else it's a random id.
 * @returns {*|string}
 */
function getUsername(){
    let jwt = getTokenFromCookie();

    if(!jwt)
        return Date.now();

    let token = decodeJWT(jwt);
    return token['username'];
}