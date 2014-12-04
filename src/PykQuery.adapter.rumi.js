PykQuery.adapter = PykQuery.adapter || {};
PykQuery.adapter.rumi = {};

PykQuery.adapter.rumi.init = function(pykquery_json,rumi_params, queryable_filters) {

  this.call = function(onComplete) {
    var xmlhttp, response;
    //console.log(pykquery_json,rumi_params)
    if(rumiParameterValidation(rumi_params)) {
      pykquery_json["filters"] = queryable_filters;
      var data = { config: pykquery_json,
        filename: rumi_params["filename"],
        username: rumi_params["username"],
        projectname: rumi_params["projectname"] };
    } else {
      return false;
    }

    $.ajax({
      url: "http://192.168.0.121:9292/v1/filter/show",
      data: data, //return  data
      dataType: 'json',
      type: 'POST',
      async: false,
      success: function (res) {
        onComplete(res);
      },
      error: function () {
        console.log('Save error.');
      }
    });
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
