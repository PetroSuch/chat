<?php
require('db.php');
header('Access-Control-Allow-Origin: *');  
require('UploadForm.php');
$url_chat = isset($_POST['url_chat'])?$_POST['url_chat']:'';
$id_user = isset($_POST['id_user'])?$_POST['id_user']:'';
$conf = isset($_POST['conf'])?$_POST['conf']:'';

if($url_chat == '' || $id_user == '' || $conf == ''){
	return false;
}
$date = NULL;
$sql = "SELECT * FROM `users_chat` WHERE room='".$_POST['url_chat']."'";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
    	$date = $date == NULL && $row['folder-file'] != NULL?$row['folder-file']:NULL;
        if($row['id_user'] == $id_user){
        	$sql2 = "DELETE FROM `users_chat` WHERE id_user=".$id_user." AND room='".$url_chat."'";
        	$result2 = $conn->query($sql2);
        	if($result->num_rows == 1){
        		$upload = new UploadForm();
        		if($date != NULL){
        			$files = glob("pics/".$date."/".$url_chat."/*"); 
					foreach($files as $file){
					  if(is_file($file))
					    unlink($file);
					}
					if(is_dir("pics/".$date."/".$url_chat)){
		               	rmdir("pics/".$date."/".$url_chat);
					}
        		}
        		$sql3 = "DELETE FROM `message` WHERE chat_id='".$url_chat."'";
        		$result3 = $conn->query($sql3);
        	}
        }
    }
}
?>