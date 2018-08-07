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
  con.end()
  console.log("Connected Mysql!");
});


var uri = "mongodb://root:aezakmi1@ds235711.mlab.com:35711/kiril";
var options = {
	useNewUrlParser: true 
};
var mongoose = require("mongoose");
	mongoose.connect(uri,options);
/*MongoClient.connect(uri, function(err, db) {
  if (err) throw err;
  var dbo = db.db("kiril");
  dbo.collection("messages").findOne({}, function(err, result) {
    if (err) throw err;
    console.log(result);
    db.close();
  });s
});*/

var Schema =  mongoose.Schema;

var msgScheme = new Schema({
	id_dialog:String,
    msg: String,
    read:Boolean,
    id_1:Number,
	id_2:Number,
	user_1:Object,
	user_2:Object,
	time:String,
	date:String
},{timestamps: true});


var dialogSchema = new Schema({
	id_1:Number,
    id_2: Number,
    user1: {
    	id:Number,
    	name:String,
    	phone:Number,
    	img:String,
    	date_edit:String
    },
    user2:{
    	id:Number,
    	name:String,
    	phone:Number,
    	img:String,
    	date_edit:String
    }
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
			
			console.log(objFind)
			console.log(err)
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
						if(objFind[k]['_id'] == msg[j]['id_dialog']){
							push['last_msg'] = msg[j];
							break;
						}
					}
					for(j in msg){
						if(objFind[k]['_id'] == msg[j]['id_dialog'] && msg[j]['read'] == false){
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
		socket.id_1 = obj['id_1'];
		var user1 = obj['user1'];
		users[obj['id_1']] = {'id':obj['id_1'],'socket':socket.id,'user':user1}
		listSocket[socket.id] = obj['id_1'];
	})

	socket.on('find dialog', (obj)=>{
		var id_1 = obj['id_1']?obj['id_1']:null;
		var id_2 = obj['id_2']?obj['id_2']:null;
		console.log(obj)
		console.log('load dialog')
		dialogModel.findOne({$or: [{'id_1':id_1,'id_2':id_2},{'id_2':id_1,'id_1':id_2}]}, function (err, objFind) {
			 mongoose.disconnect();
				console.log(objFind)
			if(objFind){
				socket.emit('result_find_dialog',objFind)
				socket.id_1 = obj['id_1'];
				var user1 = objFind.user1.id==obj['id_1']?objFind.user1:objFind.user2;
				users[obj['id_1']] = {'id':obj['id_1'],'socket':socket.id,'user':user1}
				listSocket[socket.id] = obj['id_1'];
				msgModel.find({'id_dialog':objFind['_id']})
				.sort( [['_id', 1]] )
				.limit(100)
				.exec(function(err, msg) {
					 mongoose.disconnect();
				//	mongoose.connection.close()
					if (err) throw err;
				    socket.emit('load_old_message',msg);
				});
				msgModel.update({read: false}, {read: true}, function(err, result){
					 mongoose.disconnect();
     				if(err) return console.log(err);
				    console.log(result);
				});

			}else{
			

				con.query("SELECT id,name,phone,img,date_edit FROM user WHERE id IN ('"+id_1+"','"+id_2+"')", function (err, result, fields) {
					
					if(err) throw err;
					if(result.length > 1){
						var newDialogModel = new dialogModel();
						dialogModel.create({
							id_1:result['0'].id,
							id_2:result['1'].id,
							user1: result['0'],
							user2: result['1']
							}, function (err, small) {
							mongoose.disconnect();
							if (err){ return err}

							dialogModel.findOne({$or: [{'id_1':obj['id_1'],'id_2':obj['id_2']},{'id_2':obj['id_1'],'id_1':obj['id_2']}]}, function (err, objFind) {
								socket.emit('result_find_dialog',objFind)
								socket.id_1 = obj['id_1'];
								var user1 = objFind.user1.id==obj['id_1']?objFind.user1:objFind.user2;
								users[obj['id_1']] = {'id':obj['id_1'],'socket':socket.id,'user':user1}
								listSocket[socket.id] = obj['id_1'];
								msgModel.find({'id_dialog':objFind['_id']})
								.sort( [['_id', 1]] )
								.limit(100)
								.exec(function(err, msg) {
									 mongoose.disconnect();
									if (err) throw err;
								    socket.emit('load_old_message',msg);
								});
								msgModel.update({read: false}, {read: true}, function(err, result){
									 mongoose.disconnect();
				     				if(err) return console.log(err);
								    console.log(result);
								});
							})
						});
					}
					con.end();
				});
			}

		});
		
	})
	socket.on('typing', (obj) => {
		if(typeof users[obj['id_2']] != 'undefined' && obj['id_2'] != null){
			var socketUser2 = users[obj['id_2']];
			var objSend = {'typingBool':obj['typing']};
			try {
				io.sockets.connected[socketUser2['socket']].emit('is_typing', objSend );
			}catch(err){
			//	console.log(err)
			}
		}
	})



	/*socket.on('addUserDialog', (obj) => {
		
		
	});*/

	socket.on('sendMsg', (obj)=>{
		var date = new Date();
			var dateFormated = date.toISOString().substr(0,10);
			var time = date.toLocaleTimeString();
			var msgObj = {
				"msg":obj['msg'],
				"id_1":obj['id_1'],
				"id_2":obj['id_2'],
				"user_1":obj['user_1'],
				"user_2":obj['user_1'],
				"time":time,
				"date":dateFormated,
			}
		

		
		var read = false;

		if(users[obj['id_1']] && users[obj['id_2']] && obj['id_1'] != null ){
			try {
				socketUser2 = users[obj['id_2']]
				io.sockets.connected[socketUser2['socket']].emit('getMsg',msgObj );
				read = true;
			} catch (err) {
				//console.log(err)
			}
			
		}else{
			socket.id_1 = obj['id_1'];
			users[obj['id_1']] = {'id':obj['id_1'],'socket':socket.id,'user':obj['user_']}
			listSocket[socket.id] = obj['id_1'];
			
			if(users[obj['id_2']]){
				try {
					socketUser2 = users[obj['id_2']]
					io.sockets.connected[socketUser2['socket']].emit('getMsg',msgObj );
					read = true;
				} catch (err) {
					//console.log(err)
				}
			}
			
			//io.sockets.emit('userDialog',{'user':false,'connect':false});
		}
		var newMessageModel = new msgModel();
		msgModel.create({
			id_dialog:obj['id_dialog'],
			msg: obj['msg'],
			id_1:obj['id_1'],
			id_2:obj['id_2'],
			user_1:obj['user_1'],
			user_2:obj['user_1'],
			time:time,
			date:dateFormated,
			read:read
		}, function (err, small) {
			if (err){ return err}
			//console.log(read)
			//console.log("Сохранен объект");
		});
		socket.emit('getMsg',msgObj);

		
		
	})

	socket.on('disconnect',(sock)=>{

		console.log(socket.id)
		delete users[listSocket[socket.id]]
	})
});








