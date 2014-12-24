PykQuery.adapter = PykQuery.adapter || {};
PykQuery.adapter.inbrowser = {};
//PykQuery.adapter.inbrowser.init(query);
PykQuery.adapter.inbrowser.init = function (pykquery, queryable_filters){
  // data which is used for filtering data is in global_divid_for_raw_data
  var query_object = pykquery,
      raw_data,
      global_divid_for_raw_data = pykquery.global_divid_for_raw_data,
  global_divid_for_raw_data = window[global_divid_for_raw_data];
  raw_data = global_divid_for_raw_data.rawdata;

  query_object.filters = queryable_filters;

  // function call by adapter from pykquery.js
  this.call = function () {
    var filtered_data;
    var mode = pykquery.mode;
    //checking whether filter is exit in query or not
    if(query_object.filters && query_object.filters.length > 0) {
      //console.log('start filter');
      startFilterData(query_object); //call to start filter
    }
    switch(mode) {
      case "aggregation":
        filtered_data = startAggregation(query_object);
        break;
      case "unique":
        break;
      case "datatype":
        break;
      default:
        // key: "value",
        //console.log('wrong condition type');
    }
    if (query_object['sort']) {
      filtered_data = startSorting(filtered_data);
    }
    return filtered_data;
  }

  var startSorting = function (data) {
    var sort_object = query_object['sort'],
        sort_object_length = sort_object.length;
    return data.sort(function (a, b) {
      for (var i = 0; i < sort_object_length; i++) {
        var key = Object.keys(sort_object[i])[0],
            alias = processAlias(key);
        if (a[alias] !== b[alias]) {
          return processSorting(a, b, alias, sort_object[i][key]);
        }
      }
    });
  }
  var processSorting = function (a, b, alias, order) {
    if (order === "asc") {
      return a[alias] < b[alias] ? -1 : (a[alias] > b[alias] ? 1 : 0);
    } else {
      return a[alias] > b[alias] ? -1 : (a[alias] < b[alias] ? 1 : 0);
    }
  }

  var startAggregation = function (filter_obj){
    var metrics = filter_obj.metrics;
    // matrics_column_name = objectkeymatrics;
    local_data = _.groupBy(raw_data, function (d) {
      var groupby = "",
          filter_obj_dimensions_length = filter_obj.dimensions.length;
      for (var k = 0; k < filter_obj_dimensions_length; k++) {
        var filter_obj_dimensions = filter_obj.dimensions[k];
        k===0 ? groupby = d[filter_obj_dimensions] : groupby += "<>" + d[filter_obj_dimensions];
      }
      return groupby;
    });

    var local_filter_array = [];
    _.map(local_data, function (value,key) {
      var local_obj = {},
          keys = key.split("<>"),
          keys_length = keys.length;
      for (var j = 0; j < keys_length; j++) {
        local_obj[processAlias(pykquery.dimensions[j])] = keys[j];
      }
      for (var prop in metrics) {
        var individual_metric = metrics[prop],
            individual_metric_length = individual_metric.length;
        for (var i = 0; i < individual_metric_length; i++) {
          switch (individual_metric[i]) {
            case "count":
              local_obj[processAlias(prop,individual_metric[i])] = value.length;
              break;
            case "sum":
              local_obj[processAlias(prop,individual_metric[i])] = _.sum(value, function (values) {
                return parseInt(values[prop],10);
              });
              break;
          }
        }
      }
      local_filter_array.push(local_obj);
    });
    return local_filter_array;
  }

  var metricsMin = function (local_data,column_name) {
    var local_filter_array = []
    _.map(local_data, function (values,key) {
      var local_obj = {};
      local_obj[column_name] = key;
      local_filter_array.push(local_obj);
      local_obj["min"] = _.min(values, function (value) {
        return value[column_name];
      });
      local_filter_array.push(local_obj);
    });
    //console.log(local_filter_array);
    return local_filter_array;
  }

  var metricsMax = function (local_data,column_name) {
    var local_filter_array = []
    _.map(local_data, function (values,key) {
      var local_obj = {};
      local_obj[column_name] = key;
      local_filter_array.push(local_obj);
      local_obj["max"] = _.max(values, function (value) {
        return value[column_name];
      });
      local_filter_array.push(local_obj);
    });
    //console.log(local_filter_array);
    return local_filter_array;
  }

  var metricsExtent = function (local_data,column_name) {
    var local_filter_array = []
    _.map(local_data, function (values,key) {
      var local_obj = {};
      local_obj[column_name] = key;
      local_filter_array.push(local_obj);
      local_obj["extent"] = _.extent(values, function (value) {
        return value[column_name];
      });
      local_filter_array.push(local_obj);
    });
    //console.log(local_filter_array);
    return local_filter_array;
  }

  var startFilterData = function (filter_obj) {
    var mode = filter_obj.mode,
        filters_array = filter_obj.filters,
        len = filters_array.length, columns;
    if(filter_obj.mode == 'select'){
      columns = filter_obj.select;
    } else {
      columns = [];
    }
    for(var i = 0; i < len; i++) {
      //var obj = {columnname:['count']}
      //checking condition_type of filter exit
      switch(filters_array[i]["condition_type"]) {
        case "values":
          valueFilter(filters_array[i],columns,mode); // Changed the passing paramenter from filter_obj.select to filter_obj.dimensions as select is not applicable to filters ---> AUTHOR RONAK
          break;
        case "range":
          rangeFilter(filters_array[i],columns); // Changed the passing paramenter from filter_obj.select to filter_obj.dimensions as select is not applicable to filters ---> AUTHOR RONAK
          break;
        case "datatype":
          break;
        default:
          //console.log('wrong condition type');
      }
    }
    return raw_data;
  }

  var valueFilter = function (filter_obj,columns,mode) {
    var _in = filter_obj['in'],
        not_in = filter_obj['not_in'],
        column_name = filter_obj['column_name'],
        col;
    raw_data = _.filter(raw_data ,function (obj) {
      if(!not_in || not_in.indexOf(obj[column_name]) < 0) {
        return obj;
      }
    });
    raw_data = _.filter(raw_data ,function (obj) {
      if(_in && _in.indexOf(obj[column_name]) > -1) {
        return obj;
      }
    });
    // Why is the below code written. It returns the data with only one column. Ideally, the where clause should return all the columns with aggregation hapenning later ---> AUTHOR RONAK
    if(columns.length != 0 && mode === "select") {
      raw_data = _.map(raw_data ,function (obj) {
        // console.log(obj,columns);
        return _.pick(obj,columns);
      });
    }
    //console.log("value filter completed");
  }
  var rangeFilter = function (filter_obj,columns,mode){
    var min,
        max,
        column_name = filter_obj['column_name'],
        col,
        filter_obj_condition_length = filter_obj.condition.length;
    raw_data = _.filter(raw_data ,function (obj){
      for (var i = 0; i < filter_obj_condition_length; i++) {
        min = filter_obj.condition[i]['min'];
        max = filter_obj.condition[i]['max'];
        if(obj[column_name] <= max && obj[column_name] >=min){
          return obj;
        }
      }
    });
    //return perticular columns data
    if(columns.length != 0 && mode === "select"){
      raw_data = _.map(raw_data ,function (obj){
        return _.pick(obj,columns);
      });
    }
    //console.log("rangeFilter done----");
  }

  var processAlias = function(colname,aggregation_method) {
    var alias = query_object.alias;
    if (typeof alias[colname] === "string") {
      return alias[colname];
    } else if (typeof alias[colname] === "object") {
      if (aggregation_method) {
        return alias[colname][aggregation_method];
      } else {
        return alias[colname][colname];
      }
    } else {
      return colname;
    }
  }
}
