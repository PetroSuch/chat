var express = require('express');
var path = require('path');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server,{ wsEngine: 'ws' });
var mysql = require('mysql');

var port = process.env.PORT || 3000;
var googleTranslate = require('google-translate')('AIzaSyDrn4uhUxn2Jk8HopmbtBsDe4q3ILC5LgE');
var con = mysql.createConnection({
  host: "remotemysql.com",
  user: "TggTikyCK7",
  password: "JgoDz9XiW2",
  database: "TggTikyCK7"
});

con.connect(function(err) {
  console.log("Connected Mysql!");

});


app.use(express.static(__dirname));
app.get('/index', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
server.listen(port, () => {
  console.log("Listening on port " + port);
});

io.on('connection', (socket) => {
	socket.on('signin',(data)=>{
		//console.log('signin',data)
		var sql = "SELECT * FROM  users WHERE email='"+data.email+"'";
		con.query(sql, function (err, result) {
			if (err) throw err;
			if(result.length == 0){
				var sql2 = "INSERT INTO users (name,email,image,lang) VALUES ('"+data.name+"','"+data.email+"','"+ data.image+"','"+ data.lang+"')";
				con.query(sql2, function (err2, result2) {
					if (err2) throw err2;
					socket.id_user = result2.insertId
					socket.emit('user_is_signin',{"id_user":result2.insertId})
				})
			}else{
				socket.emit('user_is_signin',{"id_user":result[0].id})
			}
		})
	})

	socket.on('client_load_dialog',(data)=>{
		console.log('client_load_dialog',data)
		if(data.id_user != null){
			var sql = "SELECT * FROM  users WHERE id="+data.id_user;
			socket.join(data.url_chat);
			con.query(sql, function (err3, result3) {
				if (err3) throw err3;
				var sql_update = "SELECT * FROM `users_chat` WHERE room='"+data.url_chat+"' AND  id_user="+data.id_user;
				con.query(sql_update,  (err2, result2)=>{
					if (err2) throw err2;
					if(result2.length == 0 && data.url_chat != null){
						var sql_new_chat = "INSERT INTO users_chat (id_user,room,lang) VALUES ("+data.id_user+",'"+data.url_chat+"','"+data.lang+"')"
							con.query(sql_new_chat, (err3, result3)=>{
							chat.reloadUsersListDialog(data.url_chat)
						})
					}else{
						chat.reloadUsersListDialog(data.url_chat)
					}						
				});
			})
			
		}
	})


	socket.on('client_create_new_dialog',(data)=>{
		console.log('create new dialog',data)
		var url_chat = new Date().getTime(); 
			socket.join(url_chat);
		var sql_new_chat = "INSERT INTO users_chat (id_user,room,lang) VALUES ("+data.id_user+",'"+url_chat+"','"+data.lang+"')"
		con.query(sql_new_chat, (err, res)=>{
			if(err) throw err;
			console.log(res)
			chat.reloadUsersListDialog(url_chat)
		})
	})


	socket.on('client_load_list_dialog',(data)=>{
		var sql = "SELECT * FROM users_chat WHERE id_user ="+data.id_user;
		con.query(sql,(err,res)=>{
			if (err) throw err;
			var chats = [];
			for(var k in res){
				socket.join(res[k]['room'])
				chats.push(res[k]['room'])
			}
			if(chats.length > 0){
				chats = '('+chats.join(",")+')';
				var sql2 = "SELECT * FROM users_chat WHERE room IN "+chats;
				con.query(sql2, function (err2, res2) {
					if (err2) throw err2;
					var id_users = []
					for(var l in res2){
						id_users.indexOf(res2[l]['id_user']) == -1?id_users.push(res2[l]['id_user']):''
					}
					id_users = '('+id_users.join(",")+')';
					var sql3 = "SELECT * FROM users WHERE id IN "+id_users;
					//console.log(id_users,sql3)
					con.query(sql3, function (err3, res3) {
						if (err) throw err;
						var objUser = [];
						for(var k in res2){
							for(var y in res3){
								if(res2[k]['id_user'] == res3[y]['id']){
									res3[y]['room'] = res2[k]['room']
									res3[y]['lang'] = res2[k]['lang']
								}
							}
						}
						socket.emit('server_load_list_dialog',{'users':res3,'chats':res})
					})
				})
			}else{
				socket.emit('server_load_list_dialog',{'users':[],'chats':[]})
			}
			
		})
		
	})
	socket.on('client_change_lang',(data)=>{
		console.log('client_change_lang',data)
		if(data.id_user != 'undefined'){
			var sql_update = "UPDATE users_chat SET lang = '"+data.lang+"' WHERE id_user ="+data.id_user+" AND room='"+data.chat_url+"'";
			con.query(sql_update, function (err2, result2) {
				if (err2) throw err2;
				console.log(result2,sql_update)
			});
		}
	})
	socket.on('client_load_chat_msg',(data)=>{
		
		if(data.url_chat != 'undefined'){
			//console.log('client_load_chat_msg',data)
			var sql = "SELECT * FROM  message WHERE chat_id='"+data.url_chat+"' ORDER BY id ";
			con.query(sql, function (err, result) {
				if (err) throw err;
				var sql2 = "SELECT users_chat.lang AS 'lang',users.id AS 'id',users.name AS 'user_name', users.image AS 'user_image' FROM  users_chat JOIN users ON users.id=users_chat.id_user WHERE users_chat.room='"+data.url_chat+"'";
				con.query(sql2, function (err2, result2) {
					if(err2) throw err2;
					socket.emit('server_get_chat_msg',{'messages':result,'chat_users':result2})
				})
			});
		}
	})
	
	socket.on('client_send_new_msg',(data)=>{
		//console.log('client_send_new_msg',data)
		data.msg = data.msg.trim()
		var sql = "SELECT * FROM  users_chat  WHERE room ='"+data.url_chat+"'";
			con.query(sql, function (err, result) {
			if (err) throw err;
			if(result.length > 0){
				var pr = new Promise(function (resolve, reject) {
					var objMsg = {};
					var count = 1;
					for (var k in result) {
						const lang = result[k]['lang'] !=undefined?result[k]['lang']:'en';
						googleTranslate.translate(data.msg, lang, function(err, translation){
							if (err) throw reject(err);
							objMsg[lang] = translation.translatedText;
							if(count == result.length ){
								resolve(objMsg)
							}
							count++;
						})
					}
				});
				pr.then(function(obj){
					console.log(obj)
					io.sockets.in(data.url_chat).emit('server_new_msg',{"date":data.date,"msg_from":data.id_user,"msg":obj});
					var sql = "INSERT INTO message (chat_id,msg_from,msg,date) VALUES ('"+data.url_chat+"','"+data.id_user+"','"+JSON.stringify(obj)+"','"+data.date+"')";
					con.query(sql, function (err, result) {
						if (err) throw err;
					});
				}).catch(function (err) {
				     console.log(err);
				});
			}
		});
	})
	socket.on('disconnect',(data)=>{
		console.log('disconect')
	})


	var chat = {
		reloadUsersListDialog: (url_chat)=>{
			io.sockets.in(url_chat).emit('reloadInf',{'type':'list-dialog'})
		}
	}
});

