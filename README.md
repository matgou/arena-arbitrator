# arena-arbitrator

Ceci est une application JS permettant de confronter plusieurs intelligences artificielles.

Les intelligences artificielles sont les joueurs d'un jeux dont les règles sont proches du football.
Chaque joueur doit inscrire le maximum de but à l'aide des ballons présents dans l'arène et éviter de prendre des buts

## Le jeux

L'application lance en tant que sous-process les IAs qui sont spécifiées dans le fichier de configuration et dialogue avec elles via l'entrée et la sortie standard.
Un robot d'exemple est fourni avec l'application "exemple/Bot2.rb".

A l'initialisation le robot doit lire sur son entrée standard un entier correspondant à l'ID du joueur piloté par l'IA.
Ensuite pour chaque tour de jeu il sera inscrit sur l'entrée standard :
* le nombre d'entité en jeux (ballons, joueurs, )
* une ligne par entité présente contenant les informations suivantes (séparé par des espaces):
    * entity_id : l'identifiant numérique de l'entité
    * entity_type : PLAYER pour indiqué que l'entité est un joueur, BALL un ballon, GOAL un but.
    * x : la coordonné X de l'entité
    * y : la coordonné Y de l'entité
    * status : 1 si l'entité est en possession de la balle et 0 sinon

En retour le robot doit inscrire une des commandes suivantes :
* "MOVE x y" avec x et y des coordonnés numérique pour ordonner au joueur de se déplacer
* "PUSH x y" avec x et y des coordonnés numérique pour ordonner au joueur de lancer la balle (si son statut est 1)

## Compilation
Pour préparer un premier lancement du jeux installez les dépendances javascript avec la commande suivante :

    npm install

## Lancement
L'application se lance à l'aide de la commande suivante et produit un fichier out.json contenant le score de chaque joueurs.

On lance l'application via la commande :
    node index.js

Une fois lancé l'application "affiche" la partie en direct sur une page web accessible via http://127.0.0.1:PORT ou PORT est renseigné dans le fichier de configuration.

## Configuration

Voici le contenu d'un fichier de configuration permettant de lancer une partie avec 2 joueurs dans une arène de 30 ballons.

Chacun des joueurs est identifié de façon unique par "name" et il est indiqué à l'application la commande qu'il faut exécuter pour lancer l'IA. Ici on lance la commande "ruby Bot2.rb" dans le répertoire exemple.

    {
    	"port": 8080,
    	"balls": 30,
    	"players": [{
    		"name": "player1",
    		"cmd": "ruby Bot2.rb",
    		"cwd": "exemple"
    	}, {
    		"name": "player2",
    		"cmd": "ruby Bot2.rb",
    		"cwd": "exemple"
    	}]
    }
