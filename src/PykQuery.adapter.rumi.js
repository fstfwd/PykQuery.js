PykQuery.adapter = PykQuery.adapter || {};
PykQuery.adapter.rumi = {};

PykQuery.adapter.rumi.init = function(pykquery_json,rumi_params, queryable_filters) {

  this.call = function(onComplete) {
    var xmlhttp;

    if(rumi_params) {
      pykquery_json["filters"] = queryable_filters;
      // var data = "config="+JSON.stringify(pykquery_json)+"&token="+gon.token;
      var data = {
        config: pykquery_json,
        token: gon.token
      };
    } else {
      return false;
    }

    // if (window.XMLHttpRequest) {
    //   xmlhttp=new XMLHttpRequest();
    // } else {
    //   xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    // }
    // xmlhttp.onreadystatechange = function () {
    //   if (xmlhttp.readyState==4 && xmlhttp.status==200) {
    //     onComplete(res);
    //   } else {
    //     console.log(xmlhttp.readyState,xmlhttp.status)
    //   }
    // }
    // console.log(pykquery_json)
    // xmlhttp.open("POST",rumi_api_endpoint + rumi_params + "filter/show",true);
    // xmlhttp.setRequestHeader('X-PINGOTHER', 'pingpong');
    // xmlhttp.setRequestHeader("Content-Type","application/json; charset=UTF-8");
    // var xyz = {
    //   "config": pykquery_json,
    //   "token": "6a23190fba19d1cdc04499cfc222ccafa82c"
    // }
    // xmlhttp.send(JSON.stringify(xyz));

    $.ajax({
      url: rumi_api_endpoint + rumi_params + "filter/show",
      data: data, //return  data
      dataType: 'json',
      type: 'POST',
      async: true,
      success: function (res) {
        onComplete(res);
      },
      error: function () {
        console.log('Save error.');
      }
    });
  }
}
