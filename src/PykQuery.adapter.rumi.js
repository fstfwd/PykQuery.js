PykQuery.adapter = PykQuery.adapter || {};
PykQuery.adapter.rumi = {};

PykQuery.adapter.rumi.init = function(pykquery_json) {

  this.call = function(pykquery_json) {
    var xmlhttp, response;

    if (window.XMLHttpRequest) {
      // code for IE7+, Firefox, Chrome, Opera, Safari
      xmlhttp = new XMLHttpRequest();
    } else {
      // code for IE6, IE5
      xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == 4 ) {
        if(xmlhttp.status == 201){
          response = xmlhttp.responseText;
          console.log(xmlhttp.responseText, response);
          return response;
        }
        else if(xmlhttp.status == 400) {
          console.error('There was an error 400');
        }
        else {
          console.error('something else other than 200 was returned');
        }
      }
    }

    xmlhttp.open("POST", "http://192.168.0.121:9292/v1/filter/show", false);
    xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    console.log(response, "------response");
    xmlhttp.send(JSON.stringify(pykquery_json));
  }
}