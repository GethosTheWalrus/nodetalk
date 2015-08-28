function statefulServer(port) {

    this.express = require("express");
    this.logger = require("fs");
    this.app = this.express();
    this.htmlEntities = require('html-entities').XmlEntities;
    this.sanitizer = new this.htmlEntities();
    this.port = port;
    this.dispatchUserId = 0;
    this.basket = {};

    // Create io object that will listen on the specified port
    this.io = require('socket.io').listen( this.app.listen( this.port ) );

    this.controls = new Array;

}

statefulServer.prototype = {

    constructor : statefulServer,

    start : function() {

        var self = this;
        var clientControls = self.controls;

        // Set template directory
        self.app.set('views', __dirname + '/tpl');
        // Set templating manager engine
        self.app.set('view engine', "jade");
        // Require Jade import through express
        self.app.engine('jade', require('jade').__express);
        // Set publicly accessible client-side JS directory
        self.app.use(this.express.static(__dirname + '/public'));

        // When an HTTP request is received
        self.app.get("/", function(req, res) {

            // Render the HTML page to the client
            res.render("page");

        });

        // Serve client connections
        self.listen(this.io);

        // Ping all connected users
        self.pingUsers();

    },

    pingUsers : function() {

    	var self = this;

    	setTimeout(function() {

    		for( var user in self.basket ) {

	    		self.respondTo( "userPing", user, { id : user } );

	    	}

	    	self.pingUsers();

	    }, 5000);

    },

    // Listen for events from clients
    listen : function() {

        var self = this;

        // Set a connection listener callback function
        this.io.sockets.on('connection', function (socket) {

            // Listen for new user connect
            socket.on('userConnect', function (data, err) {

                // Error handler
                if(err) {

                    return console.log("SERVER: Encountered an error: " + err);

                }

                // Check if this is the user's first request (connection)
                if( data.stage == "initial" ) {

                    console.log("SERVER: New user connected. Responding with user ID " + socket.id + ", name: " + data.name);

                    self.basket[socket.id] = { lastPinged : new Date(), name : data.name };

                    self.respondTo( "selfConnect", socket.id, { id : socket.id, name : data.name, basket : JSON.stringify(self.basket) } );
                    self.respondAll( "userConnect", { id : socket.id, name : data.name } );

                }

            });

            // Listen for user ping
            socket.on('serverPing', function (data, err) {

                // console.log("SERVER: verified that user " + data.id + " is still connected");

            });

            // Listen for user input
            socket.on('userInput', function (data, err) {

            	// Error handler
            	if(err) {

                    return console.log("SERVER: Encountered an error: " + err);

                }

                // console.log("User " + data.id + " x: " + data.x);

                self.basket[data.id].x = data.x;

                self.respondAll("userInput", { id : data.id, x : data.x, direction : data.direction });

            });

            //Listen for user broadcast messages
            socket.on('userBroadcast', function (data, err) {

                self.respondAll("userBroadcast", { id : data.id, name : data.name, message : self.sanitizer.encode(data.message) });

            });

            // Listen for user animation actions
            socket.on('animation', function (data, err) {
                
                console.log(data.id + " animation " + data.type + " action " + data.method);
                self.respondAll("animation", { id : data.id, type : data.type, method : data.method });

            });

        });

    },

    // Respond to all clients
    respondAll : function(type, requestData) {

        var self = this;

        // Respond to all connected clients
        self.io.sockets.emit(type, requestData);

    },

    // Respond to specific client
    respondTo : function(type, client, requestData) {

    	var self = this;

        if( self.io.sockets.connected[client] ) {

            // Respond to a specific client
            self.io.sockets.connected[client].emit(type, requestData);

        } else {

            self.respondAll( "removeUser", { id : client, name : self.basket[client].name } );
            delete self.basket[client];
            console.log("SERVER: user " + client + " is no longer connected");

        }

    }

}

var ss = new statefulServer(8888);
ss.start();