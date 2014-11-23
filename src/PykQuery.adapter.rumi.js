PykQuery.adapter = PykQuery.adapter || {};
PykQuery.adapter.rumi = {};

PykQuery.adapter.rumi.init = function(pykquery_json) {

  response = ajax_query_pykquery(pykquery_json);
  //might have to do JSON.parse(response)
  console.log(pykquery_json);
  return response;

}

var ajax_query_pykquery = function(pykquery_json) {
  var xmlhttp;

  if (window.XMLHttpRequest) {
    // code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  } else {
    // code for IE6, IE5
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }

  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 ) {
      if(xmlhttp.status == 200){
        return xmlhttp.responseText;
      }
      else if(xmlhttp.status == 400) {
        console.error('There was an error 400');
      }
      else {
        console.error('something else other than 200 was returned');
      }
    }
  }

  xmlhttp.open("POST", "filter/get_data", false);
  xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xmlhttp.send(JSON.stringify(pykquery_json));
  xmlhttp.send();
}
