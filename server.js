var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.get('/', function(req, res, next) {
	res.sendFile(__dirname + '/index.html')
});

app.use(express.static('public'));

var j = 0;

io.sockets.on('connection', function(client) {
	console.log('Client connected...');
	client.user_id = 1;
	client.on('join', function(data) {
		console.log(data);
			console.log(io.sockets.connected)
	});



	client.on('messages', function(data){
		//client.emit('thread', data);
		//client.broadcast.emit('thread', data);
	
	//	.client('1').emit(data);
	});
});

server.listen(3000);
