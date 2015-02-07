PykQuery.adapter = PykQuery.adapter || {};
PykQuery.adapter.rumi = {};

PykQuery.adapter.rumi.init = function(pykquery_json,rumi_params, queryable_filters) {

  this.call = function(onComplete) {
    var xmlhttp, response;
    //console.log(pykquery_json,rumi_params)
    if(rumi_params) {
      pykquery_json["filters"] = queryable_filters;
      var data = {
        config: pykquery_json,
        token: gon.token
      };
    } else {
      return false;
    }

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
