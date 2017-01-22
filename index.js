// ******************************************************************
// Generic configuration
// ******************************************************************

var configuration = require('./config.json')

const NB_PLAYER=configuration.players.length;
const NB_BALL=configuration.balls;

// bot cmd
var cmd_player = Array();
var cwd_player = Array();
for(var i = 0; i < NB_PLAYER; i +=1) {
  cmd_player.push(configuration.players[i].cmd);
  cwd_player.push(configuration.players[i].cwd);
}
const PORT=configuration.port; //Lets define a port we want to listen to
const WORLD_WIDTH=1024;
const WORLD_HEIGHT=1024;
// ******************************************************************

// ******************************************************************
// Include and general declaration
// ******************************************************************
var Matter = require('matter-js');
var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var url = require('url');
var deasync = require('deasync');
var cp = require('child_process');
util = require("util");

app.listen(PORT);
console.log("Service OK : http://localhost:" + PORT + "/index.html");

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Events = Matter.Events,
    Body = Matter.Body,
    Bodies = Matter.Bodies,
    Vector = Matter.Vector,
    Body = Matter.Body,
	Composite = Matter.Composite,
	Common = Matter.Common;

var engine = Engine.create(); // create an engine
var frame = new Array();
var goals = new Array();
var score = new Array();
// ******************************************************************

// ******************************************************************
// Socket client
// ******************************************************************
io.on('connection', function(socket) {
	console.log("New socket connection : id=" + socket.id);
	socket.emit('message', frame[0]);
	//console.log('message', frame[iteration]);
	socket.on('get', function(data) {
		var iteration = 0;
		if(data.frameId < (frame.length - 1)) {
			iteration = data.frameId;
		} else {
			iteration = frame.length - 1;
		}
		socket.emit('message', frame[iteration]);
		//console.log('message', frame[iteration]);
	});
});
// ******************************************************************

// ******************************************************************
// Serve index.html
// ******************************************************************
function handler (req, res) {
  var request = url.parse(req.url, true);
  var action = request.pathname;
  console.log("action GET " + action);
  if (action == '/img/player.png') {
     var img = fs.readFileSync('./img/player.png');
     res.writeHead(200, {'Content-Type': 'image/png' });
     res.end(img, 'binary');
  } else if (action == '/img/ball.png') {
     var img = fs.readFileSync('./img/ball.png');
     res.writeHead(200, {'Content-Type': 'image/png' });
     res.end(img, 'binary');
  } else {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
  }
}
// ******************************************************************

// ******************************************************************
// World Computation
// ******************************************************************
function WorldAsTring () {
  var frame = {};
  var world = {};
  world.width = WORLD_WIDTH
  world.height = WORLD_HEIGHT
  world.players = Array();
  for(var i = 0; i < players.length; i++) {
    var player = {};
    player.x = players[i].position.x;
    player.y = players[i].position.y;
    player.name = configuration.players[i].name;
    world.players.push(player);
  }
  world.balls = Array();
  for(var i = 0; i < balls.length; i++) {
    var ball = {};
    ball.x = balls[i].position.x;
    ball.y = balls[i].position.y;
    world.balls.push(ball);
  }
  world.goals = goals;
  world.score = score;
  frame.world = world;
  console.log(world);

  return JSON.stringify(frame);
	/*var bodies = Composite.allBodies(engine.world);
	string = "{\"world\": [";
	for (var i = 0; i < bodies.length; i += 1) {
        var vertices = bodies[i].vertices;
		if(i != 0) {string = string + ",";}
		string = string + "[";
		for (var j = 0; j < vertices.length; j += 1) {
			if(j != 0) {string = string + ",";}
			string = string + "{\"x\":" + vertices[j].x + ", \"y\":" + vertices[j].y + "}";
		}
		string = string + "]";
	}
		string = string + "]}";
	return string;*/
}

function getBallFor(playerId) {
	ball_return = null
	player = players[playerId];
	for(var j = 0; j < balls.length; j +=1) {
		ball = balls[j];
		distance = Vector.magnitude(Vector.sub(ball.position, player.position));
		if(distance < 30) {
			ball_return = ball
		}
	}
	return ball_return;
}

function updateScore(goalIndex) {
  for(var i=0; i < score.length; i++) {
    if(i != goalIndex) {
      score[i] = score[i] + 1;
    }
  }
}

//Disable gravity :
engine.world.gravity.y = 0;

// Create world borders
var ground_up = Bodies.rectangle(WORLD_WIDTH/2, 3, WORLD_WIDTH - 3 * 2, 3, { isStatic: true });
var ground_down = Bodies.rectangle(WORLD_WIDTH/2, WORLD_HEIGHT - 3, WORLD_WIDTH - 3 * 2, 3, { isStatic: true });
var ground_left = Bodies.rectangle(3, WORLD_HEIGHT/2, 3, WORLD_HEIGHT - 3 * 2, { isStatic: true });
var ground_right = Bodies.rectangle(WORLD_WIDTH - 3, WORLD_HEIGHT/2, 3, WORLD_HEIGHT - 3 * 2, { isStatic: true });
World.add(engine.world, [ground_up, ground_down, ground_left, ground_right]);

var centerVector = Vector.create(WORLD_WIDTH/2, WORLD_HEIGHT/2);

// create Balls
var ball1 = Bodies.circle(WORLD_WIDTH/2, WORLD_HEIGHT/2, 5, { density: 1, frictionAir: 0.05});
ball1.isBall=true;
ball1.ballIndex = 0;
var balls = Array();
balls.push(ball1);
console.log("Ball0: x=" + WORLD_WIDTH/2 + ", y=" + WORLD_HEIGHT/2);
vector = Vector.create(WORLD_WIDTH/2 + Common.random(-500, 500), WORLD_HEIGHT/2 + Common.random(-500, 500));
for(var i = 0; i < (NB_BALL - 1); i += 1) {
  var position = Vector.rotateAbout(vector, i * 2 * Math.PI / NB_PLAYER, centerVector);
  ball = Bodies.circle(position.x, position.y, 16, { density: 0.04, frictionAir: 0.05, inertia: Infinity });
  balls.push(ball);
  console.log("Ball" + i + ": x=" + position.x + ", y=" + position.y);
  ball.isBall=true;
  ball.ballIndex = i +1;
}
World.add(engine.world, balls);

// create Players
var nbResponse = 0;
var players = Array();
var processArray = Array();
for(var i = 0; i < NB_PLAYER; i += 1) {

  vector = Vector.create(WORLD_WIDTH - 100, WORLD_HEIGHT/2);
  vector_goal = Vector.create(WORLD_WIDTH-5, WORLD_HEIGHT/2);
  var position = Vector.rotateAbout(vector, i * 2 * Math.PI / NB_PLAYER, centerVector);
  var position_goal = Vector.rotateAbout(vector_goal, i * 2 * Math.PI / NB_PLAYER, centerVector);

  var player = Bodies.rectangle(position.x, position.y, 20, 20, { density: 1, frictionAir: 0.05});
  var goalPlayer = Bodies.rectangle(position_goal.x, position_goal.y, 4, 100, { isStatic: true });
  angle = i * 2 * Math.PI / NB_PLAYER;
  Body.rotate(goalPlayer, angle);

  goals.push({'x': position_goal.x, 'y':position_goal.y, 'angle': angle});
  score.push(0);
  goalPlayer.isGoal=true;
  goalPlayer.goalIndex = i
  World.add(engine.world, [goalPlayer]);
  // var playerB = Bodies.rectangle(1024-50, 1024/2, 20, 20, { density: 0.04, frictionAir: 0.05});
  console.log("Player" + i + ": x=" + position.x + ", y=" + position.y);

  players.push(player);
  console.log("Executing : '" + cmd_player[i] + "' in diretory '" + cwd_player[i] + "'");
  var proc = cp.exec(cmd_player[i],{ cwd: cwd_player[i] }, function(error, stdout, stderr) {
    if (error) {
      console.error(`exec ${i} error: ${error}`);
      process.exit(1);
    }
  }.bind(i));
  if(proc.connected) {
    proc.stdin.write(i + "\n");
  }
  proc.stderr.on('data', function(data,  p) {
    console.log("pid STDERR : " + this + " :" + data);
  }.bind(i));
  proc.stdout.on('data', function(data,  p) {
    str = data.split(" ");
    console.log("pid STDOUT : " + this + " x=" + str[1] + ",y=" + str[2]);
    nbResponse += 1;
	if(str[0] == "MOVE") {
		dest = Vector.create(str[1], str[2]);
		direction = Vector.sub(dest, players[this].position);
		size_direction = Vector.magnitude(direction)
		velocity = Vector.mult(Vector.div(direction, size_direction), 10);
		Body.setVelocity(players[this], {
		  x: velocity.x,
		  y: velocity.y
		});
	}
	else if(str[0] == "PUSH") {
		ball=getBallFor(this);
		if(ball != null) {
			dest = Vector.create(str[1], str[2]);
			direction = Vector.sub(dest, players[this].position);
			direction = Vector.sub(dest, players[this].position);
			size_direction = Vector.magnitude(direction)
			velocity = Vector.mult(Vector.div(direction, size_direction), 15);
			Body.setVelocity(ball, {
			  x: velocity.x,
			  y: velocity.y
			});
		} else {
			console.error(`exec ${i} error: No ball to push`);
		}
	} else {
		console.error(`exec ${i} error: Invalid response`);
		process.exit(1);
	}
  }.bind(i));

  processArray.push(proc);
  proc.stdin.write("" + i + "\n");
}
nbResponse = 0;
World.add(engine.world, players);


for(var i = 0; i <= 1000; i += 1) {
  console.log("-------- Iteration " + i + "-------------------");
	Matter.Events.trigger(engine, 'tick', { timestamp: engine.timing.timestamp });
	Matter.Engine.update(engine, engine.timing.delta);
	Matter.Events.trigger(engine, 'afterTick', { timestamp: engine.timing.timestamp });
	Events.on(engine, 'collisionActive', function(event) {
		var pairs = event.pairs;
		for (var i = 0; i < pairs.length; i++) {
			var pair = pairs[i];
			if(pair.bodyA.isGoal && pair.bodyB.isBall) {
				//console.log("colision with : " + util.inspect(pair, null, 4))
				console.log("Goal ! " + pair.bodyA.ballIndex);
				if (balls.indexOf(pair.bodyB) != -1) {
					console.log("Goal ! ");
					World.remove(engine.world, [pair.bodyB]);
					for(var j=0; j< balls.length; j++) {
            if(balls[j].ballIndex == pair.bodyB.ballIndex) {
              balls.splice(j, 1);
            }
          }
					console.log("Player = " + pair.bodyA.goalIndex);
          updateScore(pair.bodyA.goalIndex);
					//process.exit(0);
				}
			}
			if(pair.bodyB.isGoal && pair.bodyA.isBall) {
				//console.log("colision with : " + util.inspect(pair, null, 4))
				console.log("Goal ! " + pair.bodyA.ballIndex);
				if (balls.indexOf(pair.bodyA) != -1) {
					World.remove(engine.world, [pair.bodyA]);
          for(var j=0; j< balls.length; j++) {
            if(balls[j].ballIndex == pair.bodyA.ballIndex) {
              balls.splice(j, 1);
            }
          }
          console.log("Player = " + pair.bodyB.goalIndex);
          updateScore(pair.bodyB.goalIndex);
					//process.exit(0);
				}
			}
		}
	});
  if(balls.length <= 0) {
	   console.log(" End of Game -----------------------");
     fs.writeFile("out.json", JSON.stringify(score), function(err) {
       if(err) {
        return console.log(err);
       }

       console.log("The file was saved!");
     });
	break;
  }
  // EnvToString
  var environnementStr = "" + (balls.length + players.length + goals.length) + "\n";
  for (var j = 0; j < balls.length; j +=1) {
    ball = balls[j];
	environnementStr += j + " BALL " + " " + Math.round(ball.position.x) + " " + Math.round(ball.position.y) + " 1\n";
  }
  for (var j = 0; j < players.length; j +=1) {
    player = players[j];
	  if(getBallFor(j) != null) {
		    environnementStr += j + " PLAYER " + " " + Math.round(player.position.x) + " " + Math.round(player.position.y) + " 1\n";
	  } else {
		    environnementStr += j + " PLAYER " + " " + Math.round(player.position.x) + " " + Math.round(player.position.y) + " 0\n";
	  }
  }
  for (var j = 0; j < goals.length; j += 1) {
    environnementStr += j + " GOAL " + " " + Math.round(goals[j].x) + " " + Math.round(goals[j].y) + " 0\n";
  }
  console.log(environnementStr);

  for (var j = 0; j < players.length; j +=1) {
    player = players[j];
    pid = processArray[j];
      pid.stdin.write(environnementStr);
  }
  deasync.loopWhile(function(){
    if(nbResponse < players.length) {
        return true;
    }
    return false;
  });
  nbResponse = 0;
  console.log(environnementStr);
	// Serialize world
	frame.push(WorldAsTring());
}
// ******************************************************************
