window.onload = function() {

    /* PIXI.js stage */
    var canvasWidth = window.innerWidth;
    var canvasHeight = window.innerHeight-150;

    // create an new instance of a pixi stage
    var stage = new PIXI.Stage(0x66FF99);
    
    // create a renderer instance
    var renderer = PIXI.autoDetectRenderer( canvasWidth, canvasHeight );
    
    // add the renderer view element to the DOM
    document.body.appendChild(renderer.view);
    
    requestAnimationFrame( animate );
    /* End Stage Creation */

    /* Player object */
    function player(isSelf, name) {

        this.id = null;
        this.name = name;

        // Animation properties
        this.isWalking = false;
        this.isJumping = false;
        this.animationTimeout = null;
        this.walkingFrames = ["dragon_walk_1.png", "dragon_walk_2.png", "dragon_walk_3.png", "dragon_walk_4.png", "dragon_walk_5.png", "dragon_walk_6.png", "dragon_stand_1"];
        this.jumpingFrames = ["dragon_jump_1.png", "dragon_jump_2.png", "dragon_jump_3.png"];
        this.facingRight = true;
        this.facingLeft = false;
        this.gravity = 10;

        // set sprite size
        this.spriteSize = 120;
        this.spriteDirectory = "dragon_sprites";
        this.idleSprite = "dragon_stand_1.png";

        // User manually connecting
        if( isSelf ) {

            this.connect();

        }

    }

    player.prototype = {

        constructor : player,

        createAvatar : function(id, name) {

            // set object id
            this.id = id;

            // create a texture from an image path
            this.texture = PIXI.Texture.fromImage( this.spriteDirectory + "/" + this.idleSprite );

            // create a new Sprite using the texture
            this.bunny = new PIXI.Sprite(this.texture);
            
            // center the sprites anchor point
            this.bunny.anchor.x = 0.5;
            this.bunny.anchor.y = 0.5;
            
            // move the sprite t the center of the screen
            this.bunny.position.x = 15;
            this.bunny.position.y = canvasHeight - ( this.spriteSize / 2 - 10);

            // create label for sprite
            this.namePlate = new PIXI.Text( name ? name : this.name, { font : "12px", fill : "yellow" } );
            this.namePlate.position.y = this.bunny.position.y - 35;
            this.namePlate.position.x = this.bunny.position.x - 15;

            // create hover chat for sprite
            this.chatText = new PIXI.Text( "", { font : "10px", fill : "yellow" });
            this.chatText.position.y = this.bunny.position.y - 45;
            this.chatText.position.x = this.bunny.position.x - 15;
            
            stage.addChild(this.bunny);
            stage.addChild(this.namePlate);
            stage.addChild(this.chatText);

        },

        animateFrames : function(start) {

            var self = this;

            // Check for movement input every tenth of a second
            self.animationTimeout = setInterval(function() {

                // If the user is walking
                if ( self.isJumping ) {

                    if( start > self.jumpingFrames.length - 1 ) {

                        start = self.jumpingFrames.length - 1;

                    }

                    var newFrame = PIXI.Texture.fromImage( self.spriteDirectory + "/" + self.jumpingFrames[start] );
                    self.bunny.texture = newFrame;

                    if( self.bunny.position.y > canvasHeight - ( self.spriteSize / 2 - 10) ) {

                        self.isJumping = false;
                        self.gravity = 0;
                        self.bunny.position.y = canvasHeight - ( self.spriteSize / 2 - 10);
                        self.namePlate.position.y = self.bunny.position.y - 35;
                        self.chatText.position.y = self.bunny.position.y - 45;

                    } else {

                        self.bunny.position.y += self.gravity;
                        self.namePlate.position.y += self.gravity;
                        self.chatText.position.y += self.gravity;
                        self.gravity += 5;
                    }

                    start++;

                } else if( self.isWalking ) {

                    // If the framecount is greater than the number of frames, reset
                    if( start >= self.walkingFrames.length - 1 ) {

                        start = 0;

                    }

                    // Generate a new texture from the current base texture
                    var newFrame = PIXI.Texture.fromImage( self.spriteDirectory + "/" + self.walkingFrames[start] );
                    self.bunny.texture = newFrame;

                    if( self.facingRight ) {

                        self.bunny.scale.x = -1;

                    } else if( self.facingLeft ) {

                        self.bunny.scale.x = 1;

                    }

                    // Increment the base texture count
                    start++;

                } else {

                    // If the user has stopped moving, reset the the idle texture and reset frame count
                    start = 0;
                    var newFrame = PIXI.Texture.fromImage( self.spriteDirectory + "/" + self.idleSprite );
                    self.bunny.texture = newFrame;

                }

            }, 65);

            return;

        },

        moveX : function(value) {

            this.bunny.position.x = value;
            this.namePlate.position.x = value - 10;
            this.chatText.position.x = value - 10;

        },

        connect : function() {

            // Request a new avatar from the server
            socket.emit('userConnect', { stage : "initial", name : this.name });

        }

    }

    // Create Current Player
    var players = new Array();
    var playerScreenName = null;

    // Prompt the user to create a name before connecting
    do {

        playerScreenName = prompt("Please enter a screen name.");
        
        // If a name has been entered, connect and create the player's avatare
        if( playerScreenName && playerScreenName.trim() != '' ) {

            // Create connection to server
            var socket = io.connect('http://localhost:8888');
            // Create player object
            players["self"] = new player(true, playerScreenName);
            players["self"].animateFrames(0);

        }

    } while( playerScreenName.trim() == '' || !playerScreenName );
    
    var left = false, right = false;
    function animate() {
    
        requestAnimationFrame( animate );

        if( right ) {

            players["self"].bunny.position.x += 5;
            players["self"].facingRight = true;
            players["self"].facingLeft = false;
            socket.emit('userInput', { id : players["self"].id, x : players["self"].bunny.position.x, direction : "right" });

        } else if( left ) {

            players["self"].bunny.position.x -= 5;
            players["self"].facingRight = false;
            players["self"].facingLeft = true;
            socket.emit('userInput', { id : players["self"].id, x : players["self"].bunny.position.x, direction : "left" });

        }
        
        // render the stage   
        renderer.render(stage);

    }

    window.onkeydown = function(e) {

        var key = e.keyCode; //? e.keyCode : e.which;

        if (key == 39) {

            // players["self"].bunny.position.x += 5;
            right = true;
            players["self"].isWalking = true;

        } else if (key == 37) {

            // players["self"].bunny.position.x -= 5;
            left = true;
            players["self"].isWalking = true;

        } else if (key == 38) {

            if( !players["self"].isJumping ) {

                players["self"].gravity = -30;
                players["self"].isJumping = true;
                socket.emit('animation', { id : players["self"].id, type : "jump", method : "play" });

            }

        } else if (key == 13) {

            $("#send").trigger("click");

        }

        // socket.emit('userInput', { id : players["self"].id, x : players["self"].bunny.position.x });

    }

    window.onkeyup = function(e) {

        var key = e.keyCode;

        var key = e.keyCode; //? e.keyCode : e.which;

        if (key == 39) {

            // players["self"].bunny.position.x += 5;
            right = false;
            players["self"].isWalking = false;
            socket.emit('animation', { id : players["self"].id, type : "walk", method : "stop" });

        } else if (key == 37) {

            // players["self"].bunny.position.x -= 5;
            left = false;
            players["self"].isWalking = false;
            socket.emit('animation', { id : players["self"].id, type : "walk", method : "stop" });

        }

    }

    /* Responses from the server */

    // User Input
    socket.on('userInput', function (data) {

        // console.log("User " + data.id + " bunny is at: " + data.x);

        // Move the current user's character
        if( players["self"].id == data.id ) {

            players["self"].moveX( data.x );

        // Move a network user's character
        } else {

            players[data.id].moveX( data.x );
            players[data.id].isWalking = true;

            // Check which direction this user is facing
            if( data.direction == "right" ) {

                players[data.id].facingRight = true;
                players[data.id].facingLeft = false;

            } else if( data.direction == "left" ) {

                players[data.id].facingRight = false;
                players[data.id].facingLeft = true;

            }


        }

    });

    // Current User Connected
    socket.on('selfConnect', function (data) {

        console.log("CLIENT: create new avatar with ID " + data.id);
        players["self"].createAvatar(data.id);

        for( var connectedPlayer in JSON.parse(data.basket) ) {

            // Register and draw all currently connected players
            if( data.id != connectedPlayer ) {

                // console.log("CLIENT: player with ID " + connectedPlayer + " previously connected");
                players[connectedPlayer] = new player(false,  JSON.parse(data.basket)[connectedPlayer].name);
                players[connectedPlayer].createAvatar(connectedPlayer);
                players[connectedPlayer].bunny.position.x = JSON.parse(data.basket)[connectedPlayer]["x"];
                players[connectedPlayer].namePlate.position.x = JSON.parse(data.basket)[connectedPlayer]["x"] - 15;
                players[connectedPlayer].animateFrames(0);

            }

        }

    });

    // Other User Connected
    socket.on('userConnect', function (data) {

        if( data.id != players["self"].id ) {

            // console.log("CLIENT: create new avatar with ID " + data.id);
            $("#notifications").append("<span class='normalNotification'>User " + data.name + " has connected</span>");
            players[data.id] = new player(false, data.name);
            players[data.id].createAvatar(data.id);
            players[data.id].animateFrames(0);

        }

    });

    // Respond to still logged in check
    socket.on('userPing', function (data) {

        socket.emit('serverPing', { id : players["self"].id, ping : new Date() });

    });

    // Remove inactive users
    socket.on('removeUser', function (data) {

        // console.log("CLIENT: current user: " + players["self"].id + ", remove user: " + data.id);

        // Display a notification that the user is no longer connected
        $("#notifications").append("<span class='errorNotification'>User " + data.name + " has disconnected</span>")
        document.getElementById("notifications").scrollTop = document.getElementById("notifications").scrollHeight;
        
        // Remove the player and the player's nameplate from the stage
        stage.removeChild(players[data.id].bunny);
        stage.removeChild(players[data.id].namePlate);
        stage.removeChild(players[data.id].chatText);
        players.splice(data.id, 1);

    });

    // Receive broadcast messages
    socket.on('userBroadcast', function (data) {

        $("#chatbox").append("<span class='normalNotification'><b>" + data.name + " said:</b> " + data.message + "</span>")
        document.getElementById("chatbox").scrollTop = document.getElementById("chatbox").scrollHeight;

        // Display message above player head
        if( data.id == players["self"].id ) {

            players["self"].namePlate.text = data.message;
            setTimeout(function() {

                players["self"].namePlate.text = data.name;

            }, 5000);

        } else {

            players[data.id].namePlate.text = data.message;
            setTimeout(function() {

                players[data.id].namePlate.text = data.name;

            }, 5000);

        }

    });

    // Receive animation broadcasts
    socket.on('animation', function (data) {

        if( data.id != players["self"].id ) {

            // console.log(data.id + " animation " + data.type + " action " + data.method);
            if ( data.type == "jump" ) {

                players[data.id].isJumping = true;
                players[data.id].gravity = -30;

            } else if( data.type == "walk" ) {

                players[data.id].isWalking = false;

            }

        }

    });

    /* Interface controls */

    // Broadcast messages
    $("#send").on("click", function() {

        // console.log( $("#message").val() );
        if( $("#message").val().trim() != "" ) {

            socket.emit('userBroadcast', { id : players["self"].id, name : players["self"].name, message : $("#message").val() });
             $("#message").val("");

        }

    });

}