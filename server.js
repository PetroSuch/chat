var express = require('express');
var path = require('path');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server,{ wsEngine: 'ws' });

var port = 3000;

app.use(express.static(path.join(__dirname, "public")));
var users = {};
var listUser = [];
io.on('connection', (socket) => {

	socket.on('addUser', (name_user) => {
		socket.id_user = name_user;
		users[name_user] = socket.id
		var user = {'name':name_user,'socket_id':socket.id};
		listUser.push(user);
		io.sockets.emit('listUser',listUser);
	});
	

	socket.on('send-message', (msg) => {
		if( io.sockets.connected[msg['id2']]){
			io.sockets.connected[msg['id2']].emit('send-message', {msg:msg.message});
		}else{
			console.log('2')
		}
	});




	socket.on('disconnect', (data) => {
		for(var i in users){
			if(users[i] == socket.id){
				console.log(i)
				delete users[i];
			}
		}
		io.sockets.emit('listUser', users);
	});

});



server.listen(port, () => {
  console.log("Listening on port " + port);
});
