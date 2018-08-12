var express = require('express');
var path = require('path');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server,{ wsEngine: 'ws' });
var mysql = require('mysql');

var port = process.env.PORT || 3000;


var con = mysql.createConnection({
  host: "qumel.mysql.tools",
  user: "qumel_myspace",
  password: "8ng7bd6u",
  database: "qumel_myspace"
});

con.connect(function(err) {
  console.log("Connected Mysql!");

});


var uri = "mongodb://root:aezakmi1@ds235711.mlab.com:35711/kiril";
var options = {
	useNewUrlParser: true 
};
var mongoose = require("mongoose");
	mongoose.connect(uri,options);


var Schema =  mongoose.Schema;

var msgScheme = new Schema({
	id_dialog:String,
    msg: String,
    read:Boolean,
    id_1:Number,
	id_2:Number,
	id_author:Number,
	user_1:Object,
	user_2:Object,
	time:String,
	date:String
},{timestamps: true});


var dialogSchema = new Schema({
	id_1:Number,
    id_2: Number,
    user1: Object,
    user2:Object
},{timestamps: true});

var msgModel = mongoose.model("messages", msgScheme);
var dialogModel = mongoose.model("dialog", dialogSchema);

var newMessageModel = new msgModel();
var newDialogModel = new dialogModel();



app.use(express.static(path.join(__dirname, "public")));
server.listen(port, () => {
  console.log("Listening on port " + port);
});

function findUserSocketById(id_user){}

var users = {};
var listSocket = {};
io.on('connection', (socket) => {

	socket.on('check online', (obj)=>{
		if(typeof users[obj['id_2']] != 'undefined' && obj['id_2'] != null){
			socket.emit('check online',true)
		}else{
			socket.emit('check online',false)
		}
	})

	
	socket.on('find list dialog', (obj)=>{
		console.log('find list dialog')
		var result = [];
		
		dialogModel.find({$or: [{'id_1':obj['id_1']},{'id_2':obj['id_1']}]}, function (err, objFind) {
			var arrId = [];
			for(var key in objFind){
				arrId.push(objFind[key]['_id'])
			}
			msgModel.find({
			    'id_dialog': { $in: arrId}
			})
			.sort({'_id': -1})
			.exec(function(err, msg) {
				//mongoose.connection.close()
				if(err){console.log(err)}
				if (err) throw err;
				for(var k in objFind){
					var push = {'dialog':objFind[k],'last_msg':'','count_unread':0}
					for(j in msg){
						if(objFind[k]['_id'] == msg[j]['id_dialog'] ){
							push['last_msg'] = msg[j];
							break;
						}
					}
					for(j in msg){
						var id_1 = msg[j]['id_1'] == obj['id_user'] ? msg[j]['id_2']:msg[j]['id_1'];
						if(objFind[k]['_id'] == msg[j]['id_dialog'] && msg[j]['id_author'] == id_1  && msg[j]['read'] == false){
							push['count_unread'] += 1;
						}
					}
					result.push(push)	
					socket.emit('list dialog',result);
				}
			});
		
		})
	})

	socket.on('add user',(obj)=>{
		//if(!users[obj['id_1']]){
			socket.id_1 = obj['id_1'];
			var user1 = obj['user1'];
			users[obj['id_1']] = {'id':obj['id_1'],'socket':socket.id,'user':user1,'id_dialog':''}
			listSocket[socket.id] = obj['id_1'];
			console.log('user is add '+users[obj['id_1']]['socket'])
			console.log('-----')

		/*else{
			users[obj['id_1']]['socket'][socket.id]
			listSocket[socket.id] = obj['id_1'];
			console.log('user is update '+socket.id)


		}*/

	})

	socket.on('set dialog id',(obj)=>{
		if(users[obj['id_1']]){
			users[obj['id_1']]['id_dialog'] = obj['id_dialog']
		}
	})




	socket.on('find dialog', (obj)=>{
		console.log('find dialog')
		var id_1 = obj['id_1']?obj['id_1']:null;
		var id_2 = obj['id_2']?obj['id_2']:null;
		dialogModel.findOne({$or: [{'id_1':id_1,'id_2':id_2},{'id_2':id_1,'id_1':id_2}]}, function (err, objFind) {
			 /*mongoose.disconnect();*/
			if(objFind){
				socket.emit('result_find_dialog',objFind)
				/*if(!users[obj['id_1']]){
					socket.id_1 = obj['id_1'];
					var user1 = objFind.user1.id==obj['id_1']?objFind.user1:objFind.user2;
					users[obj['id_1']] = {'id':obj['id_1'],'socket':socket.id,'user':user1}
					listSocket[socket.id] = obj['id_1'];
				}*/
				
				msgModel.find({'id_dialog':objFind['_id']})
				.sort({'_id':-1})
				.limit(100)
				.exec(function(err, msg) {
					 /*mongoose.disconnect();*/
				//	mongoose.connection.close()
					var res = msg.reverse()

					if (err) throw err;
				    socket.emit('load_old_message',res);
				});
		

			}else{

				con.query("SELECT id,name,phone,img,date_edit FROM user WHERE id IN ("+id_1+","+id_2+")", function (err, result, fields) {
					
					if(err) console.log(err);				
					if(result){
						var newDialogModel = new dialogModel();
						dialogModel.create({
							id_1:result['0']['id'],
							id_2:result['1']['id'],
							user1: result['0'],
							user2: result['1']
							}, function (err, small) {
							/*mongoose.disconnect();*/
							if (err){ return err}

							dialogModel.findOne({$or: [{'id_1':obj['id_1'],'id_2':obj['id_2']},{'id_2':obj['id_1'],'id_1':obj['id_2']}]}, function (err, objFind) {
								socket.emit('result_find_dialog',objFind)
								/*
								if(!users[obj['id_1']]){
									socket.id_1 = obj['id_1'];
									var user1 = objFind.user1['id']==obj['id_1']?objFind.user1:objFind.user2;
									users[obj['id_1']] = {'id':obj['id_1'],'socket':socket.id,'user':user1}
									listSocket[socket.id] = obj['id_1'];
								}*/
								msgModel.find({'id_dialog':objFind['_id']})
								.sort({'_id':-1})
								.limit(100)
								.exec(function(err, msg) {
									var res = msg.reverse()
									 /*mongoose.disconnect();*/
									if (err) throw err;
								    socket.emit('load_old_message',res);
								});
							})
						});
					}
				//	con.end();
				});
			}

		});
		
	})
	socket.on('typing', (obj) => {
		if(typeof users[obj['id_2']] != 'undefined' && obj['id_2'] != null){
			var socketUser2 = users[obj['id_2']];
			var objSend = {'typingBool':obj['typing'],'id_dialog':obj['id_dialog']};
			try {
				io.sockets.connected[socketUser2['socket']].emit('is_typing', objSend );
			}catch(err){
			//	console.log(err)
			}
		}
	})


	socket.on('delete msg', (obj)=>{
		msgModel.remove({id_dialog:obj['id_dialog'],_id:obj['id_msg']}, function(err, result){
		    if(err) return console.log(err);
		    console.log(result)
		    if(result){
		    	socket.emit('new delete message',obj)
		    	if( users[obj['id_2']] ){
					var socketUser2 = users[obj['id_2']];
					try {
						io.sockets.connected[socketUser2['socket']].emit('new delete message', obj );
					}catch(err){
					//	console.log(err)
					}
				}
		    }
		});
	})


	socket.on('sendMsg', (obj)=>{
		var read = false;
		var date = new Date();
		var dateFormated = date.toISOString().substr(0,10);
		var time = date.toLocaleTimeString();
		var id_msg;
		var newMessageModel = new msgModel();
			msgModel.create({
				id_dialog:obj['id_dialog'],
				msg: obj['msg'],
				id_1:obj['id_1'],
				id_2:obj['id_2'],
				user_1:obj['user_1'],
				user_2:obj['user_1'],
				id_author:obj['id_author'],
				time:time,
				date:dateFormated,
				read:read
			}, function (err, msg) {
				if (err){ return err}
					var id_msg = msg.id;
				console.log(msg.id)
				//console.log("Сохранен объект");
			});


	
			var msgObj = {
				"id_msg":id_msg,
				"id_dialog":obj['id_dialog'],
				"msg":obj['msg'],
				"id_1":obj['id_1'],
				"id_2":obj['id_2'],
				"user_1":obj['user_1'],
				"user_2":obj['user_1'],
				"id_author":obj['id_author'],
				"time":time,
				"date":dateFormated,
				"read":false
			}		

		if(users[obj['id_2']]){
			try {
				socketUser2 = users[obj['id_2']]
				/*if( users[obj['id_2']]['id_dialog'] == obj['id_dialog']){read = true;msgObj['read'] = true;}*/
				io.sockets.connected[socketUser2['socket']].emit('getMsg',msgObj);
				io.sockets.connected[socketUser2['socket']].emit('newMsgDialog',msgObj);
				
			} catch (err) {
				//console.log(err)
			}
		}
		socket.emit('getMsg',msgObj);

		
	})

	socket.on('seen message dialog',(obj)=>{

		if(obj['id_2'] == obj['last_msg_author']){
			msgModel.update({read: false,id_author:obj['id_2'],id_dialog:obj['id_dialog']}, {read: true},{ multi: true }, function(err, result){
			    if(err) return console.log(err);
			});
			if(users[obj['id_2']]){	
				try {
					io.sockets.connected[users[obj['id_2']]['socket']].emit('user see you message',{id_dialog:obj['id_dialog']});				
								
				} catch (err) {
					//console.log(err)
				}
			}
			socket.emit('user see you message',{id_dialog:obj['id_dialog']});	
		}
	})





	socket.on('disconnect',(sock)=>{
		
		delete users[listSocket[socket.id]]
	})
});








