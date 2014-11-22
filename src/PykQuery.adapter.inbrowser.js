PykQuery.adapter = {};
PykQuery.adapter.inbrowser = {};
//PykQuery.adapter.inbrowser.init(pykquery_json);
PykQuery.adapter.inbrowser.init = function (pykquery){
  var query_object = pykquery,
      raw_data;
  // data whis is used for filtering data is in global_divid_for_raw_data
  global_divid_for_raw_data = window[pykquery.global_divid_for_raw_data];
  //raw_data = global_divid_for_raw_data.rawdata;
  console.log(raw_data,query_object);

  // function call by adapter from pykquery.js
  this.call = function () {

    // #1. TEMPORARY CODE TO GET THE DATA FOR TESTING.
    var xmlhttp = new XMLHttpRequest();
    var url = "examples/data/test1data.json";

    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        raw_data = JSON.parse(xmlhttp.response);
        //console.log(data,pykquery);
        var mode = pykquery.mode;
        //checking whether filter is exit in query or not
        console.log(query_object.filters);
        if(query_object.filters != undefined){
          if(query_object.filters.length > 0) {
            console.log('start filter');
            raw_data = startFilterData(query_object); //call to start filter

          }
        }
        switch(mode) {
          case "aggregation":
            startAggregation(query_object);
            break;
          case "unique":
            break;
          case "datatype":
            break;
          default:
            // key: "value",
            console.log('wrong condition type');
        }

      }
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
    // #1 ENDS

  }



  var startAggregation = function (filter_obj){
    var metrics = filter_obj.metrics,
        local_data;
    // matrics_column_name = objectkeymatrics;
    local_data = _.groupBy(raw_data,filter_obj.dimensions[0][0]);
    console.log(filter_obj,local_data)
    //metrices
    for (var prop in metrics) {
      switch (metrics[prop][0]) {
        case "count":
          local_data = metricsCount(local_data,prop);//prop is property which is actually a column name
        break;
        case "sum":
          local_data = metricsSum(local_data,prop);//prop is property which is actually a column name
        break;
        case "min":
          local_data = metricsMin(local_data,prop);//prop is property which is actually a column name
        break;
        case "max":
          local_data = metricsMax(local_data,prop);//prop is property which is actually a column name
        break;
        case "extent":
          local_data = metricsExtent(local_data,prop);//prop is property which is actually a column name
          break;

        default:
        //other cases is remaning
      }
    }
  }

  var metricsCount = function (local_data,column_name) {
    var local_filter_array = []
    _.map(local_data, function (value,key) {
      var local_obj = {};
      local_obj[column_name] = key;
      local_obj["count"] = value.length;
      local_filter_array.push(local_obj);
    });
    console.log(local_filter_array);
    return local_filter_array;
  }

  var metricsSum = function (local_data,column_name) {
    var local_filter_array = []
    _.map(local_data, function (values,key) {
      var local_obj = {};
      local_obj[column_name] = key;
      local_filter_array.push(local_obj);
      local_obj["sum"] = _.sum(values, function (value) {
        return value[column_name];
      });
      local_filter_array.push(local_obj);
    });
    console.log(local_filter_array);
    return local_filter_array;
  }

  var startFilterData = function (filter_obj) {
    var filters_array =  filter_obj.filters;
    console.log(filter_obj.select,filters_array);
    var len = filters_array.length;
    for(var i = 0; i < len; i++) {
      //var obj = {columnname:['count']}
      //checking condition_type of filter exit
      switch(filters_array[i]["condition_type"]) {
        case "values":
          console.log('---- value code');
          return valueFilter(filters_array[i],filter_obj.select);
          break;
        case "range":
          console.log('---- range code');
          return rangeFilter(filters_array[i],filter_obj.select);
          break;
        case "datatype":
          break;
        default:
          console.log('wrong condition type');
      }
    }

  }

  var valueFilter = function (filter_obj,columns) {
    var _in = filter_obj['in'],
        not_in = filter_obj['not_in'],
        column_name = filter_obj['column_name'],
        local_data, col;
    local_data = _.filter(data ,function (obj){
      if(not_in.indexOf(obj[column_name]) < 0){
        return obj;
      }
    });
    local_data = _.filter(local_data ,function (obj){
      if(_in.indexOf(obj[column_name]) > -1){
        return obj;
      }
    });
    if(columns.length != 0){
      local_data = _.map(local_data ,function (obj){
        return _.pick(obj,columns);
      });
    }

    console.log("value filter completed");
    return local_data;
  }
  var rangeFilter = function (filter_obj,columns){
     console.log(columns);
    var min = filter_obj['condition']['min'],
        max = filter_obj['condition']['max'],
        column_name = filter_obj['column_name'],
        local_data, col;
    console.log(min,max);
    local_data = _.filter(raw_data ,function (obj){
      if(obj[column_name] <= max && obj[column_name] >=min){
        return obj;
      }
    });
    //return perticular columns data
    if(columns.length != 0){
      local_data = _.map(local_data ,function (obj){
        return _.pick(obj,columns);
      });
    }
    console.log("rangeFilter done----");
    return local_data;
  }

}
