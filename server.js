var express = require('express');
var path = require('path');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server,{ wsEngine: 'ws' });
var mysql = require('mysql');

var port = process.env.PORT || 3000;
var googleTranslate = require('google-translate')('AIzaSyDrn4uhUxn2Jk8HopmbtBsDe4q3ILC5LgE');
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "chat"
});

con.connect(function(err) {
  console.log("Connected Mysql!");

});



app.use(express.static(path.join(__dirname, "public")));
server.listen(port, () => {
  console.log("Listening on port " + port);
});
io.on('connection', (socket) => {
	socket.on('signin',(data)=>{
		var sql = "SELECT * FROM  users WHERE email='"+data.email+"'";
		con.query(sql, function (err, result) {
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
	socket.on('client_new_user',(data)=>{
		if(data.id_user != null && data.url_chat == null){
			/*додаєм юзера в діалог*/
			var url_chat = new Date().getTime(); 
				socket.join(url_chat);
			var sql = "INSERT INTO chats (url) VALUES ('"+url_chat+"')";
			con.query(sql, function (err, result) {
				var sql_update = "UPDATE users SET room = '"+url_chat+"' WHERE id ="+data.id_user;
				con.query(sql_update, function (err2, result2) {
					if (err2) throw err2;
					socket.emit('server_new_chat_data',{"url_chat":url_chat,"id_chat":result.insertId,"id_user":data.id_user,'lang':result2.lang})
				});
			})
		}else{
			var sql_update = "UPDATE users SET room = '"+data.url_chat+"' WHERE id ="+data.id_user;
			con.query(sql_update, function (err2, result2) {
				if (err2) throw err2;
				socket.join(data.url_chat);
				var sql = "SELECT * FROM  chats WHERE url='"+data.url_chat+"'";
				con.query(sql, function (err, result) {
					if (err) throw err;
					socket.emit('server_new_chat_data',{"url_chat":result[0]['url'],"id_chat":result[0]['id'],"id_user":data.id_user,'lang':data.lang})
				})
				
			});
		}
	})
	socket.on('client_change_lang',(data)=>{
		if(data.id_user != 'undefined'){
			var sql_update = "UPDATE users SET lang = '"+data.lang+"' WHERE id ="+data.id_user;
			con.query(sql_update, function (err2, result2) {
				if (err2) throw err2;
			});
			
		}
	})
	socket.on('client_load_chat_msg',(data)=>{
		if(data.id_chat != 'undefined'){
			var sql = "SELECT * FROM  message WHERE chat_id='"+data.id_chat+"'";
			con.query(sql, function (err, result) {
				if (err) throw err;
				socket.emit('server_get_chat_msg',result)
			});
		}
	})
	socket.on('client_send_new_msg',(data)=>{
		//socket.emit('test_emit',socket)
		var sql = "SELECT * FROM  users WHERE room="+data.url_chat;
			con.query(sql, function (err, result) {
			if (err) throw err;
			if(result.length > 0){
				var pr = new Promise(function (resolve, reject) {
					var objMsg = {};
					var count = 1;
					for (var k in result) {
						const lang = result[k]['lang']
						googleTranslate.translate(data.msg, lang, function(err, translation){
							if (err) throw err;
							objMsg[lang] = translation.translatedText;
							if(count == result.length ){
								resolve(objMsg)
							}
							count++;
						})

					}
				});

				pr.then(function(obj){
					io.sockets.in(data.url_chat).emit('server_new_msg',{"date":data.date,"msg_from":data.id_user,"msg":obj});
					var sql = "INSERT INTO message (chat_id,msg_from,msg,date) VALUES ('"+data.url_chat+"','"+data.id_user+"','"+JSON.stringify(obj)+"','"+data.date+"')";
					con.query(sql, function (err, result) {
						if (err) throw err;
					});

				})	
			}
		});
	})
	socket.on('disconnect',(data)=>{

		/*var sql = "SELECT * FROM  chats WHERE users LIKE '%" + socket.id + "%'";
			con.query(sql, function (err, result) {
				if (err) throw err;
				if(result.length > 0){
					load_chat_data = result;
					var users = JSON.parse(result[0]['users']);
						users.splice(users.indexOf(socket.id),1)
						users = JSON.stringify(users);
					var sql_update = "UPDATE chats SET users = '"+users+"' WHERE url ='"+result[0].url+"'";
					con.query(sql_update, function (err_2, result_2) {});
				}
			});*/
	})
});

