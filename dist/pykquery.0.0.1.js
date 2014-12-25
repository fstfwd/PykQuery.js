PykUtil = {}

PykUtil.init = function() {

    this.pushToArray = function(a1, o1){
        a1 = !a.length ? [o1] : (a.push(o1));
        return a1;
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
        if (a1 && a2){
            var is_same2 = (a1.length === a2.length) && a1.every(function(element, index) {
                return element === a2[index];
            });
            return is_same2;
        }
        else{
            return true;
        }
    }

    this.subtract_array = function(a1, a2) {
        if (a1 && a2){
            var a2_length = a2.length;
            for (var i = 0; i < a2_length; i++) {
                var index = a1.indexOf(a2[i]);
                if (index > -1) {
                    a1.splice(index, 1);
                }
                if (a1.length === 0) {
                  a1 = undefined;
                }
            }
        }
        return a1;
    }

    this.isBlank = function(a) {
        return !a ? true : false
    }
}

var PykQuery = {};
PykQuery.global_names = [];
PykQuery.local_names = [];
PykQuery.query_json = {};

var queryjson = {},
    query_restore = true;
    // consolidated_filters = [];

var restoreFilters = function () {
  for (var key in PykQuery.query_json) {
    var saved_filters = PykQuery.query_json[key],
        query_object = window[key],
        is_interactive,
        saved_filters_length = saved_filters.length;

    for (var  i = 0; i < saved_filters_length; i++) {
      is_interactive = (query_object.scope === "local") ? false : true;
      query_object.addFilter(saved_filters[i], is_interactive, query_object.localdividtriggeringevent, true);
    }
    if (saved_filters_length === 0) {
      if(window[key].scope === "global"){
        if (document.getElementsByClassName('filter_list').length > 0) {
          var div = document.getElementsByClassName('filter_list')[0].parentNode.id;
          window[key].listFilters(div);
        }
      }
    }
  }
}
Object.defineProperty(PykQuery, 'query_json', {
  get: function () {
    return queryjson;
  },
  set: function (json) {
    queryjson = json;
    if (query_restore) {
      restoreFilters();
    }
  }
});

var setQueryJSON = function (id,scope,filters) {
  PykQuery.query_json[id] = filters;
}

PykQuery.init = function(mode_param, _scope_param, divid_param, adapter_param) {

  var div_id, mode, _scope, adapter, global_exists, local_exists, local_div_id_triggering_event, rumi_params = adapter_param,  queryable_filters, consolidated_filters = [],
      available_mode = ["aggregation", "unique", "select", "datatype", "global"],
      available_scope = ["local", "global"],
      available_adapters = ["inbrowser", "rumi"],
      available_dataformat = ["csv","json","array"];

  var util = new PykUtil.init();
  var util_is_blank = util.isBlank;

  var errorHandling = function (error_code,error_message) {
    var visit = "";
    if (error_code<100) {
      visit = "Visit http://0.0.0.0:4567/#error_"+error_code;
    }
    console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', '("'+error_message+'"). '+visit);
  }

  var warningHandling = function (warning_code,warning_message) {
    console.warn('%c[Warning - PykQuery] ', 'color: #F8C325;font-weight:bold;font-size:14px', '("'+warning_message+'"). Visit http://0.0.0.0:4567/#warning_'+warning_code);
  }

  if (available_mode.indexOf(mode_param) > -1 && available_scope.indexOf(_scope_param) > -1 && !util_is_blank(divid_param) && available_adapters.indexOf(adapter_param) > -1) {
    mode = mode_param;
    _scope = _scope_param;
    adapter = adapter_param;
    div_id = (_scope === "local") ? divid_param.replace("#","") : divid_param;
    global_exists = (_scope === "global") ? _.find(PykQuery.global_names,function(d){ return (d === div_id); }) : null;
    local_exists = (_scope === "local") ? _.find(PykQuery.local_names,function(d){ return (d === div_id); }) : null;

    if (mode == "global" && _scope != "global"){
      errorHandling(1, div_id + ": scope and mode both should be global");
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
    if (available_mode.indexOf(mode_param) === -1){
      errorHandling(2, divid_param + ": mode has invalid value. It should be one of " + available_mode);
    }
    if (available_scope.indexOf(_scope_param) === -1){
      errorHandling(3, divid_param + ": scope has invalid value. It should be one of " + available_scope);
    }
    if (available_adapters.indexOf(adapter_param) === -1){
      errorHandling(4, divid_param + ": adapters has invalid value. It should be one of " + available_adapters);
    }
    if (util_is_blank(divid_param)){
      errorHandling(5, divid_param + ": DivID cannot be undefined");
    }
    return false;
  }

  var where_clause = [],
  dimensions = [],
  metrics = {},
  cols = [],
  sort = [],
  limit = 2000,
  __impacts =[],
  __impactedby = [],
  offset = 0,
  alias = {},
  filter_data,
  raw_data,
  global_divid_for_rawdata,
  execute_on_filter = function () {},
  data_format,
  data_type = [];
  // set the global data to pykquery

  if(mode === "global" && _scope === "global" && adapter === "inbrowser") {
    Object.defineProperty(this, 'rawdata', {
      get: function() {
        return raw_data;
      },
      set: function(mydata) {
        raw_data = mydata;
      }
    });
  }
  if(_scope === "local" && adapter === "inbrowser") {
    Object.defineProperty(this, 'global_divid_for_raw_data', {
      get: function() {
        return global_divid_for_rawdata;
      },
      set: function(my_global_div_id) {
        global_divid_for_rawdata = my_global_div_id;
      }
    });
  }
  if(adapter === "rumi") {
    Object.defineProperty(this, 'rumiparams', {
      get: function() {
        return rumi_params;
      },
      set: function(params) {
        rumi_params = params;
      }
    });

    Object.defineProperty(this, 'dataformat', {
      get: function() {
        return data_format;
      },
      set: function(format) {
        if (available_dataformat.indexOf(format.toLowerCase()) > -1) {
          data_format = format;
        } else {
          errorHandling(6, "The accepted data formats are csv, json and array only. Kindly set a valid data format");
        }
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
          dimensions = _.union(dimensions, name);
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
      if (mode === "datatype" && _scope === "local" && adapter === "rumi") {
        Object.defineProperty(this, 'datatype', {
          get: function() {
            return data_type;
          },
          set: function(type) {
            data_type = _.union(data_type,type);
          }
        });
      }
      // errorHandling(7, "Datatype is currently a missing functionality");
      break;
  }

  Object.defineProperty(this, 'div_id', {
    get: function() {
      return div_id;
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
  Object.defineProperty(this, 'impactedby', {
    get: function() {
      return __impactedby;
    },
    set: function(val) { //APPEND
      // if (impactValidation(val)){
        __impactedby.push(val);
      // }
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
        warningHandling(1, "Need atleast 1 alias name to add.");
        return;
      }

      for (var column_name in vals) {
        alias[column_name] = vals[column_name];
      }
    }
  });

  Object.defineProperty(this, 'sort', {
    get: function() {
      return sort;
    },
    set: function(name) { //"[{"col1": "asc"}, ]"
    var name_length = name.length;
      for (var i = 0; i < name_length; i++) {
        var prop = Object.keys(name[i])[0],
            len2 = sort.length,
            sort_column_already_present = false;
        if(util_is_blank(prop)){
          errorHandling(8, "Column name is undefined in sort");
          return;
        }
        if (util_is_blank(name[i][prop]) || (name[i][prop] != "asc" && name[i][prop] != "desc")) {
          name[i][prop] = "asc";
        }
        for (var j = 0; j < len2; j++) {
          if (sort[j][prop]) {
            sort[j][prop] = name[i][prop];
            sort_column_already_present = true;
            break;
          }
        }
        if (!sort_column_already_present) {
          sort = _.union(sort, name);
        }
      }
    }
  });

  Object.defineProperty(this, 'filters', {
    get: function() {
      return where_clause;
    },
    set: function(new_where_clause){ //used only by the adaptors!
      where_clause = new_where_clause;
    }
  });

  Object.defineProperty(this, 'executeOnFilter', {
    get: function() {
      return execute_on_filter();
    },
    set: function(callback) {
      execute_on_filter = callback;
    }
  });

  this.addFilter = function(name, is_interactive, domid, restore){
    var element = document.querySelectorAll("[data-id='"+name.selected_dom_id+"']");
    if (element.length>0 && element[0].classList.contains("pykquery-selected")) {
      this.removeFilter(name, is_interactive);
      return;
    }
    if (filterValidation(name)) {
      if(is_interactive && _scope === "global"){
        addFilterInQuery(name,this,restore);
        if (document.getElementsByClassName('filter_list').length > 0) {
          showFilterList();
        }
      } else if(is_interactive && _scope === "local"){
        name.local_div_id_triggering_event = div_id;
        addFilterPropagate(name,this,restore);
      } else if(!is_interactive && _scope === "local"){ //onload
        addFilterInQuery(name,this,restore);
      } else if(!is_interactive && _scope === "global"){
        //not possible
      }
    }
  }

  var addFilterInQuery = function(new_filter,caller_scope,restore) {
    var is_new_filter = true;
    var where_clause_length = where_clause.length;

    for (var i = 0; i < where_clause_length; i++) {
      var old_filter = where_clause[i];
      if (old_filter['column_name'] === new_filter['column_name'] && old_filter['condition_type'] === new_filter['condition_type']){
        if (old_filter['condition_type'] === "values" || old_filter['condition_type'] === "datatype") {
          var is_same1 = util.is_exactly_same(new_filter['in'], old_filter['in']),
              is_same2 = util.is_exactly_same(new_filter['not_in'], old_filter['not_in']);
          if (is_same2 === true && is_same1 === true) {
            warningHandling(2, "Clean up your JS: Same filter cannot add");
            return false;
          }
          else {
            is_new_filter = true;
            break;
          }
        } else if(old_filter['condition_type'] === "range") {
          var new_c = new_filter['condition'],
              old_c = old_filter['condition'];
          if(new_c['min'] === old_c['min'] && new_c['max'] === old_c['max']  && new_c['not'] === old_c['not']){
            warningHandling(2, "Clean up your JS: Same filter cannot add");
            return false;
          } else {
            if (name.override_filter) {
              where_clause.splice(i, 1);
            }
            is_new_filter = true;
          }
        }
      }
    }

    if (is_new_filter == true){
      where_clause.push(new_filter);
      if (caller_scope && caller_scope.scope==="global") {
        caller_scope.call();
      }
    }

    query_restore = restore;
    if (!restore) {
      setQueryJSON(caller_scope.div_id,caller_scope.scope,where_clause);
    }
    query_restore = true;
  }

  // If a local filter is changed and it impacts a global then append to global
  var addFilterPropagate = function(new_filter) {
    if (_scope === "local") {
      var len = __impacts.length;
      for (var j = 0; j < len; j++) {
        window[__impacts[j]].addFilter(new_filter, true, div_id);
      }
    }
  }

  this.removeFilter = function(name, is_interactive){
    if (filterValidation(name)) {
      if(is_interactive && _scope === "global"){
        removeFilterInQuery(name,this);
        if (document.getElementsByClassName('filter_list').length > 0) {
          showFilterList();
        }
      } else if(is_interactive && _scope === "local"){
        removeFilterPropagate(name,this);
      } else if(!is_interactive && _scope === "local"){ //onload
        removeFilterInQuery(name,this);
      } else if(!is_interactive && _scope === "global"){
        //not possible
      }
    }
  }

  var removeFilterInQuery = function(name,caller_scope) {
    var column_name = name.column_name,
        condition_type = name.condition_type,
        where_clause = caller_scope.filters,
        where_clause_length = where_clause.length;
    for (var x = 0; x < where_clause_length; x++) {
      if (where_clause[x]['column_name'] === column_name && where_clause[x]['condition_type'] === condition_type) {
        if (condition_type === "values" || condition_type === "datatype") {
          if (_.difference(where_clause[x].in, name.in).length===0 && _.difference(where_clause[x].not_in, name.not_in).length===0) {
            where_clause.splice(x,1);
          }
          if (caller_scope) {
            caller_scope.call();
          }
        } else if (condition_type === "range") {
          var __min = name['condition']['min'];
          var __max = name['condition']['max'];
          if(!util_is_blank(__min) && !util_is_blank(__max)) {
            if(__min === where_clause[x]['condition']['min'] && __max === where_clause[x]['condition']['max']) {
              where_clause.splice(x,1);
              if (caller_scope) {
                caller_scope.call();
              }
            }
          }
        }
      }
    }
    query_restore = false;
    setQueryJSON(caller_scope.div_id,caller_scope.scope,where_clause);
  }

  var removeFilterPropagate = function(name,caller_scope) {
    if(_scope == "local") {
      var len = __impacts.length;
      for(var j =0;j<len;j++) {
        window[__impacts[j]].removeFilter(name,caller_scope);
      }
    }
  }

  this.resetFilters = function(){
    if(_scope == "global"){
      where_clause = [];
      this.call();
      query_restore = false;
      setQueryJSON(this.div_id,this.scope,where_clause);
      if (document.getElementsByClassName('filter_list').length > 0) {
        showFilterList();
      }
    } else {
      errorHandling(9, "You cannot run resetFilters on local. Please run it on a Global");
    }
  }

  this.resetDimensions = function(){
    if(_scope === "local"){
      while(this.dimensions.length > 0) {
        this.dimensions.pop();
      }
      // this.call();
      query_restore = false;
      setQueryJSON(this.div_id,this.scope,[]);
    } else {
      errorHandling(10, "Globals do not have dimensions. Please run it on a local");
    }
  }

  this.resetDatatypes = function(){
    if(_scope == "local"){
      while(this.datatype.length > 0) {
        this.datatype.pop();
      }
      // this.call();
      query_restore = false;
      setQueryJSON(this.div_id,this.scope,[]);
    } else {
      errorHandling(11, "Globals do not have datatypes. Please run it on a local");
    }
  }

  this.resetMetrics = function(){
    if(_scope === "local"){
      for (var key in this.metrics) {
        delete this.metrics[key];
      }
      // this.call();
      query_restore = false;
      setQueryJSON(this.div_id,this.scope,[]);
    } else {
      errorHandling(12, "Globals do not have metrics. Please run it on a local");
    }
  }

  //g1.impacts(l1)
  this.addImpacts = function(array_of_div_ids, is_cyclical) {
    if (impactValidation(array_of_div_ids)) {
      len = array_of_div_ids.length;
      for(var i = 0; i < len; i++) {
        __impacts.push(array_of_div_ids[i]);

        //loop on array_of_div_ids for each d
        var query_object = window[array_of_div_ids[i]];
        query_object.impactedby = this.div_id;//d.impacted_by(this)
        if (this.scope ==="local") {
          setGlobalDivIdForRawData(this,array_of_div_ids[i]);
        } else {
          setGlobalDivIdForRawData(query_object,this.div_id);
        }
        if(is_cyclical){
          __impactedby.push(array_of_div_ids[i]);
          query_object.impacts.push(this.div_id);
          setGlobalDivIdForRawData(query_object,this.div_id);
        }
      }
    }
  }

  var setGlobalDivIdForRawData = function (that,id) {
    if (!that.global_divid_for_raw_data) {
      that.global_divid_for_raw_data = id;
    }
  }

  var impactValidation = function(array_of_div_ids){
    var len = array_of_div_ids.length,
        impacts_allowed_on,
        query_object;
    if (_scope === "local") {
      error_code = 13;
      impacts_allowed_on = "global";
    } else {
      error_code = 7;
      impacts_allowed_on = "local";
    }
    for (var i = 0; i < len; i++) {
      query_object = window[array_of_div_ids[i]];
      if (query_object && query_object.scope === _scope) {
        errorHandling(error_code, "A " + _scope + " can only impact a " + impacts_allowed_on);
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
    var f_next = f["next"],
        f_condition_type = f["condition_type"];

    if (Object.keys(f).length === 0) {
      errorHandling(14, "Empty filter object is not allowed");
      return false;
    }
    if(util_is_blank(f["column_name"])){
      errorHandling(15, "'column_name' cannot be empty");
      return false;
    }
    if(!util_is_blank(f_next) && f_next !== "OR" && f_next !== "AND"){
      errorHandling(16, "'next' must either be empty or OR or AND");
      return false;
    }
    if (f["condition_type"] === "range") {
      if(util_is_blank(f["condition"])){
        errorHandling(17, "'condition' cannot be empty");
        return false;
      }
      else{
        if(util_is_blank(f["condition"]["min"]) && util_is_blank(f["condition"]["max"])){
          errorHandling(18, "Either 'min' or 'max' or both must always be present");
          return false;
        }
      }
      return true;
    } else if (f["condition_type"] === "values" || f["condition_type"] === "datatype") {
      if(util_is_blank(f["not_in"]) && util_is_blank(f["in"])){
        errorHandling(19, "Either 'in' or 'not_in' or both must always be present with array of some value");
        return false;
      }
      if(f["not_in"] !== undefined && f["in"] !== undefined){
        if(f["not_in"].length === 0 && f["in"].length === 0 ){
          errorHandling(19, "Either 'in' or 'not_in' or both must always be present with array of some value");
          return false;
        }
      }
      return true;
    }
    else{
      errorHandling(20, div_id + ": 'condition_type' must be one of " + ["range", "values", "datatype"]);
      return false;
    }
  }

  //[{"col1": ["min", "max"]}]
  var metricsValidation = function(m) {
    var metric_functions = ['min', 'max', 'avg', 'sum', 'median', 'count'];
    if (Object.keys(m).length === 0) {
      errorHandling(21, "'metrics' object cannot be empty");
      return false;
    }
    for (var prop in m) {
      if(util_is_blank(prop)){
        errorHandling(22, "Column name is undefined in 'metrics'");
        return false;
      }
      if (util_is_blank(m[prop]) || m[prop].length === 0) {
        errorHandling(23, "Please pass an Array of aggregation functions for column name '" + prop);
        return false;
      }
      else{
        var len = m[prop].length;
        for(var i = 0; i < len; i++){
          if (metric_functions.indexOf(m[prop][i]) <= -1) {
            errorHandling(24, "Wrong aggregation function passed for column name '" + prop);
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
      errorHandling(25, "Cannot call flushToGet to on a Global PykQuery");
    }
  }

  this.call = function() {
    var that = this;
    if (_scope === "local") {
      invoke_call(getConfig(that));
      this.executeOnFilter;
    } else {
      var len = __impacts.length;
      for(var j = 0; j < len; j++) {
        var local_filter = window[__impacts[j]];
        local_filter.filter_data = local_filter.call();
      }
      this.appendClassSelected();
    }
    return true;
  }

  var generateConsolidatedFiltersArray = function(){
    // if (_scope === "local") {
      var consolidated_filters = JSON.parse(JSON.stringify(window[div_id].filters)),
          len = __impactedby.length,
          global_filter,
          global_filter_length;

      for(var i = 0; i < len; i++) {
        global_filter = window[__impactedby[i]].filters;
        global_filter_length  = global_filter.length;
        for (var j = 0; j < global_filter_length; j++) {
          if (global_filter[j] && global_filter[j].local_div_id_triggering_event !== div_id) {
            consolidated_filters.push(global_filter[j]);
          }
        }
      }
      //Loop over consolidated filters
      //If my div == filter.where_i_came_from_div_id then remove me from consolidated filters
      // for (var j = 0; j < consolidated_filters.length; j++) {
      //   if (div_id === consolidated_filters[j].local_div_id_triggering_event) {
      //     consolidated_filters.splice(j, 1);
      //   }
      // }
      return consolidated_filters;
    // } else {
    //   errorHandling(100, "Cannot call generateConsolidatedFiltersArray on a Global PykQuery");
    // }
  }

  var generateQueryableFiltersArray = function(){
    // if (_scope === "local") {
      if (Object.keys(PykQuery.query_json).length > 0) {
        queryable_filters = [];
      }
      if (consolidated_filters && consolidated_filters.length > 0) {
        queryable_filters = [];
        var group = _.groupBy(consolidated_filters, function (d) {
          return d.column_name + "-" + d.condition_type;
        });
        for (var key in group) {
          var each_filter = group[key],
              each_filter_length = each_filter.length;
          var obj = {
            "column_name": each_filter[0].column_name,
            "condition_type": each_filter[0].condition_type,
            "local_div_id_triggering_event": each_filter[0].local_div_id_triggering_event,
            "next": each_filter[0]['next']
          }
          if (each_filter[0].condition_type === "values" || each_filter[0].condition_type === "datatype") {
            var where_in = [],
                where_not_in = [];
            for (var i = 0; i < each_filter_length; i++) {
              where_in = each_filter[i].in ? _.union(where_in, each_filter[i].in) : where_in;
              where_not_in = each_filter[i].not_in ? _.union(where_not_in, each_filter[i].not_in) : where_not_in;
            }
            obj.in = where_in;
            obj.not_in = where_not_in;
          } else if (each_filter[0].condition_type === "range") {
            obj.condition = [];
            for (var i = 0; i < each_filter_length; i++) {
              obj.condition .push({
                min: each_filter[i].condition.min,
                max: each_filter[i].condition.max,
                not: each_filter[i].condition.not
              });
            }
          }
          queryable_filters.push(obj);
        }
      }
      return queryable_filters;
    // } else {
    //   errorHandling(101, "Cannot call generateQueryableFiltersArray on a Global PykQuery");
    // }
  }

  var invoke_call = function(query){
    consolidated_filters = generateConsolidatedFiltersArray();
    queryable_filters = generateQueryableFiltersArray();
    if(adapter == "inbrowser"){
      var connector = new PykQuery.adapter.inbrowser.init(query, queryable_filters);
      return filter_data = connector.call();
    }
    else{
      var connector = new PykQuery.adapter.rumi.init(query, rumi_params, queryable_filters);
      return connector.call(function (response) {
        return filter_data = response;
      });
    }
    //TODO to delete instance of adapter adapter.delete();
  }

  // getConfig is use generate whole query
  var getConfig = function(that) {
    var filter_obj = {};
    var querydata;
    var arr = Object.getOwnPropertyNames(that);
    var arr_length = arr.length;
    for (var i = 0; i < arr_length;i++) {
      if (that.propertyIsEnumerable(arr[i]) === false) {
        filter_obj[arr[i]] = that[arr[i]];
      }
    }
    return filter_obj;
  };

  /* -------------- URL params ------------ */
  // var filters = ["Pykih","mumbai","startup"];
  var urlParams = function (attr,filter,the_change) {
    // console.log(url,"***",params,"***",filters,filters.length);
    var url_params = "", index;

    if(the_change === 0) { // Add to URL
      params = (_.isEmpty(filters)) ? "?"+attr+"="+filter : params+"&"+attr+"="+filter;
      url_params = url +""+ params;
      filters.push(filter);
    }
    else if(the_change === 1) { // Remove from URL
      if(filters.length === 1) { // Only 1 filter ==> Empty
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

  this.appendClassSelected = function () {
    if (this.scope === "global") {
      if (where_clause) {
        var divs = document.querySelectorAll(".pykquery-selected"),
            divs_length = divs.length,
            where_clause_length = where_clause.length;
        for (var i = 0; i < divs_length; i++) {
          divs[i].classList.remove("pykquery-selected");
        }
        for (var i = 0; i < where_clause_length; i++) {
          if (where_clause[i].selected_dom_id) {
            var element = document.querySelectorAll("[data-id='"+where_clause[i].selected_dom_id+"']");
            if (element.length>0 && !element[0].classList.contains("pykquery-selected")) {
              element[0].classList.add("pykquery-selected");
            }
          }
        }
      }
    } else {
      errorHandling(26,"Cannot call appendClassSelected() on local")
    }
  }


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
    if (dimensions && mode === "aggregation") {
      if (metrics && _.isEmpty(metrics) == false) {
        for(var i in metrics){
          var len = metrics[i].length;
          for(var j = 0; j < len; j++){
            required_columns.push(metrics[i][j] + "("+ i +")")
          }
        }
      }

      if (_.isEmpty(dimensions) === false) {
        var dimensions_length = dimensions.length;
        for(var i=0 ; i<dimensions_length ; i++) {
          if (_.has(metrics, dimensions[i]) === false) {
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

    if (_.isEmpty(required_columns) === true && _.isEmpty(dimensions) === true && mode !== "unique") {
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
    if (filters && _.isEmpty(filters) === false) {
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
            if (_.isEmpty(d["condition"]) === false) {
              query_where[i] += d["column_name"] + " ";
              if (d["condition"]["not"]) {
                query_where[i] += "NOT ";
              }
              query_where[i] += "BETWEEN " + d["condition"]["min"] + " AND " + d["condition"]["max"] + " ";
              if (d["next"] && i !== (filters.length - 1)) {
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
    if (sort && _.isEmpty(sort) === false) {
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

  this.listFilters = function (div_element) {

    document.getElementById(div_element).innerHTML = "";
    document.getElementById(div_element).innerHTML = "<div class='filter_list'></div>";
    showFilterList();
  }
  var showFilterList = function() {
    document.getElementsByClassName('filter_list')[0].innerHTML = "";
    var where_clause_length = where_clause.length;
    for (var i = 0; i < where_clause_length; i++) {
      if (where_clause[i].in) {
        var value = "<b>" + where_clause[i].column_name + " IN</b> (" + where_clause[i].in+")";
      } else if (where_clause[i].not_in) {
        var value = "<b>" + where_clause[i].column_name + " NOT IN</b> (" + where_clause[i].not_in+")";
      } else if (where_clause[i].condition) {
        var value = "<b>" + where_clause[i].column_name + " BETWEEN</b> " + where_clause[i].condition.min.toFixed(2)+" <b>AND</b> "+where_clause[i].condition.max.toFixed(2);
      }
      var filter_block = document.createElement("div");
      filter_block.setAttribute("class","filter_block");
      filter_block.setAttribute("style","padding: 0px 10px;");
      filter_block.setAttribute("id","filter_block"+i);
      document.getElementsByClassName('filter_list')[0].appendChild(filter_block);
      var filter_values = document.createElement("div");
      filter_values.setAttribute("class","filter_value");
      filter_values.innerHTML = value;
      document.getElementById('filter_block'+i).appendChild(filter_values);
      var filter_remove = document.createElement("div");
      filter_remove.setAttribute("class","filter_remove");
      filter_remove.setAttribute("id","filter_remove_"+i);
      filter_remove.innerHTML = "<b class='glyphicon glyphicon-trash' style='font-size: 11px;'></b>";
      document.getElementById('filter_block'+i).appendChild(filter_remove);
    }
    var divs = document.getElementsByClassName("filter_remove"),
        divs_length = divs.length;
    for (var i = 0; i< divs_length; i++) {
      divs[i].onclick = function () {
        var index = this.id.split("_")
        removeFilterFromList(where_clause[index[2]]);
      }
    }
  }

  var removeFilterFromList = function (filter_to_be_removed) {
    var key = filter_to_be_removed.local_div_id_triggering_event;
    window[key].removeFilter(filter_to_be_removed, true);
  }
};

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
    var util_is_blank = util.isBlank;
    console.log(util.isBlank(params))
    if (params == undefined) {
      console.error('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "Empty rumi parameter object is not allowed.")
      return false;
    }
    if(util_is_blank(params['filename'])){
      console.log('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "filename missing in rumi parameter");
      return false;
    }
    if(util_is_blank(params['username'])){
      console.log('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "username missing in rumi parameter");
      return false;
    }
    if(util_is_blank(params['projectname'])){
      console.log('%c[Error - PykQuery] ', 'color: red;font-weight:bold;font-size:14px', "projectname missing in rumi parameter");
      return false;
    }
    return true;
  }
}

// underscore addon with sum, mean, median and nrange function
// see details below

_.mixin({

  // Return sum of the elements
  sum : function(obj, iterator, context) {
    if (!iterator && _.isEmpty(obj)) return 0;
    var result = 0;
    if (!iterator && _.isArray(obj)){
      for(var i=obj.length-1;i>-1;i-=1){
        result += obj[i];
      };
      return result;
    };
    _.each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      result += computed;
    });
    return result;
  },

  // Return aritmethic mean of the elements
  // if an iterator function is given, it is applied before
  mean : function(obj, iterator, context) {
    if (!iterator && _.isEmpty(obj)) return Infinity;
    if (!iterator && _.isArray(obj)) return _.sum(obj)/obj.length;
    if (_.isArray(obj) && !_.isEmpty(obj)) return _.sum(obj, iterator, context)/obj.length;
  },

  // Return median of the elements
  // if the object element number is odd the median is the
  // object in the "middle" of a sorted array
  // in case of an even number, the arithmetic mean of the two elements
  // in the middle (in case of characters or strings: obj[n/2-1] ) is returned.
  // if an iterator function is provided, it is applied before
  median : function(obj, iterator, context) {
    if (_.isEmpty(obj)) return Infinity;
    var tmpObj = [];
    if (!iterator && _.isArray(obj)){
      tmpObj = _.clone(obj);
      tmpObj.sort(function(f,s){return f-s;});
    }else{
      _.isArray(obj) && each(obj, function(value, index, list) {
        tmpObj.push(iterator ? iterator.call(context, value, index, list) : value);
        tmpObj.sort();
      });
    };
    return tmpObj.length%2 ? tmpObj[Math.floor(tmpObj.length/2)] : (_.isNumber(tmpObj[tmpObj.length/2-1]) && _.isNumber(tmpObj[tmpObj.length/2])) ? (tmpObj[tmpObj.length/2-1]+tmpObj[tmpObj.length/2]) /2 : tmpObj[tmpObj.length/2-1];
  },

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  // replacement of old _.range() faster + incl. convenience operations:
  //    _.nrange(start, stop) will automatically set step to +1/-1
  //    _.nrange(+/- stop) will automatically start = 0 and set step to +1/-1
  nrange : function(start, stop, step) {
    if (arguments.length <= 1) {
      if (start === 0)
        return [];
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1*(start < stop) || -1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    do {
      range[idx] = start;
      start += step;
    } while((idx += 1) < len);

    return range;
  }

})

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
    var filter_obj_dimension = filter_obj.dimensions;
    var filter_obj_dimensions_length = filter_obj_dimension.length;
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
      var local_obj = {},
          keys = key.split("<>"),
          keys_length = keys.length;
      for (var j = 0; j < keys_length; j++) {
        local_obj[processAlias(pykquery.dimensions[j])] = keys[j];
      }
      var prop = Object.keys(metrics);
      var prop_length = prop.length;
      for (var i=0; i<prop_length; i++) {
        var individual_metric = metrics[prop[i]],
            individual_metric_length = individual_metric.length;
        for (var i = 0; i < individual_metric_length; i++) {
          switch (individual_metric[i]) {
            case "count":
              local_obj[processAlias(prop[i],individual_metric[i])] = value.length;
              break;
            case "sum":
              local_obj[processAlias(prop[i],individual_metric[i])] = _.sum(value, function (values) {
                return parseInt(values[prop[i]],10);
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
    return raw_data;
  }

  var valueFilter = function (filter_obj,columns,mode) {
    var _in = filter_obj['in'],
        not_in = filter_obj['not_in'],
        column_name = filter_obj['column_name'],
        col;
    raw_data = _.filter(raw_data ,function (obj) {
      if(!not_in || not_in.indexOf(obj[column_name]) < 0) {
        if(_in && _in.indexOf(obj[column_name]) > -1) {  
          return obj;
        }
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
  }; 

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
      return aggregation_method ? alias[colname][aggregation_method] : alias[colname][colname];
    }
    return colname;
  }
}
