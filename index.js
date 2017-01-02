// ******************************************************************
// Generic configuration
// ******************************************************************
const PORT=8080; //Lets define a port we want to listen to
const WORLD_WIDTH=1024;
const WORLD_HEIGHT=1024;
var configuration = require('./config.json')

const NB_PLAYER=configuration.players.length;
const NB_BALL=NB_PLAYER + 1;

// bot cmd
var cmd_player = Array();
var cwd_player = Array();
for(var i = 0; i < NB_PLAYER; i +=1) {
  cmd_player.push(configuration.players[i].cmd);
  cwd_player.push(configuration.players[i].cwd);
}
// ******************************************************************

// ******************************************************************
// Include and general declaration
// ******************************************************************
var Matter = require('matter-js');
var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var deasync = require('deasync');
var cp = require('child_process');

app.listen(PORT);
console.log("Service OK : http://localhost:" + PORT + "/index.html");

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Body = Matter.Body,
    Bodies = Matter.Bodies,
    Vector = Matter.Vector,
	Composite = Matter.Composite,
	Common = Matter.Common;

var engine = Engine.create(); // create an engine
var frame = new Array();
// ******************************************************************

// ******************************************************************
// Socket client
// ******************************************************************
io.on('connection', function(socket) {
	console.log("New socket connection : id=" + socket.id);
	var iteration = 0;
	socket.emit('message', frame[iteration]);
	//console.log('message', frame[iteration]);
	socket.on('next', function(data) {
		if(iteration < (frame.length - 1)) {
			iteration += 1;
		}
		socket.emit('message', frame[iteration]);
		//console.log('message', frame[iteration]);
	});
	socket.on('previus', function(data) {
		if(iteration > 0) {
			iteration -= 1;
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
// ******************************************************************

// ******************************************************************
// World Computation
// ******************************************************************
function WorldAsTring () {
	var bodies = Composite.allBodies(engine.world);
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
	return string;
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

//Disable gravity :
engine.world.gravity.y = 0;

// Create world borders
var ground_up = Bodies.rectangle(WORLD_WIDTH/2, 10, WORLD_WIDTH - 10 * 2, 10, { isStatic: true });
var ground_down = Bodies.rectangle(WORLD_WIDTH/2, WORLD_HEIGHT - 10, WORLD_WIDTH - 10 * 2, 10, { isStatic: true });
var ground_left = Bodies.rectangle(10, WORLD_HEIGHT/2, 10, WORLD_HEIGHT - 10 * 2, { isStatic: true });
var ground_right = Bodies.rectangle(WORLD_WIDTH - 10, WORLD_HEIGHT/2, 10, WORLD_HEIGHT - 10 * 2, { isStatic: true });
World.add(engine.world, [ground_up, ground_down, ground_left, ground_right]);

// create Players
var nbResponse = 0;
var players = Array();
var processArray = Array();
var centerVector = Vector.create(WORLD_WIDTH/2, WORLD_HEIGHT/2);
for(var i = 0; i < NB_PLAYER; i += 1) {
  vector = Vector.create(WORLD_WIDTH - 100, WORLD_HEIGHT/2);
  var position = Vector.rotateAbout(vector, i * 2 * Math.PI / NB_PLAYER, centerVector);

  var player = Bodies.rectangle(position.x, position.y, 20, 20, { density: 0.04, frictionAir: 0.05});
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
			velocity = Vector.mult(Vector.div(direction, size_direction), 80);
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


// create Balls
var ball1 = Bodies.circle(WORLD_WIDTH/2, WORLD_HEIGHT/2, 5, { density: 0.04, frictionAir: 0.05});
var balls = Array();
balls.push(ball1);
console.log("Ball0: x=" + WORLD_WIDTH/2 + ", y=" + WORLD_HEIGHT/2);
vector = Vector.create(WORLD_WIDTH/2 + Common.random(-500, 500), WORLD_HEIGHT/2 + Common.random(-500, 500));
for(var i = 0; i < (NB_BALL - 1); i += 1) {
  var position = Vector.rotateAbout(vector, i * 2 * Math.PI / NB_PLAYER, centerVector);
  balls.push(Bodies.circle(position.x, position.y, 5, { density: 0.04, frictionAir: 0.05}));
  console.log("Ball" + i + ": x=" + position.x + ", y=" + position.y);
}
World.add(engine.world, balls);

for(var i = 0; i <= 100; i += 1) {
  console.log("-------- Iteration " + i + "-------------------");
	Matter.Events.trigger(engine, 'tick', { timestamp: engine.timing.timestamp });
	Matter.Engine.update(engine, engine.timing.delta);
	Matter.Events.trigger(engine, 'afterTick', { timestamp: engine.timing.timestamp });

  // EnvToString
  var environnementStr = "" + (balls.length + players.length) + "\n";
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
