const buttonSound = new Audio('../resources/sounds/button-sound.mp3');
document.addEventListener('DOMContentLoaded', loadButtonSounds, false);

/**
 * Add a sound to every button on the html page
 */
function loadButtonSounds(){
    let buttons = document.getElementsByClassName("button");
    for(let i = 0 ; i < buttons.length ; i++)
        buttons[i].addEventListener("click", () => buttonSound.play());
}