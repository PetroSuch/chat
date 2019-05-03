<?php
header('Access-Control-Allow-Origin: *');  
ini_set('post_max_size', '100M'); 
ini_set('upload_max_filesize', '100M');
ini_set('max_file_uploads', 10);
require('UploadForm.php');
require('db.php');
$pathUpload = "pics";
$allowed_img = array("jpeg", "gif", "png", "jpg");
$allowed_file = array("doc", "xml", "zip", "pdf", "docx", "txt");
$response = [/*'status'=>false,*/'upload'=>[]];
if(count($_FILES) > 0){
	$files = $_FILES;
	$url_chat = $_POST['url_chat'];
	$sql = "SELECT * FROM users_chat WHERE room=".$url_chat;
	$date = NULL;
	$conn->query($sql);
	if ($result->num_rows > 0) {
	    while($row = $result->fetch_assoc()) {
	    	if($rom['folder-path'] != NULL){
	    		$date = $row['folder-path'];
	    	}
	    }
	}
	if($date == NULL){
		$date = date('Y-m');
		$sql2 = "UPDATE `users_chat` SET `folder-file` ='".$date."' WHERE `users_chat`.`room`=".$url_chat;	
		$conn->query($sql2);
	}
	$file_upload = [];
	foreach ($files as $key => $value) {
		$file = $files[$key];
		$ext = explode('.', $file['name']);
		$ext = $ext[count($ext)-1];
		$response['name'] = $file['name'];
		$response['ext'] = $ext;
		
		$new_name = time()+sha1($file['name']);
		//if(in_array($ext, $allowed_file) || in_array($ext, $allowed_img)){
			$upload = new UploadForm();
			$upload->loadFile($file);
			$upload->createFolder($pathUpload.'/'.$date);
			$upload->createFolder($pathUpload.'/'.$date.'/'.$url_chat);
		//	$response['status'] = false;
			$arr = [
				'file_name' => $new_name.'.'.$ext,
				'file_path'=>$pathUpload.'/'.$date.'/'.$url_chat.'/'.$new_name.'.'.$ext,
				'date'=>$date,
				'type'=>in_array($ext, $allowed_img)?'img':'file',
				'file_path'=>$pathUpload.'/'.$date.'/'.$url_chat.'/'.$new_name.'.'.$ext,
			];
			array_push($file_upload,  $arr);
			$upload->upload($pathUpload.'/'.$date.'/'.$url_chat.'/'.$new_name.'.'.$ext);
		/*}else{
			$response['status'] = false;
			$response['msg'] = $ext.' not allow upload';
		}*/
	}
	$response['upload'] = $file_upload;
	
}
echo json_encode($response);
?>