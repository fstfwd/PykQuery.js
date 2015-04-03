PykQuery.adapter = PykQuery.adapter || {};
PykQuery.adapter.db = {};

PykQuery.adapter.db.init = function(pykquery_json,table_name, queryable_filters) {

  this.call = function(onComplete) {
    var xmlhttp;

    if(table_name) {
      pykquery_json["filters"] = queryable_filters;
      var data = {
        config: pykquery_json
      };
    } else {
      return false;
    }

    if (window.XMLHttpRequest) {
      xmlhttp=new XMLHttpRequest();
    } else {
      xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState==4 && (xmlhttp.status==200 || xmlhttp.status==201)) {
        onComplete(JSON.parse(xmlhttp.response));
      }
    }
    xmlhttp.open("POST",db_api_endpoint + table_name + "filter/show",true);
    xmlhttp.send(JSON.stringify(data));
  }
}
