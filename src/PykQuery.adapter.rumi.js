PykQuery.adapter = PykQuery.adapter || {};
PykQuery.adapter.rumi = {};

PykQuery.adapter.rumi.init = function(pykquery_json,rumi_params) {

  this.call = function(onComplete) {
    var xmlhttp, response;
    //console.log(pykquery_json,rumi_params)
    if(rumiParameterValidation(rumi_params)) {
      var data = { "config": pykquery_json,
        "filename":rumi_params["filename"],
        "username":rumi_params["username"],
        "projectname":rumi_params["projectname"] };
    } else {
      return false;
    }
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
          onComplete(response);
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
    xmlhttp.send(data);
  }

  var rumiParameterValidation = function(params){
    var util = new PykUtil.init();
    console.log(util.isBlank(params))
    if (params == undefined) {
      console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "Empty rumi parameter object is not allowed.")
      return false;
    }
    if(util.isBlank(params['filename'])){
      console.log('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "filename missing in rumi parameter");
      return false;
    } 
    if(util.isBlank(params['username'])){
      console.log('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "username missing in rumi parameter");
      return false;
    }
    if(util.isBlank(params['projectname'])){
      console.log('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "projectname missing in rumi parameter");
      return false;
    }
    return true;
  }
}
