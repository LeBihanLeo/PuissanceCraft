# PuissanceCraft
## Accueil
Depuis l'accueil plusieurs actions sont disponibles:
* Jouer en Local, ce mode de jeu ne necessite pas une connection 
* Jouer en multi, nécessite une connection
* Consulter son profil, nécessite une connection
* Se connecter / Se deconnecter

## Partie de l'application sans connection:
La partie de l'application nommée "Local game" comporte 2 modes de jeu:
* Le mode 1vs1 local, donc 2 joueurs jouent sur le même ordinateur
* Le mode 1vsIA, 1 joueur joue contre l'IA
Dans ces deux modes de jeu, le joueur peut s'il le souhaite sauvegarder l'état de la partie afin de la continuer ultérieurement.
Lorsqu'il sauvegarde une partie, cette dernière va apparaitre dans le menu "Local game".
Dans ce menu le joueur a donc 2 possibilités:
* Reprendre une partie déjà commencée
* Créé une nouvelle partie
Lorsque le joueur choisit de créer une partie, il peut nommer la partie et choisir le mode jeu (1vs1 ou 1vsIA)


## Partie de l'application avec connection:
### Connection
Afin de jouer au mode "Multiplayer" et de consulter son profil, le jouer doit se connecter, pour ca il utilise le bouton "Login". Par la suite, c'est un formulaire classique, l'utilisateur peut se connecter avec son email et mot de passe, s'il a oublié son mot de passe, il peut cliquer sur "Forgot password?", il recevra un mail afin de redéfinir son mot de passe. 
Si l'utilisateur n'a pas de compte, il peut cliquer sur le texte "new here? create a account before login!", il sera redirigé vers un formulaire d'inscription, dans lequel il va remplir les informations suivantes:
* Pseudo
* Email
* Password

### Mode multijoueur
L'utilisateur maintenant connecté peut consulter son profil afin de modifier ses informations personnels mais aussi définir son Avatar. De plus il peut maintenant accéder au mode multijoueur. Dans un premier temps le joueur va rejoindre une file d'attente, puis lorsqu'un adversaire sera trouvé la partie pourra commencer. Si le joueur souhaite quitter la file d'attente afin de revenir à l'accueil, il peut le faire en utilisant le bouton "Return to menu", qui sera disponible jusqu'à ce qu'un adversaire soit trouvé.


### Social
Partout sur le site, si le joueur est connecté il peut accéder à deux onglets:
* L'onglet notification, ou l'on recoit les demandes d'amis, et les demandes de partie
* L'onglet social, on peut y voir nos amis, dialoguer avec eux à travers un chat, et faire des demandes d'amis.


## Le puissance 4
Une fois que le joueur à trouvé un adversaire (en ligne, en local ou l'IA), il va donc pouvoir commencer la partie de puissance 4. Sur la page de la partie, différentes informations sont disponibles:
* Qui doit jouer
* Le temps écoulé depuis le début de la partie
* Le temps restant pour jouer (60sec max par tour)
* Le score  global des joueur (nbr de victoire de chaque joueur, au sein du duel)
De plus, en local le joueur peut sauvegarder sa partie avec le bouton "Save game", et que ce soit en ligne ou en local il peut aussi la quitter avec le bouton "Quit game". Enfin, dans le mode multijoueur, les 2 joueurs peuvent discuter à travers le chat.
A la fin d'une partie, le joueur gagant est indiqué, le score du joueur est actualisé, et on propose aux joueurs de relancer une partie (qui sera contre le même adversaire) ou de retourner au menu.
