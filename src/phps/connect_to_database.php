<?php

$host = "localhost";
$username = "postgres";
$password = "1qaz2wsx3edc";
$database = "miniverse";

// Create connection
$db = pg_connect("host=".$host." port=5432 dbname=".$database." user=".$username." password=".$password);

// Check connection
if(!$db){
      echo "Error : Unable to open database"."<br>";;
   } else {
    //   echo "Opened database successfully"."<br>";;
   }

?>
