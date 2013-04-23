/**
 * Module dependencies.
 */

var express = require("express");
var app = express();

var socket = require('socket.io');
app.configure(function(){
  app.use(express.static(__dirname + '/'));
});

/**
 * A setting, just one
 */

var port = 9002;





/** Below be dragons 
 *
 */

// SESSIONS
app.use(express.cookieParser());
app.use(express.session({secret: 'secret', key: 'express.sid'}));

// DEV MODE
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// PRODUCTON MODE
app.configure('production', function(){
  app.use(express.errorHandler());
});

// ROUTES
// Index page
app.get('/', function(req, res){
  res.sendfile(__dirname + '/src/static/html/index.html');
});

// Drawings
app.get('/d/*', function(req, res){
  res.sendfile(__dirname + '/src/static/html/draw.html');
});

// Static files IE Javascript and CSS
app.use("/static", express.static(__dirname + '/src/static'));

// LISTEN FOR REQUESTS
var server = app.listen(port);
var io = socket.listen(server);

// SOCKET IO
//var active_connections = 0;
io.sockets.on('connection', function (socket) {

  //active_connections++

  //io.sockets.emit('user:connect', active_connections);
  
  //io.sockets.in('room').emit('event_name', data)

  socket.on('disconnect', function () {
    //active_connections--
    //io.sockets.emit('user:disconnect', active_connections);
	disconnect(socket);
  });

  // EVENT: User stops drawing something
  // Having room as a parameter is not good for secure rooms
  socket.on('draw:progress', function (room, uid, co_ordinates) {
    
    //io.sockets.emit('draw:progress', uid, co_ordinates)
    io.sockets.in(room).emit('draw:progress', uid, co_ordinates);
  });

  // EVENT: User stops drawing something
  // Having room as a parameter is not good for secure rooms
  socket.on('draw:end', function (room, uid, co_ordinates) {
    
    //io.sockets.emit('draw:end', uid, co_ordinates)
	io.sockets.in(room).emit('draw:progress', uid, co_ordinates)

  });
  
  // User joins a room
  socket.on('subscribe', function(data){
    subscribe(socket, data);
  });
  
});

// Subscribe a client to a room
function subscribe(socket, data) {
  var room = data.room;

  // Subscribe the client to the room
  socket.join(room);
  
  // Broadcast to room the new user count
  var active_connections = io.sockets.manager.rooms['/' + room].length;  
  io.sockets.in(room).emit('user:connect', active_connections);

  // update all other clients about the online
  // presence
  //updatePresence(data.room, socket, 'online');

  // send to the client a list of all subscribed clients
  // in this room
  //socket.emit('roomclients', { room: data.room, clients: getClientsInRoom(socket.id, data.room) });
  
}


// When a client disconnect, unsubscribe him from
// the rooms he subscribed to
function disconnect(socket) {
  // Get a list of rooms for the client
  var rooms = io.sockets.manager.roomClients[socket.id];

  // Unsubscribe from the rooms
  for(var room in rooms) {
    if(room && rooms[room]) {
      unsubscribe(socket, { room: room.replace('/','') });
    }
  }
  
}

// Unsubscribe a client from a room, this can be
// occured when a client disconnected from the server
// or he subscribed to another room
function unsubscribe(socket, data){
  // Update all other clients about the offline
  // presence
  //updatePresence(data.room, socket, 'offline');

  var room = data.room;
  
  // Remove the client from socket.io room
  // This is optional for the disconnect event, we do it anyway
  socket.leave(room);
	
  // Broadcast to room the new user count
  if ( io.sockets.manager.rooms['/' + room] ) {
    var active_connections = io.sockets.manager.rooms['/' + room].length;  
    io.sockets.in(room).emit('user:disconnect', active_connections);
  }

	// If this client was the only one in that room
	// we are updating all clients about that the
	// room is destroyed
	//if(!countClientsInRoom(data.room)){

	  // With 'io.sockets' we can contact all the
	  // clients that connected to the server
	  //io.sockets.emit('removeroom', { room: data.room });
	//}
}


