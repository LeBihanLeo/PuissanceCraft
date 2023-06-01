function validateUsername(username) {
    // 3 à 15 caractères, seulement des lettres et chiffres
    const pattern = /^[a-zA-Z0-9]{3,15}$/;
    return pattern.test(username);
}

function validateMail(email) {
    // format email classique
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email);
}

function validatePassword(password) {
    // 6 caractères minimum
    const pattern = /^.{6,}$/;
    return pattern.test(password);
}

module.exports = {
    validateMail: validateMail,
    validateUsername: validateUsername,
    validatePassword: validatePassword
};