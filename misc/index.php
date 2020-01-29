<html>
 <head>
  <title>DS1 Tracker</title>
    <meta http-equiv="refresh" content="30"/>
    <link rel="stylesheet" href="style.css"/>    
 </head>
 <body>
 <?php 
 $sat_id = 25544;
 $api_key = "KVQ6HT-GP7RUV-8CJ9Z9-49DE";
 $ch = curl_init("https://www.n2yo.com/rest/v1/satellite/tle/" . $sat_id . "&apiKey=" . $api_key); 
 curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
 curl_setopt($ch, CURLOPT_HEADER, 0);
 $json = curl_exec($ch);
 curl_close($ch);
?> 
 <script type="text/javascript">var json = <?php echo $json; ?>;</script>
 <script type="text/javascript" src="./app.js"></script> 
 </body>
</html>

