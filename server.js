var express = require('express');
var path = require('path');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server,{ wsEngine: 'ws' });
var port = process.env.PORT || 3000;
var url = "mongodb://localhost:27017/";




app.use(express.static(path.join(__dirname, "public")));
server.listen(port, () => {
  console.log("Listening on port " + port);
});

function findUserSocketById(id_user){}

var users = {};
var listSocket = {};
io.on('connection', (socket) => {
	socket.on('addUserDialog', (obj) => {
		socket.id_1 = obj['id_1'];
		users[obj['id_1']] = {'id':obj['id_1'],'socket':socket.id,'user':obj['user_1']}
		listSocket[socket.id] = obj['id_1'];
		var socketUser2 = false;
		if(users[obj['id_2']]){
			socketUser2 = users[obj['id_2']]
			socket.emit('userDialog',users[obj['id_2']]);
		}else{
			io.sockets.emit('userDialog','user '+obj['id_2'] + ' can not find in socket');
		}
	});

	socket.on('sendMsg', (obj)=>{
		var date = new Date();
			var dateFormated = date.toISOString().substr(0,10);
			var time = date.toLocaleTimeString();
			var msgObj = {
				"msg":obj['msg'],
				"id_1":'',
				"id_2":'',
				"user_1":'',
				"user_2":'',
				"time":time,
				"date":dateFormated
			}
			console.log(obj['id_1'] == null)
		if(users[obj['id_1']] && users[obj['id_2']] && obj['id_1'] != null ){
			socketUser2 = users[obj['id_2']]
			msgObj['id_1'] = users[obj['id_1']]['id'];
			msgObj['user_1'] = users[obj['id_1']]['user'];
			msgObj['id_2'] = users[obj['id_2']]['id'];
			msgObj['user_2'] = users[obj['id_2']]['user'];
			io.sockets.connected[socketUser2['socket']].emit('getMsg',msgObj );
		}else{
			io.sockets.emit('userDialog',{'user':false,'connect':false});
		}
		console.log(obj)
		socket.emit('getMsg',msgObj);
	})

	socket.on('disconnect',(sock)=>{
		delete users[listSocket[sock.id]]
		console.log(users)
	})
});
