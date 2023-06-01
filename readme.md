<h1 align="center">
  🔴 PS8 - PuissanceCraft 🟡
</h1>

The code of this repo is split in 2 folders:
* api/ manages the server. It contains a server which differentiate REST requests from HTTP file requests, and so
return either files or REST responses accordingly.
* front/ contains static files that should be returned by the HTTP server mentioned earlier.

Both folders contain a README with more details.

---

## Requirements to run the project

* The repo should have been cloned.
* [Docker](https://www.docker.com/) should be installed.

---

## 👨‍💻 Run the project

Run docker then run the following command at the root of the project:
<br>
On linux:
```bash
./run.sh
```
On windows:
```bash
./run.bat
```
Then go to "http://localhost:8000/" and enjoy!

---
# Flow of the application
## 🏠 Home
From the homepage, several actions are available:
* Play locally, this mode does not require to connect to the site
* Play online, you need to connect to the site
* View your profile, you need to connect to the site
* Login and logout


## 👤 Part of the application not requiring a connection to the site:
The part of the application named "Local game" has 2 game modes:
* The 1 vs 1 local mode, so 2 players play on the same computer.
* 1 vs AI mode, 1 player plays against the site's AI

In these two game modes, the player can save the state of the game if he wants to continue it later.
When he saves a game, it will appear in the "Local game" menu.

In this menu, the player has 2 possibilities:
* Resume a game already started on this computer
* Create a new game
When the player chooses to create a game, he can name the game and choose the game mode (1 vs 1 or 1 vs IA)


## 👥 Part of the application that requires connecting to the site:
### Connecting to the site
In order to play in the "Multiplayer" mode, to consult his profile, to add friends or to chat, the player must log in, to do this, he uses the "Login" button on the home page. Afterwards, it is a classic form, the user can connect with his email and password. If he forgot his password, he can click on "Forgot password?" and indicate his email, he will receive a message to redefine his password.

If the user does not have an account, he can click on the text "new here? create an account before login!", he will be redirected to a registration form, in which he will fill in the following information:
* Username
* Email
* Password

### Multiplayer mode
The user now connected can consult his profile in order to modify his personal information, but also define his profile picture. Moreover, he can now access the multiplayer mode. At first, the player will join a queue, then when an opponent is found, the game can start. If the player wants to leave the queue in order to return to the homepage, he can do so by using the "Return to menu" button, which will be available until an opponent is found.


### Social
Throughout the site, if the player is logged in, he can access two tabs:
* The notification tab, where one receives friend invitation requests, and game invitation requests
* The social tab, where you can see your friends connected and disconnected, chat with them, invite them to a game and add friends


## 🕹️ The power of 4
Once the player has found an opponent (online, local or AI), he/she can start the Power 4 game. On the game page, different information is available:
* Who should play
* The time elapsed since the beginning of the game
* The time left to play (60 seconds maximum per turn)
* The global score of the players (number of victories of each player, within the duel if the two players make several games in a row)

Moreover, in local mode, the player can save his game with the "Save game" button, and whether it is online or local, he can also quit it with the "Quit game" button. Finally, in the multiplayer mode, the 2 players can chat through the game chat.

At the end of a game, the winning player is indicated, the player's score is updated, and players are offered to restart a game (which will be against the same opponent) or to return to the menu.
