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
		console.log(name_user)
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
			console.log(users[i])
			if(users[i] == socket.id){
				delete users[i];
			}
		}
		for(var i in listUser){
			if(listUser[i]['socket_id'] == socket.id){
				delete listUser[i];
				 listUser.splice(i,1);
			}
		}
		console.log(listUser)

		io.sockets.emit('listUser', listUser);
	});

});


server.listen(process.env.PORT || port, () => {
	console.log(process.env.PORT)
  console.log("Listening on port " + port);
});
