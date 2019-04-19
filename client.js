//956107799194-vnbcq8gk3efjtjo5g28rijknu4o8tnsv.apps.googleusercontent.com
//4kW__Hun48X6tqzfohUMC8p_
var HOST = 'ws://translate-chat-online.herokuapp.com:3000';
var ws = new WebSocket(HOST);
var el = document.getElementById('server-time');
ws.onmessage = function (event) {
  el.innerHTML = 'Server time: ' + event.data;
};
var port =  3000;
//const socket = io.connect('http://localhost:'+port);
const socket = io();
console.log(socket)
const url = new URL(document.location); 

console.log(localStorage)
function onSignIn(googleUser) {
	var profile = googleUser.getBasicProfile();
	var obj = {'data_type':'signin','name':profile.getName(),'email':profile.getEmail(),'image': profile.getImageUrl(),'lang':$('#lang').val()}
	socket.emit('signin',obj)
}
$(document).ready(()=>{
	if(localStorage.getItem('lang') != null){
		$('#lang').find('option[value="'+localStorage.getItem('lang')+'"]').prop('selected','selected')
	}
	
	/*localStorage.removeItem('id_user');
   localStorage.removeItem('id_chat');
   localStorage.removeItem('url_chat');
   console.log(localStorage)
   return false ;*/
	if(localStorage.getItem('id_user') == null){
		$('#chat').hide()
		$('.g-signin2').show()
	}else{
		$('#chat').show()
		$('.g-signin2').hide()
	}
	socket.on('connect', function(data) {
		console.log('connect',data)
		if(localStorage.getItem('id_user') != null && url.searchParams.get('url_chat') == null){
			socket.emit('client_new_user',{'lang':$('#lang').find('option:selected').val(),'id_user':localStorage.getItem('id_user')});
		}else if(localStorage.getItem('id_user') != null){
			socket.emit('client_new_user',{'id_chat':localStorage.getItem('id_chat'),'url_chat':url.searchParams.get('url_chat'),'id_user':localStorage.getItem('id_user'),'lang':$('#lang').find('option:selected').val()});
		}
	});
    socket.on('user_is_signin',function(data){
    	console.log('user_is_signin',data)
		localStorage.setItem('id_user',data.id_user)
		$('#chat').show()
		$('.g-signin2').hide()
		if(localStorage.getItem('id_user') != null && url.searchParams.get('url_chat') == null){
			socket.emit('client_new_user',{'lang':$('#lang').find('option:selected').val(),'id_user':localStorage.getItem('id_user')});
		}else{
			socket.emit('client_new_user',{'id_chat':localStorage.getItem('id_chat'),'url_chat':url.searchParams.get('url_chat'),'id_user':localStorage.getItem('id_user'),'lang':$('#lang').find('option:selected').val()});
		}
    })
   socket.on('server_new_chat_data', function(data) {
   	  console.log('server_new_chat_data',data)
      localStorage.setItem('id_chat',data.id_chat)
      localStorage.setItem('url_chat',data.url_chat)
      localStorage.setItem('id_user',data.id_user)
      localStorage.setItem('lang',data.lang)
      insertParam('url_chat',localStorage.getItem('url_chat'))
      loadMsgChat(socket)
   });

   socket.on('server_get_chat_msg', function(data) {
   		console.log('server_get_chat_msg',data)
        $('#msg').html('')
       	var lang = localStorage.getItem('lang') != null? localStorage.getItem('lang'):$('#lang').val()
		$.each(data,(k,v)=>{
			console.log(k)
			var msg = $('#msg_html').find('#from').eq(0).clone()
			if(data[k]['msg_from'] == localStorage.getItem('id_user')){
				msg = $('#msg_html').find('#my').eq(0).clone()
			}
			var msgTxt = JSON.parse(data[k].msg);
				msgTxt = msgTxt[lang]
			msg.removeAttr('style').find('p').text(msgTxt)
			$('#msg').prepend(msg)
		})
   });

   socket.on('server_new_msg',(data)=>{
   	console.log('server_new_msg',data)
	var msg = $('#msg_html').find('#from').eq(0).clone()
		if(data['msg_from'] == localStorage.getItem('id_user')){
			msg = $('#msg_html').find('#my').eq(0).clone()
		}
		$.each(data['msg'],function(k,v){

		if(k == $("#lang").val()){
			msg.removeAttr('style').find('p').text(data['msg'][k])
		}
	})
	msg.find('.time-right').text(data['date'])
	$('#msg').prepend(msg)
   })
    socket.on('test_emit',(data)=>{
      console.log(data)
    })
   $('#send').click(function(event){
      if($('#message').val().length > 1 ){
         socket.emit('client_send_new_msg',{"date":dateTime(),"id_user":localStorage.getItem('id_user'),'url_chat':localStorage.getItem('url_chat'),'msg':$("#message").val(),'lang':$('#lang option:selected').attr('value')})
         $('#message').val('')
      }
   })
   $('#message').keypress(function (e) {
     if (e.which == 13 && $('#message').val().length > 1) {
        socket.emit('client_send_new_msg',{"date":dateTime(),"id_user":localStorage.getItem('id_user'),'url_chat':localStorage.getItem('url_chat'),'msg':$("#message").val(),'lang':$('#lang option:selected').attr('value')})
        $('#message').val('')
     }
   });
   $('#lang').on('change',function(){
   	 localStorage.setItem('lang',$(this).val())
      socket.emit('client_change_lang',{id_user:localStorage.getItem('id_user'),lang:$(this).val()})
   })
   
})

function dateTime(){
   var d = new Date();
   return d.getHours()+':'+d.getMinutes()
}

function loadMsgChat(socket){
   socket.emit('client_load_chat_msg',{"id_chat":localStorage.getItem('url_chat'),"url_chat":localStorage.getItem('url_chat')})
}

function insertParam(key, value){
    const params = new URLSearchParams(location.search);
    params.set(key, value);
    window.history.replaceState({}, "", decodeURIComponent(`${location.pathname}?${params}`));
}
