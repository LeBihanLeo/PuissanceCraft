document.addEventListener('DOMContentLoaded', init, false);
var currentColor = "R"

function init(){
    console.log("---page loaded---");
    let board = document.getElementById("board");
    board.addEventListener("click", color);
}


function initGrid(){  
    var parent = document.getElementById('div');
    parent.insertAfter(link, parent.firstChild);

    let board = document.getElementById("board");
    for(let i = 0 ; i < 6 ; i++){
        for(let k = 0 ; k < 7 ; k++){
            var link = document.createElement('a');
            link.setAttribute('href', 'mypage.htm');
        }
    }
}


