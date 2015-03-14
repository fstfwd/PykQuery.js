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
    var filtered_data
      , mode = pykquery.mode;
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
    if (query_object['sort'] && query_object['sort'] > 0) {
      filtered_data = startSorting(filtered_data);
    }
    return filtered_data;
    query_object = raw_data = global_divid_for_raw_data = raw_data = null; 
    query_object.filters = null;
  }

  function startSorting(data) {
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
  function processSorting(a, b, alias, order) {
    if (order === "asc") {
      return a[alias] < b[alias] ? -1 : (a[alias] > b[alias] ? 1 : 0);
    } else {
      return a[alias] > b[alias] ? -1 : (a[alias] < b[alias] ? 1 : 0);
    }
  }

  function startAggregation(filter_obj){
    var metrics = filter_obj.metrics
      , filter_obj_dimension = filter_obj.dimensions
      , filter_obj_dimensions_length = filter_obj_dimension.length;
    local_data = _.groupBy(raw_data, function (d) {
      var groupby = "";
      for (var k = 0; k < filter_obj_dimensions_length; k++) {
        var filter_obj_dimensions = filter_obj_dimension[k];
        k===0 ? groupby = d[filter_obj_dimensions] : groupby += "<>" + d[filter_obj_dimensions];
      }
      return groupby;
    });

    var local_filter_array = [];
    _.map(local_data, function (value,key) {
      // console.log(key,"key");
      var local_obj = {},
          keys = key.split("<>"),
          keys_length = keys.length;
      for (var j = 0; j < keys_length; j++) {
        local_obj[processAlias(pykquery.dimensions[j])] = keys[j];
      }
      var prop = Object.keys(metrics)
        , prop_length = prop.length;
      for (var i=0; i<prop_length; i++) {
        var individual_metric = metrics[prop[i]],
            individual_metric_length = individual_metric.length;
        for (var j = 0; j < individual_metric_length; j++) {
          switch (individual_metric[j]) {
            case "count":
              local_obj[processAlias(prop[i],individual_metric[j])] = value.length;
              break;
            case "sum":
              local_obj[processAlias(prop[i],individual_metric[j])] = _.sum(value, function (values) {
                return parseInt(values[prop[i]],10);
              });
              break;
          }
        }
      }
      prop = null;
      local_filter_array.push(local_obj);
    });
    return local_filter_array;
  }

  function metricsMin(local_data,column_name) {
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

  function metricsMax(local_data,column_name) {
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

  function metricsExtent(local_data,column_name) {
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

  function tartFilterData(filter_obj) {
    var mode = filter_obj.mode,
        filters_array = filter_obj.filters,
        len = filters_array.length, columns;
    mode === 'select' ? columns = filter_obj.select : columns = [];

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
    filters_array = null;
    return raw_data;
  }

  function valueFilter(filter_obj,columns,mode) {
    var _in = filter_obj['in']
      , not_in = filter_obj['not_in']
      , column_name = filter_obj['column_name']
      , col
      , data = raw_data
      , raw_data_length = data.length;
    raw_data = [];
    for(var i = 0; i < raw_data_length; i++) {
      var obj_col_name = data[i][column_name];
      if(_in && _in.indexOf(obj_col_name) > -1) {
        raw_data.push(data[i]);
      } else if(not_in && not_in.length > 0 && not_in.indexOf(obj_col_name) === -1) {
        raw_data.push(data[i]);
      }
    }
    if(columns.length != 0 && mode === "select") {
      raw_data = _.map(raw_data ,function (obj) {
        return _.pick(obj,columns);
      });
    }
    _in = not_in = column_name = data = raw_data_length = null;
    //console.log("value filter completed");
  };

  function rangeFilter(filter_obj,columns,mode){
    var min
      , max
      , not
      , column_name = filter_obj['column_name']
      , col
      , filter_obj_condition_length = filter_obj.condition.length;
    raw_data = _.filter(raw_data ,function (obj){
      for (var i = 0; i < filter_obj_condition_length; i++) {
        min = filter_obj.condition[i]['min'];
        max = filter_obj.condition[i]['max'];
        not = filter_obj.condition[i]['not'];
        if (not && (obj[column_name] > max || obj[column_name] < min)){
          return obj;
        } else if(!not && obj[column_name] <= max && obj[column_name] >=min){
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

  function processAlias(colname,aggregation_method) {
    var alias = query_object.alias;
    if (typeof alias[colname] === "string") {
      return alias[colname];
    } else if (typeof alias[colname] === "object") {
      return aggregation_method ? alias[colname][aggregation_method] : alias[colname][colname];
    }
    return colname;
  }
}
