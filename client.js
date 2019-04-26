//956107799194-vnbcq8gk3efjtjo5g28rijknu4o8tnsv.apps.googleusercontent.com
//4kW__Hun48X6tqzfohUMC8p_
const socket = io.connect();
$(document).ready(()=>{
/*   localStorage.removeItem('id_user');
   localStorage.removeItem('id_chat');
   localStorage.removeItem('url_chat');
   console.log(localStorage)
   return false ;*/
	const url = new URL(document.location); 
	var count_msg = 0;
	var chat = {
		messageToSend: '',
		fileUpload: [],
		init: function() {
		  this.cacheDOM();
		  this.bindEvents();
		  if(localStorage.getItem('lang') != null){
			this.$lang.find('option[value="'+localStorage.getItem('lang')+'"]').prop('selected','selected')
		  }
		  if(url.searchParams.get('url_chat') != null){
		  	localStorage.setItem('url_chat',url.searchParams.get('url_chat'))
		  }
		  if(localStorage.getItem('id_user') == null){
			$('#chat').hide()
		    $('.g-signin2').show()
		  }else{
			$('#chat').show()
			//$('.g-signin2').hide()
		  }
		},
		cacheDOM: function() {
		  this.$chatHistory = $('.chat-history');
		  this.$button = $('button');
		  this.$create_new = $('#create-new');
		  this.$textarea = $('#message-to-send');
		  this.$chatHistoryList =  this.$chatHistory.find('ul');
		  this.$lang =  $("#lang");
		  this.$file =  $("#upload-file");
		},
		bindEvents: function() {
		  this.$button.on('click', this.addMessage.bind(this));
		  this.$textarea.on('keyup', this.addMessageEnter.bind(this));
		  this.$file.on('change', this.userLoadFile.bind(this));
		  this.$create_new.on('click', this.createNewDialog.bind(this));
		  var $this = this;
		  $(document).on('click','li#chat_dialog', function(){
		  	localStorage.setItem('url_chat',$(this).attr('chat_id'))
		  	$('li.chat_dialog').removeClass('active')
		  	$(this).addClass('active')
		  	$this.loadMsgChat($(this).attr('chat_id'))
		  	insertParam('url_chat',$(this).attr('chat_id'))
		  });
		   this.$lang.on('change',function(){
		   	 localStorage.setItem('lang',$(this).val())
		     socket.emit('client_change_lang',{"chat_url":localStorage.getItem('url_chat'),"id_user":localStorage.getItem('id_user'),"lang":$(this).val()})
		   })
		},
		render: function(from) {
		  this.scrollToBottom();
		  if (this.messageToSend.trim() !== '') {
		  	this.$textarea.val('');     
		    var template = from == 1?Handlebars.compile( $("#message-template").html()):Handlebars.compile( $("#message-response-template").html());
		    var context = { 
		      messageOutput: this.messageToSend,
		      time: this.messageToSendDate
		    };
		    count_msg += 1;
			$('.chat-num-messages').text('already '+count_msg+' messages')
		    this.$chatHistoryList.append(template(context));
		    this.scrollToBottom();  
		  }
		},
		addMessage: function() {
			if(this.fileUpload.length == 0){
				this.messageToSend = this.$textarea.val()
				this.$textarea.val('')
				socket.emit('client_send_new_msg',{"date":chat.getCurrentTime(),"id_user":localStorage.getItem('id_user'),'url_chat':localStorage.getItem('url_chat'),'msg':this.messageToSend,'lang':chat.$lang.val()})
		
			}else{
				var fd = new FormData;
					fd.append('file',this.fileUpload)
				$.ajax({
			        type: "POST",
			        url: "./function_php/upload_file.php",
			        data: fd,
			        cache: false,
			        contentType: false,
			        processData: false,
			        timeout: 60000,
			        success: function (data) {
			            // your callback here
			            console.log(data)
			        },
			        error: function (error) {
			            // handle error
			            console.error(error)
			        }
			    });
			}
		},
		userLoadFile: function(event){
			console.log(event.target.files)
			var file = event.target.files[0];
			$('#name_file').text(file.name)
			this.fileUpload = event.target.files[0];
		},
		loadOldMessage: function(obj){
			console.log('old msg', obj)
			this.$chatHistoryList.html('')
			var lang = localStorage.getItem('lang') != null?localStorage.getItem('lang'):chat.$lang.val()
			$.each(obj,(k,v)=>{
				this.messageToSend = JSON.parse(obj[k]['msg'])
				this.messageToSend = obj[k]['msg_from'] == localStorage.getItem('id_user')?this.messageToSend['original']:this.messageToSend[lang]
				this.messageToSendDate = obj[k]['date']
				if(this.messageToSend){
					var from = localStorage.getItem('id_user') == obj[k]['msg_from']?1:2;
					this.render(from)
				}			
			})
		},
		addMessageEnter: function(event) {
		    if (event.keyCode === 13) {
		      this.addMessage();
		    }
		},
		scrollToBottom: function() {
		   this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
		},
		getCurrentTime: function() {
		  return new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
		},
		loadMsgChat: function (url_chat){
		   socket.emit('client_load_chat_msg',{"url_chat":url_chat})
		},
		loadMyDialog: function(obj){
			$('#list-dialog').find('li[chat_id]').remove()
			$.each(obj['chats'],function(k,v){
				var bool = false;
				$.each(obj['users'],function(k2,v2){
					if(obj['users'][k2]['room'] == obj['chats'][k]['room'] && obj['users'][k2]['id'] != localStorage.getItem('id_user')){
						bool = true;
						var ch = $('#chat_dialog').clone().removeAttr('style').attr({'chat_id':obj['chats'][k]['room'],'id_user':obj['users'][k2]['id']})
							ch.find('.name').text(obj['users'][k2]['name'])
							ch.find('img').attr('src',obj['users'][k2]['image'])
							ch.find('#status').text(obj['users'][k2]['online']?obj['users'][k2]['online']:'')
							if(obj['chats'][k]['unread'] > 0){
								ch.find('#new_msg').show().text(obj['chats'][k]['unread'])
							}
							
						$('#list-dialog').append(ch)
					}
				})
				if(bool == false){
					$.each(obj['users'],function(k2,v2){
						if(obj['users'][k2]['room'] == obj['chats'][k]['room'] && obj['users'][k2]['id'] == localStorage.getItem('id_user')){
							var ch = $('#chat_dialog').clone().removeAttr('style').attr({'chat_id':obj['chats'][k]['room'],'id_user':obj['users'][k2]['id']})
								ch.find('.name').text('0 users')
								ch.find('img').attr('src','https://codeseller.ru/wp-content/uploads/2018/04/target-blue-300x300.png')
							$('#list-dialog').append(ch)
						}
					})
				}
			})
			if(localStorage.getItem('url_chat') != null){
				$("#chat_dialog").removeClass('active')
				insertParam('url_chat',localStorage.getItem('url_chat'))
				$("#chat_dialog[chat_id='"+localStorage.getItem('url_chat')+"']").addClass('active')
			}
		},
		chatUsersInfo(obj){
			console.log('chatUserInfo')
			var bool = true;
			$('.chat-header').hide()
			$('.chat-message').show()
			for(var k in obj['chat_users']){
				if(obj['chat_users'][k]['id'] != +localStorage.getItem('id_user')){
					$('.chat-header').show()
					$('.chat-with').text('Chat with '+obj['chat_users'][k]['user_name'])
					$('#img-user').attr('src',obj['chat_users'][k]['user_image'])
					bool = false;
				}
				if(obj['chat_users'][k]['id'] == +localStorage.getItem('id_user')){
					localStorage.setItem('lang',obj['chat_users'][k]['lang'])
					this.$lang.val(obj['chat_users'][k]['lang'])
				}
			}
			if(bool){
				$('.chat-header').hide()
			}
			count_msg = obj.messages.length;
			$('.chat-num-messages').text('already '+count_msg+' messages')
			
		},
		loadListDialog: function(socket,id_user){
			socket.emit('client_load_list_dialog',{'id_user':id_user})
		},
		createNewDialog: function(){
			socket.emit('client_create_new_dialog',{'id_user':localStorage.getItem('id_user'),'lang':chat.$lang.val()})
		}
	};
	chat.init();
	
	socket.on('connect', function(data) {
		if(localStorage.getItem('id_user') != null){
			chat.loadListDialog(socket,localStorage.getItem('id_user'))
		}
		if(localStorage.getItem('url_chat') != null && url.searchParams.get('url_chat') != null){
			chat.loadMsgChat(localStorage.getItem('url_chat'))
		}
	});
	socket.on('reloadInf',(data)=>{
		console.log('reload',data)
		if(data.type == 'list-dialog'){
			if(data.url_chat != undefined){
				chat.loadMsgChat(data.url_chat)
			}
			chat.loadListDialog(socket,localStorage.getItem('id_user'))
		}
	})
	socket.on('online_status',(data)=>{
		//console.log('online status',data)
		if(data.status == ''){
			$('#chat_dialog[id_user="'+data.id_user+'"]').find('#status').text('')
		}
		if(data.status == 'online'){
			$('#chat_dialog[id_user="'+data.id_user+'"]').find('#status').text('online')
		}
	})

	socket.on('is_create_new',(data)=>{

	})
	socket.on('server_load_list_dialog',(data)=>{
		console.log('server_load_list_dialog',data)
		chat.loadMyDialog(data)
	})
	socket.on('user_is_signin',function(data){
		localStorage.setItem('id_user',data.id_user)
		$('#chat').show()
		//$('.g-signin2').hide()
		if(localStorage.getItem('id_user') != null && url.searchParams.get('url_chat') == null){
			socket.emit('client_load_dialog',{'lang':chat.$lang.val(),'id_user':localStorage.getItem('id_user')});
		}else{
			socket.emit('client_load_dialog',{'url_chat':url.searchParams.get('url_chat'),'id_user':localStorage.getItem('id_user'),'lang':chat.$lang.val()});
		}
	})
	socket.on('server_new_chat_data', function(data) {
	  console.log('server_new_chat_data',data)
	  chat.loadListDialog(socket,data.id_user)
	  if(data.url_chat != null){
	  	localStorage.setItem('url_chat',data.url_chat)
	  	localStorage.setItem('id_user',data.id_user)
	  	insertParam('url_chat',localStorage.getItem('url_chat'))
	  	chat.loadMsgChat(localStorage.getItem('url_chat'))
	  }
	  
	});
	socket.on('server_get_chat_msg', function(data) {
		 if(data['chat_users']){
	    	chat.chatUsersInfo(data)
	    } 
	    if(data['messages']){
	    	$('#msg').html('')
	    	chat.loadOldMessage(data['messages'])
	    }
	    
	});

   socket.on('server_new_msg',(data)=>{
   	console.log('new msg',data)
		$.each(data['msg'],function(k,v){
			if(k == chat.$lang.val()){
				chat.messageToSend = data['msg'][k]
			}
		})
		chat.messageToSendDate = data['date']
		if(data.url_chat == localStorage.getItem('url_chat')){
			if(data['msg_from'] == localStorage.getItem('id_user')){
				chat.render(1)
			}else{
				chat.render(2)
			}
		}else{
			var count = +$('#chat_dialog[chat_id="'+data.url_chat+'"]').find('#new_msg').text()+1;
			$('#chat_dialog[chat_id="'+data.url_chat+'"]').find('#new_msg').show().text(count)
			$('title').text('Real Time Chat (1)')
		}
		
   })
})
function onSignIn(googleUser) {
	var profile = googleUser.getBasicProfile();
	var obj = {'data_type':'signin','name':profile.getName(),'email':profile.getEmail(),'image': profile.getImageUrl(),'lang':$('#lang').val()}
	socket.emit('signin',obj)
}

function insertParam(key, value){
    const params = new URLSearchParams(location.search);
    params.set(key, value);
    window.history.replaceState({}, "", decodeURIComponent(`${location.pathname}?${params}`));
   // location.reload()
}

