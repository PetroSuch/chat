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

var users_online = {};
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
			chat.addUsersToListOnline(data.id_user)
			//users_online[data.id_user] = {'status':'online','socket':socket.id}
			//socket.join(data.url_chat);
			chat.addUsersToListOnline(data.id_user,data.url_chat)
			//var sql = "SELECT * FROM  users WHERE id="+data.id_user;
			//con.query(sql, function (err3, result3) {
				//if (err3) throw err3;
				var _url_chat = data.url_chat != null?" room='"+data.url_chat+"' AND":'';
				var _url_chat_union = data.url_chat != null?" UNION SELECT * FROM users_chat WHERE room="+data.url_chat:'';
				var sql_get = "SELECT * FROM `users_chat` WHERE"+_url_chat+"  id_user="+data.id_user+" "+_url_chat_union;
			//	console.log(sql_get)
				con.query(sql_get,  (err2, result2)=>{

					if (err2) throw err2;
					var curr_user = [],
						count_users = 0
					for(var k in result2){
						if(result2[k]['id_user'] == data.id_user){
							curr_user.push(result2[k])
						}
						if(result2[k]['id_user'] != data.id_user){
							count_users++;
						}
					}
					if(curr_user.length == 0 && count_users < 2  && data.url_chat != null){
						var sql_new_chat = "INSERT INTO users_chat (id_user,room,lang) VALUES ("+data.id_user+",'"+data.url_chat+"','"+data.lang+"')"
							con.query(sql_new_chat, (err3, result3)=>{
							chat.reloadUsersListDialog(data.url_chat,'all')
						})
					}else{
						chat.reloadUsersListDialog(data.url_chat,'one')
					}						
				});
			//})
			
		}
	})


	socket.on('client_create_new_dialog',(data)=>{
		console.log('create new dialog',data)
		var url_chat = new Date().getTime(); 
			socket.join(url_chat);
			chat.addUsersToListOnline(data.id_user,url_chat)
		var sql_new_chat = "INSERT INTO users_chat (id_user,room,lang) VALUES ("+data.id_user+",'"+url_chat+"','"+data.lang+"')"
		con.query(sql_new_chat, (err, res)=>{
			if(err) throw err;
			chat.reloadUsersListDialog(url_chat,'all')
		})
	})


	socket.on('client_load_list_dialog',(data)=>{
		console.log('reload list dialog')
		var sql = "SELECT * FROM users_chat WHERE id_user ="+data.id_user;
		con.query(sql,(err,res)=>{
			if (err) throw err;
			var chats = [];
			for(var k in res){
				socket.join(res[k]['room'])
				chat.addUsersToListOnline(data.id_user,res[k]['room'])
				chats.push(res[k]['room'])
			}
			if(chats.length > 0){
				chats = '('+chats.join(",")+')';
				var sql2 = "SELECT * FROM users_chat WHERE room IN "+chats;
				con.query(sql2, function (err2, res2) {
					if (err2) throw err2;
					var all_unread_msg = "SELECT * FROM message WHERE view=0 AND chat_id IN "+chats;
					con.query(all_unread_msg, function (err4, res4) {
					if (err4) throw err4;
					
					var id_users = []
					var unread_msg = {}
					for(var l in res2){
						id_users.indexOf(res2[l]['id_user']) == -1?id_users.push(res2[l]['id_user']):''
					}
					for(var k in res){
						res[k]['unread'] = 0;
						for(y in res4){
							if(res4[y]['chat_id'] == res[k]['room']){
								res[k]['unread'] +=1;
							}
						}
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
									res3[y]['online'] = users_online[res2[k]['id_user']]?'online':'';
								}
							}
						}
						socket.emit('server_load_list_dialog',{'users':res3,'chats':res})
					})
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
		console.log('client_load_chat_msg',data)
		if(data.url_chat != 'undefined'){
			var sql = "SELECT * FROM  message WHERE chat_id='"+data.url_chat+"' ORDER BY id ";
			con.query(sql, function (err, result) {
				if (err) throw err;
				var sql2 = "SELECT users_chat.lang AS 'lang',users.id AS 'id',users.name AS 'user_name', users.image AS 'user_image' FROM  users_chat JOIN users ON users.id=users_chat.id_user WHERE users_chat.room='"+data.url_chat+"'";
				con.query(sql2, function (err2, result2) {
					if(err2) throw err2;
					chat.setReadStatus(data.url_chat)
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
					var objMsg = {'original':data.msg};
					var count = 1;
					for (var k in result) {
						const lang = result[k]['lang'] !=undefined?result[k]['lang']:'en';
						//googleTranslate.translate(data.msg, lang, function(err, translation){
							//if (err) throw reject(err);
							//objMsg[lang] = translation.translatedText;
							objMsg[lang] = data.msg;
							if(count == result.length ){
								resolve(objMsg)
							}
							count++;
						//})
					}
				});
				pr.then(function(obj){
					io.sockets.in(data.url_chat).emit('server_new_msg',{"date":data.date,"msg_from":data.id_user,"msg":obj,'url_chat':data.url_chat});
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
		for(var k in users_online){
			if(users_online[k]['socket'] == socket.id){
				for(var y in users_online[k]['room']){
					var url_chat = users_online[k]['room'][y],
						id_user = users_online[k]['id_user'];
					io.sockets.in(url_chat).emit('online_status',{'id_user':id_user,'status':''})
				}
				console.log('disconnect')
				delete users_online[k];
			}
		}

	})


	var chat = {
		reloadUsersListDialog: (url_chat,type)=>{
			if(type == 'all'){
				io.sockets.in(url_chat).emit('reloadInf',{'type':'list-dialog','url_chat':url_chat})
			}else if(type == 'one'){
				socket.emit('reloadInf',{'type':'list-dialog'})
			}			
		},
		addUsersToListOnline(id_user,room = false){
			if(users_online[id_user]){
				if(room != false){
					socket.join(room)
					io.sockets.in(room).emit('online_status',{'id_user':id_user,'status':'online'})
					users_online[id_user]['room'] = users_online[id_user]['room']?users_online[id_user]['room']:[];
					users_online[id_user]['room'].indexOf(room) == -1?users_online[id_user]['room'].push(room):''
				}
			}else{
				users_online[id_user] = {'status':'online','id_user':id_user,'room':[],'socket':socket.id}
				users_online[id_user]['room'].push(room)
			}
		},
		setReadStatus: (chat_id)=>{
			var sql = "UPDATE `message` SET `view`=1 WHERE chat_id ='"+chat_id+"'"
			con.query(sql,(err,res)=>{
				if(err) throw err;
				console.log('update read status')
			})
		}
	}
});

