require "logger"
STDOUT.sync = true # DO NOT REMOVE

# Grab Snaffles and try to throw them through the opponent's goal!
# Move towards a Snaffle and use your team id to determine where you need to throw it.

class Entity
    def initialize(type, x, y, state)
        @type = type
		@x = x
		@y = y
		@state = state
    end
	def type
		return @type
	end
	def x
		return @x
	end
	def y
		return @y
	end
	def state
		return @state
	end
end

def distance(objet1, objet2)
	diff_x = objet1.x - objet2.x
	diff_y = objet1.y - objet2.y
	return Math.sqrt(diff_x ** 2 + diff_y ** 2)
end

def objetPlusProche(reference, liste_objets)
	distance_min = -1
	return_objet = nil
	for objet in liste_objets.each
		distance = distance(reference, objet);
		if(distance < distance_min || distance_min < 0)
			distance_min = distance
			return_objet = objet
		end
	end
	return return_objet
end

@my_team_id = gets.to_i # if 0 you need to score on the right of the map, if 1 you need to score on the left
logger = Logger.new(fileName = "bot" + Process.pid.to_s + ".log")
logger.info sprintf("Bot : %d", Process.pid)
logger.info sprintf("My team = %d", @my_team_id)
goal=nil
# game loop
loop do
    entities = gets.to_i # number of entities still in game
	balls = []
  goals = []
	me = nil
	opp = nil
    entities.times do
        # entity_id: entity identifier
        # entity_type: "PLAYER", "OPPONENT_PLAYER" or "BALL"
        # x: position
        # y: position
        # state: 1 if the player is holding a ball
        entity_id, entity_type, x, y, state = gets.split(" ")
        entity_id = entity_id.to_i
        x = x.to_i
        y = y.to_i
        state = state.to_i
    		#$stderr.puts entity_type + " " + x + " " + y + " " state
    		logger.debug sprintf("DEBUG: %d %s %d %d %d\n", entity_id, entity_type, x, y, state)
    		if entity_type == "PLAYER" && entity_id == @my_team_id
    			#printf("DEBUG: me est valorise\n")
    			me = Entity.new(entity_type, x, y, state);
    		elsif entity_type == "PLAYER"
    			#printf("DEBUG: opp est valorise\n")
    			opp = Entity.new(entity_type, x, y, state);
    		elsif entity_type == "BALL"
    			#printf("DEBUG: balls est valorise\n")
    			balls.push(Entity.new(entity_type, x, y, state));
        elsif entity_type == "GOAL"
          if(entity_id != @my_team_id)
            goals.push(Entity.new(entity_type, x, y, state));
          end
        end
    end
  goal = objetPlusProche(me, goals);
	closestBall = objetPlusProche(me, balls);
	if(me.state == 0)
		printf("MOVE %d %d\n", closestBall.x, closestBall.y)
	else
		printf("PUSH %d %d\n", goal.x, goal.y)
	end
	logger.info sprintf("MOVE %d %d\n", closestBall.x, closestBall.y);
end
