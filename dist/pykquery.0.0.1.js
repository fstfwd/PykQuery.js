PykUtil = {}

PykUtil.init = function() {

    this.pushToArray = function(a1, o1){
        if( a1.length == 0 ){
            a1 = [o1]
        }
        else{
            a1.push(o1);
        }
        return a1
    }

    //TODO - Change all _ ruby like names to CamelCase for all PykUtil Functions
    this.concat_and_uniq = function(a1, a2) {
        if (a1 != undefined && a2 != undefined){
            a1 = a1.concat(a2)
                .filter(function(item, i, ar) {
                    return ar.indexOf(item) === i;
            });
        }
        return a1;
    }

    this.is_exactly_same = function(a1, a2) {
        if (a1 != undefined && a2 != undefined){
            var is_same2 = (a1.length == a2.length) && a1.every(function(element, index) {
                return element === a2[index];
            });
            return is_same2;
        }
        else{
            return false;
        }
    }

    this.subtract_array = function(a1, a2) {
        if (a1 != undefined && a2 != undefined){
            for (var i = 0; i < a2.length; i++) {
                var index = a1.indexOf(a2[i]);
                if (index > -1) {
                    a1.splice(index, 1);
                }
            }
        }
        return a1;
    }

    this.isBlank = function(a) {
        (a == undefined || a == "") ? true : false
    }
}

//TODO - Isha if PykQuery object related to PykChart changes its filterdata then re-render the chart

var PykQuery = {};
PykQuery.global_names = [];
PykQuery.local_names = [];

PykQuery.init = function(mode_param, _scope_param, divid_param, adapter_param) {

  that = this;
  var div_id, mode, _scope, adapter, global_exists, local_exists, selected_dom_id, local_div_id_triggering_event;
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
      console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', div_id + ": scope and mode both should be global.");
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
      console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', divid + ": mode has invalid value. It should be one of " + available_mode);
    }
    if (available_scope.indexOf(_scope) == -1){
      console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', divid + ": scope has invalid value. It should be one of " + available_scope);
    }
    if (available_adapters.indexOf(adapter) == -1){
      console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', divid + ": adapters has invalid value. It should be one of " + available_adapters);
    }
    if (util.isBlank(divid)){
      console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', divid + ": DivID cannot be undefined.");
    }
    if (mode == "global" && _scope != "global"){
      console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', divid + ": scope and mode both should be global.");
    }
    return false;
  }

  var where_clause = [],
  dimensions = [],
  metrics = {},
  cols = [],
  sort = {},
  limit = 2000,
  __impacts =[],
  offset = 0,
  alias = {},
  filter_data,
  raw_data,
  global_divid_for_rawdata;
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
            for (var key in name) {
              metrics[key] = name[key]; //"column_name_l1": ["sum", "avg"],
              //console.log("metrics save");
            }
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
      console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "datatype is currently a missing functionality.");
      break;
  }

  Object.defineProperty(this, 'div_id', {
    get: function() {
      return div_id;
    }
  });

  Object.defineProperty(this, 'selecteddomid', {
    get: function() {
      return selected_dom_id;
    },
    set: function(id) {
      selected_dom_id = id;
    }
  });

  Object.defineProperty(this, 'localdividtriggeringevent', {
    get: function() {
      return local_div_id_triggering_event;
    },
    set: function(id) {
      local_div_id_triggering_event = id;
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
          console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "Column name is undefined in sort.")
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
        return where_clause;
      },
      set: function(new_where_clause){ //used only by the adaptors!
        where_clause = new_where_clause;
      }
    });
  }

  this.addFilter = function(name, is_interactive, domid){
    if(!this.filters){ //this is hacky code. ronak wrote it.
      this.filter();
    }
    if (filterValidation(name)) {
      if(is_interactive && _scope == "global"){
        addFilterInQuery(name);
      } else if(is_interactive && _scope == "local"){
        name.local_div_id_triggering_event = div_id;
        addFilterPropagate(name);
        showFilterList();
      } else if(!is_interactive && _scope == "global"){
        //not possible
      } else if(!is_interactive && _scope == "local"){ //onload
        addFilterInQuery(name);
      }
    }
  }

  this.resetFilters = function(){
    if(_scope == "global"){
      where_clause = [];
    } else {
      console.error("You cannot reset a local. Please run it on a Global.")
    }
  }

  this.removeFilter = function(column_name, condition_type, params, is_interactive){
    if (filterValidation(name)) {
      if(is_interactive && _scope == "global"){
        removeFilterInQuery(column_name, condition_type, params);
      } else if(is_interactive && _scope == "local"){
        removeFilterPropagate(column_name, condition_type, params);
      } else if(!is_interactive && _scope == "global"){
        //not possible
      } else if(!is_interactive && _scope == "local"){ //onload
        removeFilterInQuery(column_name, condition_type, params);
      }
    }
  }

  var removeFilterInQuery = function(column_name, condition_type, params) {
    var len = where_clause.length;
    for (var x = 0; x < len; x++) {
      if (where_clause[x]['column_name'] == column_name && where_clause[x]['condition_type'] == condition_type) {
        if (condition_type == "values") {
          where_clause[x]['in'] = util.subtract_array(where_clause[x]['in'], params['in']);
          where_clause[x]['not_in'] = util.subtract_array(where_clause[x]['not_in'], params['not_in']);
        }
        else if (condition_type == "range") {
          var __min = params['min'];
          var __max = params['max'];
          if(!util.isBlank(__min) && !util.isBlank(__max)) {
            if(__min == where_clause[x]['condition']['min'] && __max == where_clause[x]['condition']['max']) {
              where_clause.splice(x,1);
            }
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


  var addFilterInQuery = function(new_filter) {
    var is_new_filter = true;
    for (var i = 0; i < where_clause.length; i++) {
      var old_filter = where_clause[i];
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
            where_clause[i] = old_filter;
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
      where_clause.push(new_filter);
    }
  }

  // If a local filter is changed and it impacts a global then append to global
  var addFilterPropagate = function(new_filter) {
    if (_scope == "local") {
      var len = __impacts.length;
      for (var j = 0; j < len; j++) {
        var global_filter = window[__impacts[j]];
        global_filter.addFilter(new_filter, true, div_id);
      }
    }
  }


  this.addImpacts = function(array_of_div_ids, is_cyclical) {
    var query_object = window[array_of_div_ids[i]];
    if (impactValidation(array_of_div_ids)) {
      len = array_of_div_ids.length;
      for(var i = 0; i < len; i++) {
        __impacts.push(array_of_div_ids[i]);
        setGlobalDivIdForRawData(this,array_of_div_ids[0]);
        if(is_cyclical){
          setGlobalDivIdForRawData(window[array_of_div_ids[i]],this.div_id);
          related_pykquery = window[array_of_div_ids[i]];
          related_pykquery.impacts = [this.div_id];
        }
      }
    }
  }

  var setGlobalDivIdForRawData = function (that,id) {
    if (adapter === "inbrowser" && that.scope === "local") {
      if (!that.global_divid_for_raw_data) {
        that.global_divid_for_raw_data = id;
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
        console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "A " + _scope + " can only impact a " + impacts_allowed_on + ".")
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
      console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "Empty filter object is not allowed.")
      return false;
    }
    if(util.isBlank(f["column_name"])){
      console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "'column_name' cannot be empty.")
      return false;
    }
    if(!util.isBlank(f["next"]) && f["next"] != "OR" && f["next"] != "AND"){
      console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "'next' must either be empty or OR or AND.")
      return false;
    }
    if (f["condition_type"] == "range") {
      if(util.isBlank(f["condition"])){
        console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "'condition' cannot be empty.")
        return false;
      }
      else{
        if(util.isBlank(f["condition"]["min"]) && util.isBlank(f["condition"]["max"])){
          console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "Either 'min' or 'max' or both must always be present.")
          return false;
        }
      }
      return true;
    } else if (f["condition_type"] == "values") {
      if(util.isBlank(f["not_in"]) && util.isBlank(f["in"])){
        console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "Either 'in' or 'not_in' or both must always be present.")
        return false;
      }
      if(f["not_in"] != undefined && f["in"] != undefined){
        if(f["not_in"].length == 0 && f["in"].length == 0 ){
          console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "Either 'in' or 'not_in' or both must always be present.")
          return false;
        }
      }
      return true;
    }
    else{
      console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', div_id + ": 'condition_type' must be one of " + ["range", "values"] + ".");
      return false;
    }
  }

  //[{"col1": ["min", "max"]}]
  var metricsValidation = function(m) {
    var metric_functions = ['min', 'max', 'avg', 'sum', 'median', 'count'];
    if (Object.keys(m).length == 0) {
      console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "'metrics' object cannot be empty.")
      return false;
    }
    for (var prop in m) {
      if(util.isBlank(prop)){
        console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "Column name is undefined in 'metrics'.")
        return false;
      }
      if (util.isBlank(m[prop]) || m[prop].length == 0) {
        console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "Please pass an Array of metric functions for column name '" + prop + "'.")
        return false;
      }
      else{
        var len = m[prop].length;
        for(var i = 0; i < len; i++){
          if (metric_functions.indexOf(m[prop][i]) <= -1) {
            console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "Wrong metric function passed for column name '" + prop + "'.");
            return false;
          }
        }
      }
    }
    return true;
  }

  this.flushToGet = function(){
    if (_scope == "local") {
      var t = filter_data;
      filter_data = "";
      return t;
    } else {
      console.error("Cannot call flushToGet to on a Global PykQuery.")
    }
  }

  this.call = function() {
    var that = this;
    if (_scope == "local") {
      invoke_call(getConfig(that));
    } else {
      var len = __impacts.length;
      for(var j = 0; j < len; j++) {
        var local_filter = window[__impacts[j]];
        local_filter.filter_data = local_filter.call();
      }
    }
    return true;
  }

  var generateConsolidatedFiltersArray = function(){
    if (_scope == "local") {
      var consolidated_filters = that.filters;
      var len = __impacts.length;
      for(var i = 0; i < len; i++) {
        var global_filter = window[__impacts[i]].filters;
        if (global_filter && global_filter.localdividtriggeringevent !== div_id) {
          consolidated_filters = _.flatten(global_filter, consolidated_filters);
        }
      }
      return consolidated_filters;
    } else {
      console.error("Cannot call generateConsolidatedFiltersArray to on a Global PykQuery.");
    }
  }

  var appendSelectedClassToRespectiveDomId = function (filters) {
    if (filters) {
      for (var i = 0; i < filters.length; i++) {
        document.getElementById(filters[i].selected_dom_id).className += " selected";
      }
    }
  }

  var invoke_call = function(pykquery_json){
    var consolidated_filters = generateConsolidatedFiltersArray();
    appendSelectedClassToRespectiveDomId(consolidated_filters);
    var response;
    if(adapter == "inbrowser"){
      var connector = new PykQuery.adapter.inbrowser.init(pykquery_json, consolidated_filters);
      //console.log(pykquery_json);
      return filter_data = connector.call();
    }
    else{
      var connector = new PykQuery.adapter.rumi.init(pykquery_json);
      return connector.call(function (response) {
        return filter_data = response;
      });
    }
    //response = processAlias(response);
    //TODO to delete instance of adapter adapter.delete();
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
    //filter_obj['filters'] = where_clause;
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


  this.toSql = function() {
    that = this;

    var filters = that.filters,
    mode = that.mode,
    unique = that.unique,
    metrics = that.metrics,
    select = that.select,
    sort = that.sort,
    dimensions = that.dimensions,
    limit  = that.limit,
    offset = that.offset,
    div_id = that.div_id;

    var table_name = "__",
    columns = that.columns,
    required_columns = [],
    group_by_columns = [];

    var query_string = [],
    query_select = "",
    query_from = "FROM "+table_name+" ",
    query_where = [],
    query_group_by = "",
    query_order_by = "",
    query_limit = "",
    query_offset = "",
    next_op,
    vals,
    is_IN = false;


    //START -- SELECT COLUMN NAMES clause
    if (dimensions && mode == "aggregation") {
      if (metrics && _.isEmpty(metrics) == false) {
        for(var i in metrics){
          len = metrics[i].length;
          for(var j = 0; j < len; j++){
            required_columns.push(metrics[i][j] + "("+ i +")")
          }
        }
      }

      if (_.isEmpty(dimensions) == false) {
        for(var i=0 ; i<dimensions.length ; i++) {
          if (_.has(metrics, dimensions[i]) == false) {
            required_columns.push(dimensions[i]);
            group_by_columns.push(dimensions[i]);
          }
        }
      }
    }

    if (select && mode == "select") {
      if (_.intersection(columns,select).length !== 0 || select.toString() === ["*"].toString()) {
        _.each(select, function(d) {
          required_columns.push(d);
        });
      }
      else {
        return false; // column(s) not found
      }
    }

    if(unique && mode == "unique") {
      if (_.intersection(columns,unique).length !== 0) {
        _.each(unique, function(d) {
          required_columns.push(d);
        });
      }
      else {
        return false; // column(s) not found
      }
    }

    if (_.isEmpty(required_columns) == true && _.isEmpty(dimensions) == true && mode != "unique") {
      query_select = "SELECT * ";
    }
    else if (mode == "unique") {
      query_select = "SELECT DISTINCT " + required_columns.join(", ") + " ";
    }
    else {
      query_select = "SELECT " + required_columns.join(", ") + " ";
    }
    // END -- SELECT COLUMN NAMES clause


    // START -- WHERE clause
    if (filters && _.isEmpty(filters) == false) {
      // query_where = "WHERE ";
      next_op = false;

      _.each(filters, function (d,i) {
        // if (next_op) {
        //   query_where += next_op + " ";
        // }
        query_where[i] = "";
        switch (d["condition_type"]) {

          case "values" :
            vals = [];
            if (d["in"] && d["in"].length !== 0) {
              is_IN = true;
              query_where[i] += d["column_name"] + " IN (";
              _.each(d["in"], function (k) {
                query_where[i] += k + ", ";
              });
              query_where[i] = query_where[i].slice(0,-2) + ") ";
            }
            if (d["not_in"] && d["not_in"].length !== 0) {
              if (is_IN) {
                query_where[i] += "AND " + d["column_name"] + " NOT IN (";
              }
              else {
                query_where[i] += d["column_name"] + " NOT IN (";
              }
              _.each(d["not_in"], function (a) {
                query_where[i] += a + ", ";
              });
              query_where[i] = query_where[i].slice(0,-2) + ") ";
            }
            if (d["next"] && i != (filters.length - 1)) {
              query_where[i] = query_where[i] + d["next"];
              next_op = d["next"];
            }
            else {
              next_op = false;
            }
            break;

          case "range":
            if (_.isEmpty(d["condition"]) == false) {
              query_where[i] += d["column_name"] + " ";
              if (d["condition"]["not"]) {
                query_where[i] += "NOT ";
              }
              query_where[i] += "BETWEEN " + d["condition"]["min"] + " AND " + d["condition"]["max"] + " ";
              if (d["next"] && i != (filters.length - 1)) {
                query_where[i] = query_where[i] + d["next"];
                next_op = d["next"];
              }
              else {
                next_op = false;
              }
            }
            break;

          case "data_types":
            // yet to be coded
            break;
        }
      });
    }
    // END -- WHERE clause


    // START -- GROUP BY clause
    if (dimensions && mode === "aggregation") {
      query_group_by = "GROUP BY " + group_by_columns.join(", ") + " ";
    }
    // END -- GROUP BY clause


    // START -- ORDER BY clause
    if (sort && _.isEmpty(sort) == false) {
      query_order_by = "ORDER BY ";
      for (key in sort) {
        query_order_by += key + " " + sort[key] + ", ";
      }
      query_order_by = query_order_by.slice(0,-2) + " ";
    }
    // END -- ORDER clause


    // Limit & offset to be added to the query
    query_limit = (limit) ? ("LIMIT " + limit + " ") : query_limit;
    query_offset = (offset) ? ("OFFSET " + offset + " ") : query_offset;


    // FINAL DB QUERY STRING
    query_string = div_id + ": \n " + query_select + " \n " + query_from + " \n " + "WHERE";

    var query_where_length = query_where.length;
    for(var i=0 ; i<query_where_length ; i++) {
      query_string = query_string + " \n\t " + query_where[i];
    }

    query_string =  query_string + " \n " + query_group_by + " \n " + query_order_by + " \n " + query_limit + " \n " + query_offset;
    console.log(query_string);

    return query_string;
  };

  this.filterList = function (div_element) {
    $('#'+div_element).empty();
    $('#'+div_element).append("<div class='filter_list'></div>");
    showFilterList(where_clause,div_element);
    $( ".filter_remove").unbind( "click" );
    $(document).on('click','.filter_remove',function(){
      var index  = $(this).attr("id").split("filter_remove_");
      //var data

      removeFilterFromList(index[1],where_clause,div_element);
    });
  }
  var showFilterList = function() {
    len = where_clause.length,
    filter_values = "values in filter";
    $('.filter_list').empty();
    for(var i =0 ;i< len;i++){
      //$('.filter_block').empty();
      $('.filter_list').append("<div class='filter_block' id ='filter_block"+i+"'></div>");
      $('#filter_block'+i).append("<div class ='filter_value"+i+"'>"+filter_values+"</div>");
      $('#filter_block'+i).append("<div id ='filter_remove_"+i+"'class ='filter_remove'>remove</div>");
      //return false;
    }
  }
  var removeFilterFromList = function (index) {
    where_clause.splice(index,1);
    showFilterList();
  }
};

PykQuery.adapter = PykQuery.adapter || {};
PykQuery.adapter.rumi = {};

PykQuery.adapter.rumi.init = function(pykquery_json) {

  this.call = function(onComplete) {
    var xmlhttp, response;

    if (window.XMLHttpRequest) {
      // code for IE7+, Firefox, Chrome, Opera, Safari
      xmlhttp = new XMLHttpRequest();
    } else {
      // code for IE6, IE5
      xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == 4 ) {
        if(xmlhttp.status == 201){
          response = xmlhttp.responseText;
          console.log(xmlhttp.responseText, response);
          onComplete(response);
        }
        else if(xmlhttp.status == 400) {
          console.error('There was an error 400');
        }
        else {
          console.error('something else other than 200 was returned');
        }
      }
    }

    xmlhttp.open("POST", "http://192.168.0.121:9292/v1/filter/show", false);
    xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    console.log(response, "------response");
    xmlhttp.send(JSON.stringify(pykquery_json));
  }
}

PykQuery.adapter = PykQuery.adapter || {};
PykQuery.adapter.inbrowser = {};
//PykQuery.adapter.inbrowser.init(pykquery_json);
PykQuery.adapter.inbrowser.init = function (pykquery, consolidated_filters){
  // data which is used for filtering data is in global_divid_for_raw_data

  global_divid_for_raw_data = window[pykquery.global_divid_for_raw_data];
  raw_data = global_divid_for_raw_data.rawdata;

  var query_object = pykquery,
      raw_data;

  global_divid_for_raw_data = window[pykquery.global_divid_for_raw_data];
  raw_data = global_divid_for_raw_data.rawdata;

  query_object.filters = consolidated_filters;

  // function call by adapter from pykquery.js
  this.call = function () {
    var filtered_data;
    var mode = pykquery.mode;
    //checking whether filter is exit in query or not
    if(query_object.filters != undefined){
      if(query_object.filters.length > 0) {
        //console.log('start filter');
        startFilterData(query_object); //call to start filter
      }
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
    return filtered_data;
  }

  var startAggregation = function (filter_obj){
    var metrics = filter_obj.metrics;
    // matrics_column_name = objectkeymatrics;
    local_data = _.groupBy(raw_data,filter_obj.dimensions[0]);
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
      return local_data;
    }
  }

  var metricsCount = function (local_data,column_name) {
    var local_filter_array = []
    _.map(local_data, function (value,key) {
      var local_obj = {};
      local_obj[pykquery.dimensions[0]] = key;
      local_obj[column_name] = value.length;
      local_filter_array.push(local_obj);
    });
    //console.log(local_filter_array);
    return local_filter_array;
  }

  var metricsSum = function (local_data,column_name) {
    var local_filter_array = []
    _.map(local_data, function (values,key) {
      var local_obj = {};
      local_obj[pykquery.dimensions[0]] = key;
      local_obj[column_name] = _.sum(values, function (value) {
        return value[column_name];
      });
      local_filter_array.push(local_obj);
    });
    //console.log(local_filter_array);
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
          console.log('---- value code');
          valueFilter(filters_array[i],columns,mode); // Changed the passing paramenter from filter_obj.select to filter_obj.dimensions as select is not applicable to filters ---> AUTHOR RONAK
          break;
        case "range":
          console.log('---- range code');
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
    var min = filter_obj['condition']['min'],
        max = filter_obj['condition']['max'],
        column_name = filter_obj['column_name'],
        col;
    raw_data = _.filter(raw_data ,function (obj){
      if(obj[column_name] <= max && obj[column_name] >=min){
        return obj;
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

}
