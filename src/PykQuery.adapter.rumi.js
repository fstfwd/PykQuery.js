PykQuery.adapter = PykQuery.adapter || {};
PykQuery.adapter.rumi = {};

PykQuery.adapter.rumi.init = function(pykquery_json,rumi_params, queryable_filters) {

  this.call = function(onComplete) {
    var xmlhttp;

    if(rumi_params) {
      pykquery_json["filters"] = queryable_filters;
      var data = "config="+JSON.stringify(pykquery_json)+"&token="+gon.token;
      // var data = {
      //   config: pykquery_json,
      //   token: gon.token
      // };
    } else {
      return false;
    }

    if (window.XMLHttpRequest) {
      xmlhttp=new XMLHttpRequest();
    } else {
      xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
        onComplete(res);
      }
    }
    xmlhttp.open("POST",rumi_api_endpoint + rumi_params + "filter/show",true);
    xmlhttp.send(data);

    // $.ajax({
    //   url: rumi_api_endpoint + rumi_params + "filter/show",
    //   data: data, //return  data
    //   dataType: 'json',
    //   type: 'POST',
    //   async: true,
    //   success: function (res) {
    //     onComplete(res);
    //   },
    //   error: function () {
    //     console.log('Save error.');
    //   }
    // });
  }
}
