//TODO - Isha if PykQuery object related to PykChart changes its filterdata then re-render the chart

var PykQuery = {};
PykQuery.global_names = [];
PykQuery.local_names = [];

PykQuery.init = function(mode_param, _scope_param, divid_param, adapter_param) {

  that = this;
  var div_id, mode, _scope, adapter, global_exists, local_exists;
  var available_mode = ["aggregation", "unique", "select", "datatype", "global"];
  var available_scope = ["local", "global"];
  var available_adapters = ["inbrowser", "rumi"];
  var util = new PykUtil.init();

  if (available_mode.indexOf(mode_param) > -1 && available_scope.indexOf(_scope_param) > -1 && !util.isBlank(divid_param) && available_adapters.indexOf(adapter_param) > -1) {
    mode = mode_param;
    _scope = _scope_param;
    adapter = adapter_param;
    div_id = (_scope == "local") ? divid_param.replace("#","") : divid_param;
    global_exists = (_scope == "global") ? _.find(PykQuery.global_names,function(d){ return (d == div_id); }) : null;
    local_exists = (_scope == "local") ? _.find(PykQuery.local_names,function(d){ return (d == div_id); }) : null;

    if (mode == "global" && _scope != "global"){
        console.error(div_id + ": scope and mode both should be global.");
        return false;
    }

    //Checks if div_id exists in DOM
    if(global_exists == undefined && _scope == "global") {
      PykQuery.global_names.push(div_id);
      flag = true;
    }
    else if (local_exists == undefined && _scope == "local") {
      PykQuery.local_names.push(div_id);
      flag = true;
    }
    else {
      flag = false;
      return false;
    }
  } else {
    if (available_mode.indexOf(mode) == -1){
      console.error(divid + ": available_mode has invalid value. It should be one of " + available_mode);
    }
    if (available_scope.indexOf(_scope) == -1){
      console.error(divid + ": available_scope has invalid value. It should be one of " + available_scope);
    }
    if (available_adapters.indexOf(adapter) == -1){
      console.error(divid + ": available_adapters has invalid value. It should be one of " + available_adapters);
    }
    if (util.isBlank(divid)){
      console.error(divid + ": DivID cannot be undefined.");
    }
    if (mode == "global" && _scope != "global"){
        console.error(divid + ": scope and mode both should be global.");
    }
    return false;
  }

  var addfilter = [],
      dimensions = [],
      metrics = {},
      cols = [],
      sort = {},
      limit = 2000,
      __impacts =[],
      offset = 0,
      alias = {},
      filter_data, raw_data, global_divid_for_rawdata;
  // set the global data to pykquery
  if(mode == "global" && _scope == "global" && adapter == "inbrowser") {
    Object.defineProperty(this, 'rawdata', {
      get: function() {
        return raw_data;
      },
      set: function(mydata) {
        raw_data = mydata;
      }
    });
  }
  if(_scope == "local" && adapter == "inbrowser") {
    Object.defineProperty(this, 'global_divid_for_raw_data', {
      get: function() {
        return global_divid_for_rawdata;
      },
      set: function(my_global_div_id) {
        global_divid_for_rawdata = my_global_div_id;
      }
    });
  }
  if(adapter == "rumi") {
    Object.defineProperty(this, 'datastoreurl', {
      get: function() {
        return data_store_url;
      },
      set: function(url) {
        data_store_url = url;
      }
    });
  }
  Object.defineProperty(this, 'scope', {
    get: function () {
      return _scope;
    }
  });
  // if select - columns name
  // if aggregation - metrics, dimensions
  // if unique - column name
  // WHERE

  switch (mode) {
    case "select":
      Object.defineProperty(this, 'select', {
        get: function() {
          return cols;
        },
        set: function(name) {
          cols = name;
        }
      });
      break;
    case "aggregation":
      Object.defineProperty(this, 'dimensions', {
        get: function() {
          return dimensions;
        },
        set: function(name) {
          _.each(name, function (d) {
            dimensions.push(d);
          });
        }
      });
      Object.defineProperty(this, 'metrics', {
        get: function() {
          return metrics;
        },
        set: function(name) {
          if (metricsValidation(name)) {
            for (var key in name)
              metrics[key] = name[key]; //"column_name_l1": ["sum", "avg"],
              //console.log("metrics save");
            }
          }
      });
      break;
    case "unique":
      Object.defineProperty(this, 'unique', {
        get: function() {
          return cols;
        },
        set: function(name) {
          _.each(name, function (d) {
            cols.push(d);
          });
        }
      });
      break;
    case "datatype":
      console.error("missing functionality");
      return;
      break;
  }

  Object.defineProperty(this, 'div_id', {
    get: function() {
      return div_id;
    }
  });

  Object.defineProperty(this, 'filterdata', {
    get: function() {
      return filter_data;
    },
    set: function(mydata) {
      filter_data = mydata;
    }
  });

  Object.defineProperty(this, 'limit', {
    get: function() {
      return limit
    },
    set: function(value) {
      limit = value;
    }
  });

  Object.defineProperty(this, 'mode', {
    get: function() {
      return mode;
    }
  });

  Object.defineProperty(this, 'offset', {
    get: function() {
      return offset;
    },
    set: function(value) {
      offset = value;
    }
  });

  // The end user must not be using it. Its used internally to set the impact of another global for handling cyclical loops.
  Object.defineProperty(this, 'impacts', {
    get: function() {
      return __impacts;
    },
    set: function(val) { //APPEND
      if (impactValidation(val)){
        __impacts.push(val);
      }
    }
  });

  Object.defineProperty(this, 'alias', {
    get: function() {
      return alias;
    },
    set: function(vals) {
      //Input Format -- vals = {"col_name": "alias_name", "col_name1": "alias_name1", ...}
      columns = Object.keys(vals);
      if (columns.length < 1) {
        console.warn("Need atleast 1 alias name to add");
        return;
      }

      for (var column_name in vals) {
        if (vals.hasOwnProperty(column_name)) {
          alias[column_name] = vals[column_name];
        }
      }
    }
  });

  Object.defineProperty(this, 'sort', {
    get: function() {
      return sort
    },
    set: function(name) { //"[{"col1": "asc"}, ]"
      for (var prop in name) {
        if(util.isBlank(prop)){
          console.error("Column name is undefined in sort.")
          return;
        }
        if (util.isBlank(name[prop]) || (name[prop] != "asc" && name[prop] != "desc")) {
          name[prop] = "asc";
        }
      }
      sort = name;
    }
  });

  this.filter = function() {
    Object.defineProperty(this, 'filters', {
      get: function() {
        return addfilter;
      },
      set:function(name){
        addFilterPropagate(name)
      }
    });
    var obj = {
      add: function(name) {
        if (filterValidation(name)) {
          addFilterInQuery(name)
          if (_scope == "local"){
            addFilterPropagate(name)
          }
        }
      },
      remove: function(column_name, condition_type, params) {
        removeFilterInQuery(column_name, condition_type, params);
        removeFilterPropagate(column_name, condition_type, params);
      },
    };
    return obj;
  }

  this.addImpacts = function(array_of_div_ids, is_cyclical) {
    var query_object = window[array_of_div_ids[i]];
    if (impactValidation(array_of_div_ids)) {
      len = array_of_div_ids.length;
      for(var i = 0; i < len; i++) {
        __impacts.push(array_of_div_ids[i]);
        setGlobalIdForRawData(this);
        if(is_cyclical){
          setGlobalIdForRawData(window[array_of_div_ids[i]]);
          related_pykquery = window[array_of_div_ids[i]];
          related_pykquery.impacts = [this.div_id];
        }
      }
    }
  }

  var setGlobalIdForRawData = function (that) {
    if (adapter === "inbrowser" && that.scope === "local") {
      if (!that.global_divid_for_raw_data) {
        that.global_divid_for_raw_data = that.div_id;
      }
    }
  }

  var addFilterInQuery = function(new_filter) {
    var is_new_filter = true;
    for (var i = 0; i < addfilter.length; i++) {
      var old_filter = addfilter[i];
      if (old_filter['column_name'] == new_filter['column_name'] && old_filter['condition_type'] == new_filter['condition_type']){
        //INPUT - old_filter, new_filter
        //INPUT - IN(A, B), IN(A, C)
        //OUTPUT -- IN (A, B, C)
        if (old_filter['condition_type'] == "values") {
          var is_same1 = util.is_exactly_same(new_filter['in'], old_filter['in']);
          var is_same2 = util.is_exactly_same(new_filter['not_in'], old_filter['not_in']);
          if (is_same2 == true && is_same1 == true) {
            console.warn('Clean up your JS: Same filter cannot add');
            return false;
          }
          else {
            old_filter['in'] = util.concat_and_uniq(old_filter['in'], new_filter['in']);
            old_filter['not_in'] = util.concat_and_uniq(old_filter['not_in'], new_filter['not_in']);
            addfilter[i] = old_filter;
            is_new_filter = false;
            break;
          }
        }
        // INPUT - old_filter, new_filter
        // INPUT - age > 13, age < 65
        // OUTPUT - age > 13 or age < 65
        else if(old_filter['condition_type'] == "range") {
          var new_c = new_filter['condition'];
          var old_c =old_filter['condition'];
          if(new_c['min'] == old_c['min'] && new_c['max'] == old_c['max']  && new_c['not'] == old_c['not']){
            console.warn('Clean up your JS: Same filter cannot add');
            return false;
          } else {
            is_new_filter = true;
          }
        }
      }
    }
    if (is_new_filter == true){
      addfilter.push(new_filter);
    }
  }

  // If a local filter is changed and it impacts a global then append to global
  var addFilterPropagate = function(new_filter) {
    if (_scope == "local") {
      var len = __impacts.length;
      for (var j = 0; j < len; j++) {
        console.log(__impacts[j]);
        var global_filter = window[__impacts[j]];
        global_filter.filters = new_filter;
      }
    }
  }

  var removeFilterInQuery = function(column_name, condition_type, params) {
    var len = addfilter.length;
    for (var x = 0; x < len; x++) {
      if (addfilter[x]['column_name'] == column_name && addfilter[x]['condition_type'] == condition_type) {
        if (condition_type == "values") {
          addfilter[x]['in'] = util.subtract_array(addfilter[x]['in'], params['in']);
          addfilter[x]['not_in'] = util.subtract_array(addfilter[x]['not_in'], params['not_in']);
        }
        else if (condition_type == "range") {
          var __min = params['min'];
          var __max = params['max'];
          if(!util.isBlank(__min) && !util.isBlank(__max))
            if(__min == addfilter[x]['condition']['min'] && __max == addfilter[x]['condition']['max']) {
              addfilter.splice(x,1);
            }
        }
      }
    }
  }

  var removeFilterPropagate = function(column_name, condition_type, params) {
    if(_scope == "local") {
      var len = impacts.length;
      for(var j =0;j<len;j++) {
        var global_filter = window[impacts[j]];
        global_filter.removeFilterInQuery(column_name, condition_type, params);
      }
    }
  }

  var impactValidation = function(array_of_div_ids){
    var len = array_of_div_ids.length,
        impacts_allowed_on;
    if (_scope === "local") {
      impacts_allowed_on = "global";
    } else {
      impacts_allowed_on = "local";
    }
    for (var i = 0; i < len; i++) {
      var query_object = window[array_of_div_ids[i]];
      if (query_object && query_object.scope === _scope) {
        console.error("A " + _scope + " can only impact " + impacts_allowed_on + ".")
        return false;
      }
    }
    return true;
  }

  //code for validation before adding filter
  var filterValidation = function(f) {
    //var filter1 = [{
      //}, {
        //"column_name": "col1",
        //"condition_type": "data_types",
        //"IN": ["integer", "float"],
        //"NOT IN": ["blank"],
        //"next": "OR",
      //}]

    if (Object.keys(f).length == 0) {
      console.error("Empty filter object is not allowed.")
      return false;
    }
    if(util.isBlank(f["column_name"])){
      console.error("column_name cannot be empty.")
      return false;
    }
    if(!util.isBlank(f["next"]) && f["next"] != "OR" && f["next"] != "AND"){
      console.error("next must either be empty or OR or AND.")
      return false;
    }
    if (f["condition_type"] == "range") {
      if(util.isBlank(f["condition"])){
        console.error("condition cannot be empty.")
        return false;
      }
      else{
        if(util.isBlank(f["condition"]["min"]) && util.isBlank(f["condition"]["max"])){
          console.error("Either min or max or both must always be present.")
          return false;
        }
      }
      return true;
    } else if (f["condition_type"] == "values") {
      if(util.isBlank(f["not_in"]) && util.isBlank(f["in"])){
        console.error("Either in or not_in or both must always be present.")
        return false;
      }
      if(f["not_in"] != undefined && f["in"] != undefined){
        if(f["not_in"].length == 0 && f["in"].length == 0 ){
          console.error("Either in or not_in or both must always be present.")
          return false;
        }
      }
      return true;
    }
    else{
      console.error(div_id + ": condition_type must be one of " + ["range", "values"])
      return false;
    }
  }

  //[{"col1": ["min", "max"]}]
  var metricsValidation = function(m) {
    var metric_functions = ['min', 'max', 'avg', 'sum', 'median', 'count'];
    if (Object.keys(m).length == 0) {
      console.error("Metrics object cannot be empty.")
      return false;
    }
    for (var prop in m) {
      if(util.isBlank(prop)){
        console.error("Column name is undefined in metrics.")
        return false;
      }
      if (util.isBlank(m[prop]) || m[prop].length == 0) {
        console.error("Please pass an Array of metric functions for column name" + prop)
        return false;
      }
      else{
        var len = m[prop].length;
        for(var i = 0; i < len; i++){
          if (metric_functions.indexOf(m[prop][i]) <= -1) {
            console.error("Wrong metric function passed for column name" + prop);
            return false;
          }
        }
      }
    }
    return true;
  }

  this.call = function() {
    var that = this;
    var access_filtered_data = {
      getData: function () {
        if (_scope == "local"){
          filterdata = invoke_call(getConfig(that))
          return filterdata;
        }
        else{
          filterdata = invoke_call(getConfig(that))
          var len = impacts.length;
          for(var j = 0; j < len; j++) {
            var local_filter = window[impacts[j]];
            local_filter.filterdata = local_filter.call();
          }
        }
      },
      flushData: function () {
        filterdata = "";
      }
    };
    return access_filtered_data;
  }

  var invoke_call = function(pykquery_json){
    if(adapter == "inbrowser"){
      var connector = new PykQuery.adapter.inbrowser.init(pykquery_json);
    }
    else{
      var connector = new PykQuery.adapter.rumi.init(pykquery_json);
    }
    var response = connector.call();
    console.log(response);
    //response = processAlias(response);
    //TODO to delete instance of adapter adapter.delete();
    return response;
  }

  // getConfig is use generate whole query
  var getConfig = function(that) {
    var filter_obj = {};
    var querydata;
    var arr = Object.getOwnPropertyNames(that);
    for (var i in arr) {
      if (that.propertyIsEnumerable(arr[i]) == false) {
        filter_obj[arr[i]] = that[arr[i]];
        //console.log(arr);
      }
    }
    //filter_obj['filters'] = addfilter;
    // if(myadapter == "database") {
    //   querydata = databaseQuery(filter_obj);
    //   return querydata;
    // } else(myadapter == "browser"){
      // call to browser data;
    //}
    return filter_obj;
  };

  this.storeObjectInMemory = function(obj_name) {
    document.getElementById(div_id).setAttribute("pyk_object", obj_name);
  }

//   var databaseQuery = function(filter_obj){
//     var data;
//     $.ajax({
//         url: host + "pykquery/datarequest",
//         data: filter_obj, //return  data
//         dataType: 'json',
//         type: 'GET',
//         async: false,
//         success: function (res) {
//           if (res.status == "200") {
//             data = res.data;
//             console.log('data recived');

//           }
//           else {
//             console.log("error");
//           }
//           azax_flag = true;
//         },
//         error: function () {
//           console.log('error in connection to database.');
//         }
//       });
//     return data;
//   }

var processAlias = function(res) {
  //TO-DO -- replace all occurences of column_names with aliases if any
  //waiting for -- response format
  return res
}

var findQueryByDivid = function(id) {
    var obj_name = document.getElementById(id).getAttribute("pyk_object");
    if(obj_name == undefined){
        console.log("div not exit "+id);
    }
    return obj_name;
}

  /* -------------- URL params ------------ */
  // var filters = ["Pykih","mumbai","startup"];
  var urlParams = function (attr,filter,the_change) {
    // console.log(url,"***",params,"***",filters,filters.length);
    var url_params = "", index;

    if(the_change == 0) { // Add to URL
      params = (_.isEmpty(filters)) ? "?"+attr+"="+filter : params+"&"+attr+"="+filter;
      url_params = url +""+ params;
      filters.push(filter);
    }
    else if(the_change == 1) { // Remove from URL
      if(filters.length == 1) { // Only 1 filter ==> Empty
        params = "";
        url_params = url;
      }
      else if(filters.length > 1) {
        params = params.replace(attr+"="+filter+"&","");
        url_params = url + params;
      }
      index = _.indexOf(filters,filter);
      filters.splice(index,1);
    };
    // console.log("URL STring: ",url_params,"****"/*,filters,params*/);
  };
  // urlParams("name","Pykih",0);
  // urlParams("location","Mumbai",0);
  // urlParams("type","startup",0);
  // urlParams("location","Mumbai",1);
  // urlParams("name","Pykih",1);
  // urlParams("type","startup",1);


  /* ---------- Chart Filtering ----------- */
  var domChartFiltering = function (id) {
    for(var i=0 ; i<PykCharts.charts.length ; i++) {
      if (PykCharts.charts[i].selector != "#"+id) {
        PykCharts.charts[i].refresh();
      }
    }
  };
  // (div_id == "pieContainer") ? domChartFiltering("pieContainer") : null;
};
