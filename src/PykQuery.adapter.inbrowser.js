PykQuery.adapter = {};
PykQuery.adapter.inbrowser = {};
//PykQuery.adapter.inbrowser.init(pykquery_json);
PykQuery.adapter.inbrowser.init = function(pykquery){
  var query_object = pykquery,
      raw_data;
  // data whis is used for filtering data is in global_divid_for_raw_data
  global_divid_for_raw_data = window[pykquery.global_divid_for_raw_data];
  //raw_data = global_divid_for_raw_data.rawdata;
  console.log(raw_data,query_object);

  // function call by adapter from pykquery.js
  this.call = function() {

    // #1. TEMPORARY CODE TO GET THE DATA FOR TESTING.
    var xmlhttp = new XMLHttpRequest();
    var url = "examples/data/test1data.json";

    xmlhttp.onreadystatechange = function() {
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
            startAggration(query_object);
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
  
  

  var startAggration = function(filterObj){
    var metrics = filterObj.metrics,
        local_data;
     // matrics_column_name = objectkeymatrics;
    //console.log(matrics["type"])
    local_data = _.groupBy(raw_data,filterObj.dimensions[0]);
    //metrices
    for(var prop in metrics){
      console.log(metrics[prop]);
      switch (metrics[prop][0]){
        case "count":
          local_data = metricsCountFilter(local_data,prop);//prop is property which is actually a columname 
        break;
        case "sum":
          local_data = metricsSumFilter(local_data,prop);//prop is property which is actually a columname 
        break;

        default:
        //other cases is remaning 
      }
    }
  }

  var metricsCountFilter = function (local_data,column_name){
    var local_filter_array = []
    _.map(local_data, function(value,key){ 
       var local_obj = {};
       local_obj[column_name] =key;
       local_obj["count"] = value.length;
      local_filter_array.push(local_obj);
    });
    console.log(local_filter_array);
    return local_filter_array;
  }

  var metricsSumFilter = function(local_data,column_name){
    _.map(local_data, function(values,key){ 
      var sum;
        _.map(values, function(value,key){
          // if()
          console.log(value[column_name]);
        });
    });
  }

  var startFilterData = function(filterObj) {
    var filters_array =  filterObj.filters;
    console.log(filterObj.select,filters_array);
    var len = filters_array.length;
    for(var i=0;i<len;i++) {
      //var obj = {columnname:['count']}
      //checking condition_type of filter exit 
      switch(filters_array[i]["condition_type"]) {
        case "values":
        console.log('---- value code');
        return valueFilter(filters_array[i],filterObj.select);
        break;
        case "range":
        console.log('---- range code');
        return rangeFilter(filters_array[i],filterObj.select);
        break;
        case "datatype":
        break;
        default:
        console.log('wrong condition type');
      }
    }

  }

  var valueFilter = function(filter_obj,columns) {
    var _in = filter_obj['in'],
        not_in = filter_obj['not_in'],
        column_name = filter_obj['column_name'],
        local_data, col;
    local_data = _.filter(data ,function(obj){
      if(not_in.indexOf(obj[column_name]) < 0){
        return obj;
      }
    });
    local_data = _.filter(local_data ,function(obj){
      if(_in.indexOf(obj[column_name]) > -1){
        return obj;
      } 
    });
    if(columns.length != 0){
      local_data = _.map(local_data ,function(obj){ 
        return _.pick(obj,columns);
      });
    }  

    console.log("value filter completed");
    return local_data;
  }
  var rangeFilter = function(filter_obj,columns){
     console.log(columns);
    var min = filter_obj['condition']['min'],
        max = filter_obj['condition']['max'],
        column_name = filter_obj['column_name'],
        local_data, col;
    console.log(min,max);
    local_data = _.filter(raw_data ,function(obj){
      if(obj[column_name] <= max && obj[column_name] >=min){
        return obj;
      }
    });
    //return perticular columns data 
    if(columns.length != 0){
      local_data = _.map(local_data ,function(obj){ 
        return _.pick(obj,columns);
      });
    }
    console.log("rangeFilter done----");
    return local_data;
  }
  
}