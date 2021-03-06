PykUtil = {}

PykUtil.init = function() {

    this.pushToArray = function(a1, o1){
        a1 = !a.length ? [o1] : (a.push(o1));
        return a1;
    }

    //TODO - Change all _ ruby like names to CamelCase for all PykUtil Functions
    this.concatAndUniq = function(a1, a2) {
        if (a1 != undefined && a2 != undefined){
            a1 = a1.concat(a2)
                .filter(function(item, i, ar) {
                    return ar.indexOf(item) === i;
            });
        }
        return a1;
    }

    this.isExactlySame = function(a1, a2) {
      if (a1 && a2){
        var is_same2 = (a1.length === a2.length) && a1.every(function(element, index) {
          return _.isEqual(element,a2[index]);
        });
        return is_same2;
      }
      else{
        return false;
      }
    }

    this.subtractArray = function(a1, a2) {
        if (a1 && a2){
          if (a1.length === 0) {
            a1 = undefined;
            return a1;
          }
          var a2_length = a2.length;
            for (var i = 0; i < a2_length; i++) {
                var index = a1.indexOf(a2[i]);
                if (index > -1) {
                    a1.splice(index, 1);
                }
                if (a1.length === 0) {
                  a1 = undefined;
                  return a1;
                }
            }
        }
        return a1;
    }

    this.subtractObjectAttribute = function (a1, a2) {
      if (a1 && a2) {
        if (Object.keys(a1).length === 0) {
          a1 = undefined;
          return a1;
        }
        var a2_length = a2.length;
        for (var i = 0; i < a2_length; i++) {
          if (a1[a2[i]]) {
            delete a1[a2[i]];
          }
          if (Object.keys(a1).length === 0) {
            a1 = undefined;
            return a1;
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
PykQuery.connector_names = [];
PykQuery.node_names = [];
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
      is_interactive = (query_object.scope === "node") ? false : true;
      query_object.addFilter([saved_filters[i]], is_interactive, true,query_object.nodedividtriggeringevent, true);
    }
    if (saved_filters_length === 0) {
      if(query_object.scope === "connector"){
        var get_class_filter_list = document.getElementsByClassName('filter_list');
        if (get_class_filter_list.length > 0) {
          var div = get_class_filter_list[0].parentNode.id;
          query_object.listFilters(div);
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
  var self = this;
  var div_id, mode, _scope, adapter, connector_exists, node_exists, node_div_id_triggering_event, table_name = adapter_param,  queryable_filters, consolidated_filters = [],
      available_mode = ["aggregation", "unique", "select", "datatype", "connector"],
      available_scope = ["node", "connector"],
      available_adapters = ["inbrowser", "db"],
      available_dataformat = ["csv","json","array"];

  var util = new PykUtil.init()
    , util_is_blank = util.isBlank
    , util_concatAndUniq = util.concatAndUniq
    , util_subtractArray = util.subtractArray
    , util_subtractObjectAttribute = util.subtractObjectAttribute;

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
    div_id = (_scope === "node") ? divid_param.replace("#","") : divid_param;
    connector_exists = (_scope === "connector") ? _.find(PykQuery.connector_names,function(d){ return (d === div_id); }) : null;
    node_exists = (_scope === "node") ? _.find(PykQuery.node_names,function(d){ return (d === div_id); }) : null;

    if (mode == "connector" && _scope != "connector"){
      errorHandling(1, div_id + ": scope and mode both should be connector");
      return false;
    }

    //Checks if div_id exists in DOM
    if(connector_exists == undefined && _scope == "connector") {
      PykQuery.connector_names.push(div_id);
      flag = true;
    }
    else if (node_exists == undefined && _scope == "node") {
      PykQuery.node_names.push(div_id);
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
  connector_divid_for_rawdata,
  data_format,
  data_type = [],
  call_append_selected_class = true;
  // set the connector data to pykquery
  this.executeOnFilter = function () {}

  if(mode === "connector" && _scope === "connector" && adapter === "inbrowser") {
    Object.defineProperty(this, 'rawdata', {
      get: function() {
        return raw_data;
      },
      set: function(mydata) {
        raw_data = mydata;
      }
    });
  }
  if(_scope === "node" && adapter === "inbrowser") {
    Object.defineProperty(this, 'connector_divid_for_raw_data', {
      get: function() {
        return connector_divid_for_rawdata;
      },
      set: function(my_connector_div_id) {
        connector_divid_for_rawdata = my_connector_div_id;
      }
    });
  }
  if(adapter === "db") {
    Object.defineProperty(this, 'tablename', {
      get: function() {
        return table_name;
      },
      set: function(params) {
        table_name = params;
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
          dimensions = util_concatAndUniq(dimensions, name);
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
      if (mode === "datatype" && _scope === "node" && adapter === "db") {
        Object.defineProperty(this, 'datatype', {
          get: function() {
            return data_type;
          },
          set: function(type) {
            data_type = util_concatAndUniq(data_type,type);
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

  Object.defineProperty(this, 'nodedividtriggeringevent', {
    get: function() {
      return node_div_id_triggering_event;
    },
    set: function(id) {
      node_div_id_triggering_event = id;
    }
  });

  // Object.defineProperty(this, 'filterdata', {
  //   get: function() {
  //     return filter_data;
  //   },
  //   set: function(mydata) {
  //     filter_data = mydata;
  //   }
  // });

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

  // The end user must not be using it. Its used internally to set the impact of another connector for handling cyclical loops.
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
          sort = util_concatAndUniq(sort, name);
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

  this.addFilter = function(name, is_interactive, call_to_filter, domid, restore){
    if(is_interactive && _scope === "connector"){
      addFilterInQuery(name,is_interactive, call_to_filter,this,restore);
      if (document.getElementsByClassName(div_id+'-filter_list').length > 0) {
        showFilterList();
      }
    } else if(is_interactive && _scope === "node"){
      addFilterPropagate(name, call_to_filter);
    } else if(!is_interactive && _scope === "node"){ //onload
      addFilterInQuery(name,is_interactive, call_to_filter,this,restore);
    } else if(!is_interactive && _scope === "connector"){
      //not possible
    }
  }

  function addFilterInQuery(new_filter,is_interactive, call_to_filter,caller_scope,restore) {
    var is_new_filter = false
      , where_clause_length = where_clause.length
      , new_filter_length = new_filter.length
      , duplicate_filter = true;
    for (var j = 0; j < new_filter_length; j++) { // Iterate over external loop of new filter
      var new_filter_j = new_filter[j]
        , new_filter_j_len = new_filter_j.length
        , element = document.querySelectorAll("[data-id='"+new_filter_j[0].selected_dom_id+"']");

      if (new_filter_j_len > 1) {
        for (var n = 0; n < new_filter_j_len - 1; n++) {
          new_filter_j[n].group = true;
        }
        new_filter_j[new_filter_j_len-1].group = false;
      }
      if (where_clause_length === 0) {
        where_clause.push(new_filter_j);
        is_new_filter = true;
        duplicate_filter = false;
      } else {
        var break_if_same_filter = false;
        for (var m = 0; m < where_clause_length; m++) {
          var is_same1 = util.isExactlySame(new_filter_j, where_clause[m])
          , is_same2 = util.isExactlySame(new_filter_j, where_clause[m]);
          if (is_same2 && is_same1) {
            warningHandling(2, "Clean up your JS: Same filter cannot add");
            break_if_same_filter = true;
            break;
          }
        }
        if (break_if_same_filter) {
          break;
        }
        if (element.length>0 && element[0].classList.contains("pykquery-selected") && !new_filter_j.override_filter) {
        } else {
          var filter_group_processed = false;
          for (var k = 0; k < new_filter_j_len; k++) { // Iterate over internal loop of new filter
            var new_filter_k = new_filter_j[k]
              , break_if_filter_processed = false;
            for (var i = 0; i < where_clause_length; i++) { // Iterate over external loop of old filter
              var old_filter = where_clause[i]
                , old_filter_length = old_filter.length;
              if (filterValidation(new_filter_k)) {
                for (var l = 0; l < old_filter_length; l++) { // Iterate over internal loop of old filter
                  var old_filter_l = old_filter[l]
                    , old_filter_l_colname = old_filter_l['column_name']
                    , old_filter_l_condition = old_filter_l['condition_type'];

                  if (old_filter_l_colname === new_filter_k['column_name'] && old_filter_l_condition === new_filter_k['condition_type']){
                    if (old_filter_l_condition === "values" || old_filter_l_condition === "datatype") {
                      var is_same3 = util.isExactlySame(new_filter_k['not_in'], old_filter_l['in'])
                        , is_same4 = util.isExactlySame(new_filter_k['in'], old_filter_l['not_in']);
                      if (new_filter_k.override_filter && (is_same3 || is_same4)) {
                        where_clause[i][l] = new_filter_k;
                        call_append_selected_class = false;
                        break_if_filter_processed = true;
                        filter_group_processed = true;
                        break;
                      }
                    } else if(old_filter_l_condition === "range") {
                      var new_c = new_filter_k['condition'],
                          old_c = old_filter_l['condition'];
                      if(new_c['min'] === old_c['min'] && new_c['max'] === old_c['max']  && new_c['not'] === old_c['not']){
                        warningHandling(2, "Clean up your JS: Same filter cannot add");
                        break;
                      } else {
                        if (new_filter_k.override_filter) {
                          where_clause[i][l] = new_filter_k;
                          call_append_selected_class = false;
                          break_if_filter_processed = true;
                          filter_group_processed = true;
                          break;
                        }
                      }
                    }
                  }
                }
                if (break_if_filter_processed) {
                  duplicate_filter = false;
                  break;
                }
              }
            }
          }
          if (!filter_group_processed) {
            where_clause.push(new_filter_j);
            is_new_filter = true;
            duplicate_filter = false;
          }
        }
      }
    }
    if (!duplicate_filter) {
      if (is_new_filter === true){
        if (caller_scope && caller_scope.scope==="connector" && call_to_filter) {
          caller_scope.call();
        }
      } else {
        if (!call_append_selected_class && call_to_filter) {
          caller_scope.call();
        }
      }

      query_restore = restore;
      if (!restore) {
        setQueryJSON(caller_scope.div_id,caller_scope.scope,where_clause);
      }
      query_restore = true;
    } else {
      caller_scope.removeFilter(new_filter, is_interactive,call_to_filter);
    }
   is_new_filter = where_clause_length = new_filter_length = duplicate_filter = null;
  }

  // If a node filter is changed and it impacts a connector then append to connector
  function addFilterPropagate(new_filter,call_to_filter) {
    var new_filter_length = new_filter.length;
    for (var i = 0; i < new_filter_length; i++) {
      var new_filter_i = new_filter[i]
        , new_filter_i_len = new_filter_i.length;
      for (var j = 0; j < new_filter_i_len; j++) {
        new_filter_i[j].node_div_id_triggering_event = div_id;
      }
    }
    if (_scope === "node") {
      var len = __impacts.length;
      for (var j = 0; j < len; j++) {
        window[__impacts[j]].addFilter(new_filter, true,call_to_filter, div_id);
      }
    }
  }

  this.removeFilter = function(name, is_interactive,call_to_filter){
    if(is_interactive && _scope === "connector"){
      removeFilterInQuery(name,this,call_to_filter);
      if (document.getElementsByClassName(div_id+'-filter_list').length > 0) {
        showFilterList();
      }
    } else if(is_interactive && _scope === "node"){
      removeFilterPropagate(name,this,call_to_filter);
    } else if(!is_interactive && _scope === "node"){ //onload
      removeFilterInQuery(name,this,call_to_filter);
    } else if(!is_interactive && _scope === "connector"){
      //not possible
    }
  }

  function removeFilterInQuery(name,caller_scope,call_to_filter) {
    var where_clause = caller_scope.filters,
        where_clause_length = where_clause.length,
        name_length = name.length,
        is_deleted = false;

    for (var j = 0; j < name_length; j++) { // Iterate over external array of new filter
      var new_filter_j = name[j]
        , new_filter_j_len = new_filter_j.length
        , filter_group_in_where_clause = false;
      for (var m = 0; m < where_clause_length; m++) { // Iterate over external array of old filter
        var is_same1 = util.isExactlySame(new_filter_j, where_clause[m])
          , is_same2 = util.isExactlySame(new_filter_j, where_clause[m]);
        if (is_same2 && is_same1) {
          where_clause.splice(m,1);
          is_deleted = true;
          filter_group_in_where_clause = true;
          break;
        }
      }
      if (!filter_group_in_where_clause && new_filter_j_len === 1) {
        for (var k = 0; k < new_filter_j_len; k++) { // Iterate over internal array of new filter
          var new_filter_k = new_filter_j[k];
            column_name = new_filter_k.column_name,
            condition_type = new_filter_k.condition_type;
          if (filterValidation(new_filter_k)) {
            for (var l = where_clause_length-1; l >= 0; l--) { // Iterate over external array of old filter
              var old_filter = where_clause[l]
                , old_filter_length = old_filter.length
              if (old_filter_length === 1) {
                for (var x = old_filter_length-1; x >= 0; x--) { // Iterate over internal array of old filter
                  var old_filter_x = old_filter[x]
                    , old_filter_x_colname = old_filter_x['column_name']
                    , old_filter_x_condition = old_filter_x['condition_type']
                  if (old_filter_x_colname === column_name && old_filter_x_condition === condition_type) {
                    if (condition_type === "values" || condition_type === "datatype") {
                      if (_.difference(old_filter_x.in, new_filter_k.in).length===0 && _.difference(old_filter_x.not_in, new_filter_k.not_in).length===0) {
                        old_filter.splice(x,1);
                        if (old_filter.length === 0) {
                          where_clause.splice(l,1);
                        }
                        is_deleted = true;
                      }
                    } else if (condition_type === "range") {
                      var __min = new_filter_k['condition']['min'];
                      var __max = new_filter_k['condition']['max'];
                      if(!util_is_blank(__min) && !util_is_blank(__max)) {
                        if(__min === old_filter_x['condition']['min'] && __max === old_filter_x['condition']['max']) {
                          old_filter.splice(x,1);
                          if (old_filter.length === 0) {
                            where_clause.splice(l,1);
                          }
                          is_deleted = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    if (caller_scope && is_deleted && call_to_filter) {
      caller_scope.call();
    }
    query_restore = false;
    setQueryJSON(caller_scope.div_id,caller_scope.scope,where_clause);
  }

  function removeFilterPropagate(name,caller_scope,call_to_filter) {
    var new_filter_length = name.length;
    for (var i = 0; i < new_filter_length; i++) {
      var new_filter_i = name[i]
        , new_filter_i_len = new_filter_i.length;
      for (var j = 0; j < new_filter_i_len; j++) {
        new_filter_i[j].node_div_id_triggering_event = div_id;
      }
    }
    if(_scope === "node") {
      var len = __impacts.length;
      for(var j =0;j<len;j++) {
        window[__impacts[j]].removeFilter(name,caller_scope,call_to_filter);
      }
      len = null;
    }
  }

  function removeColumns(columns, caller_scope) {
    var len1 = where_clause.length
      , len2 = columns.length;
    for (var i = 0; i < len2; i++) {
      removeIndividualAdditionalQueryParams(columns[i], caller_scope);
      where_clause = _.reject(where_clause, function (d) {
        var len3 = d.length;
        for (var j = 0; j < len3; j++) {
          return d[j].column_name==columns[i];
        }
      });
    }
    if (where_clause.length !== len1) {
      if (document.getElementsByClassName(div_id+'-filter_list').length > 0) {
        showFilterList();
      }
      caller_scope.call();
    }
    len1 = len2 = null;
  }

  function removeIndividualAdditionalQueryParams(column, caller_scope) {
    var alias = caller_scope.alias
      , select = caller_scope.select
      , sort = caller_scope.sort;
    if (alias) {
      delete alias[column];
    }
    if (select) {
      var index = select.indexOf(column);
      if (index > -1) {
        select.splice(index,1);
      }
    }
    if (sort) {
      sort = _.reject(sort, function (d) { return Object.keys(d)[0]==column });
    }
  }

  function removeAllAdditionalQueryParams (caller_scope) {
    // remove filters pending...Also only params of either dimension or metrics should get cleared depending on callee.
    var alias = caller_scope.alias
      , select = caller_scope.select
      , sort = caller_scope.sort;
    if (alias) {
      for (var key in alias) {
        delete alias[key];
      }
    }
    if (select) {
      while (select.length > 0) {
        select.pop();
      }
    }
    if (sort) {
      for (var key in sort) {
        delete sort[key];
      }
    }
  }

  this.resetFilters = function(){
    if(_scope === "connector"){
      while (where_clause.length>0) {
        where_clause.pop();
      }
      this.call();
      query_restore = false;
      setQueryJSON(this.div_id,this.scope,where_clause);
      if (document.getElementsByClassName(div_id+'-filter_list').length > 0) {
        showFilterList();
      }
    } else {
      errorHandling(9, "You cannot run resetFilters on node. Please run it on a Connector");
    }
  }

  this.resetDimensions = function(){
    if(_scope === "node"){
      while(this.dimensions.length > 0) {
        removeIndividualAdditionalQueryParams(this.dimensions[this.dimensions.length-1], this);
        this.dimensions.pop();
      }
      // removeAllAdditionalQueryParams(this);
      query_restore = false;
      setQueryJSON(this.div_id,this.scope,[]);
    } else {
      errorHandling(10, "Connectors do not have dimensions. Please run it on a node");
    }
  }

  this.resetDatatypes = function(){
    if(_scope === "node"){
      while(this.datatype.length > 0) {
        this.datatype.pop();
      }
      query_restore = false;
      setQueryJSON(this.div_id,this.scope,[]);
    } else {
      errorHandling(11, "Connectors do not have datatypes. Please run it on a node");
    }
  }

  this.resetMetrics = function(){
    if(_scope === "node"){
      for (var key in this.metrics) {
        removeIndividualAdditionalQueryParams(key, this);
        delete this.metrics[key];
      }
      // removeAllAdditionalQueryParams(this);
      query_restore = false;
      setQueryJSON(this.div_id,this.scope,[]);
    } else {
      errorHandling(12, "Connectors do not have metrics. Please run it on a node");
    }
  }

  this.removeDimensions = function (columns) {
    if (util_is_blank(columns) || columns.length === 0){
      errorHandling(27, columns + ": Columns cannot be blank. Kindly pass an array of dimensions");
      return false;
    }
    if (this.dimensions) {
      var len = this.dimensions.length;
      if (len > 0) {
        util_subtractArray(this.dimensions, columns);
        if (len === this.dimensions.length) {
          return false;
        }
      }
    }
    removeColumns(columns, this);
    query_restore = false;
    setQueryJSON(this.div_id,this.scope,this.filters);
    return true;
  }

  this.removeMetrics = function (columns) {
    if (util_is_blank(columns) || columns.length === 0){
      errorHandling(27, columns + ": Columns cannot be blank. Kindly pass an array of metrics");
      return false;
    }
    if (this.metrics) {
      var len = Object.keys(this.metrics).length;
      if (len > 0) {
        util_subtractObjectAttribute(this.metrics, columns);
        if (len === Object.keys(this.metrics).length) {
          return false;
        }
      }
    }
    removeColumns(columns, this);
    query_restore = false;
    setQueryJSON(this.div_id,this.scope,this.filters);
    return true;
  }

  this.destroyColumn = function (column) {
    if (_scope === "connector") {
      this.removeDimensions([column]);
      this.removeMetrics([column]);
      var len =  __impacts.length;
      for (var i = 0; i < len; i++) {
        window[__impacts[i]].removeDimensions([column]);
        window[__impacts[i]].removeMetrics([column]);
      }
    } else {
      this.removeDimensions([column]);
      this.removeMetrics([column]);
    }
  }

  function changeColumnNameInternally(caller_scope, old_column, new_column) {
    var current_filters = caller_scope.filters;
    if (_scope === "node") {
      var dimensions = caller_scope.dimensions
        , metrics = caller_scope.metrics
        , alias = caller_scope.alias
        , select = caller_scope.select
        , sort = caller_scope.sort;
      if (dimensions) {
        var dimension_index = dimensions.indexOf(old_column);
        if (dimension_index > -1) {
          dimensions[dimension_index] = new_column;
        }
      }
      if (metrics && metrics[old_column]) {
        metrics[new_column] = metrics[old_column];
        delete metrics[old_column];
      }
      if (alias && alias[old_column]) {
        alias[old_column] = alias[new_column];
        delete alias[old_column];
      }
      if (select) {
        var select_index = select.indexOf(old_column);
        if (select_index > -1) {
          select[select_index] = new_column;
        }
      }
      if (sort) {
        var len2 = sort.length;
        for (var j = 0; j < len2; j++){
          if (sort[j][old_column]) {
            sort[j][new_column] = sort[j][old_column];
            delete sort[j][old_column];
          }
        }
      }
    }
    if (current_filters) {
      var len3 = current_filters.length;
      for (var j = 0; j < len3; j++) {
        if (current_filters[j].column_name === old_column) {
          current_filters[j].column_name = new_column;
          if (document.getElementsByClassName(div_id+'-filter_list').length > 0) {
            showFilterList();
          }
        }
      }
    }
  }

  this.changeColumnName = function (old_column, new_column, is_propogated) {
    if (_scope === "connector") {
      changeColumnNameInternally(this, old_column, new_column);
      var len =  __impacts.length;
      for (var i = 0; i < len; i++) {
        window[__impacts[i]].changeColumnName(old_column, new_column, true);
      }
    } else {
      changeColumnNameInternally(this, old_column, new_column);
      if (!is_propogated) {
        var len =  __impacts.length;
        for (var i = 0; i < len; i++) {
          window[__impacts[i]].changeColumnName(old_column, new_column);
        }
      }
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
        if (this.scope ==="node") {
          setConnectorDivIdForRawData(this,array_of_div_ids[i]);
        } else {
          setConnectorDivIdForRawData(query_object,this.div_id);
        }
        if(is_cyclical){
          __impactedby.push(array_of_div_ids[i]);
          query_object.impacts.push(this.div_id);
          setConnectorDivIdForRawData(query_object,this.div_id);
        }
      }
    }
  }

  function setConnectorDivIdForRawData(that,id) {
    if (!that.connector_divid_for_raw_data) {
      that.connector_divid_for_raw_data = id;
    }
  }

  function impactValidation(array_of_div_ids){
    var len = array_of_div_ids.length,
        impacts_allowed_on,
        query_object;
    if (_scope === "node") {
      error_code = 13;
      impacts_allowed_on = "connector";
    } else {
      error_code = 7;
      impacts_allowed_on = "node";
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
  function filterValidation(f) {
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
  function metricsValidation(m) {
    var metric_functions = ['sum', 'count', 'min', 'max', 'avg', 'median','countOfUnique'];
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
    if (_scope === "node") {
      var t = filter_data;
      filter_data = "";
      return t;
    } else {
      errorHandling(25, "Cannot call flushToGet to on a Connector PykQuery");
    }
  }

  this.call = function() {
    var that = this;
    if (_scope === "node") {
      invoke_call(getConfig(that));
      // this.executeOnFilter();
    } else {
      var len = __impacts.length;
      for(var j = 0; j < len; j++) {
        var node_filter = window[__impacts[j]];
        node_filter.filter_data = node_filter.call();
      }
      if (call_append_selected_class) {
        this.appendClassSelected();
      }
    }
    return true;
  }

  function generateConsolidatedFiltersArray(){
      // var consolidated_filters = JSON.parse(JSON.stringify(window[div_id].filters)),
      var consolidated_filters = _.flatten(window[div_id].filters),
          consolidated_filters_length = consolidated_filters.length,
          len = __impactedby.length,
          connector_filter,
          connector_filter_length,
          each_filter,
          each_filter_length;

      for(var i = 0; i < len; i++) {
        connector_filter = window[__impactedby[i]].filters;
        connector_filter_length  = connector_filter.length;
        for (var j = 0; j < connector_filter_length; j++) {
          each_filter = connector_filter[j];
          each_filter_length = each_filter.length;
          for (var k = 0; k < each_filter_length; k++) {
            if (each_filter[k] && each_filter[k].node_div_id_triggering_event !== div_id) {
              consolidated_filters.push(each_filter[k]);
            }
          }
        }
      }
      return consolidated_filters;
  }

  function generateQueryableFiltersArray(){
    // if (_scope === "node") {
    var consolidated_filters_length = consolidated_filters.length
      , filters_with_group = []
      , filters_without_group = []
      , queryable_filters = [];
    if (Object.keys(PykQuery.query_json).length > 0) {
      queryable_filters = [];
    }
    if (consolidated_filters && consolidated_filters.length > 0) {
      queryable_filters = [];
      for (var j = 0; j < consolidated_filters_length; j++) {
        if (consolidated_filters[j].hasOwnProperty('group')) {
          filters_with_group.push(consolidated_filters[j]);
        } else {
          filters_without_group.push(consolidated_filters[j]);
        }
      }
      var group = _.groupBy(filters_without_group, function (d) {
        if (!d.hasOwnProperty('group')) {
          return d.column_name + "-" + d.condition_type;
        }
      });
      for (var key in group) {
        var each_filter = group[key],
        each_filter_length = each_filter.length;
        var obj = {
          "column_name": each_filter[0].column_name,
          "condition_type": each_filter[0].condition_type,
          "node_div_id_triggering_event": each_filter[0].node_div_id_triggering_event,
          "next": each_filter[0]['next']
        }
        if (each_filter[0].hasOwnProperty('group')) {
          obj.group = each_filter[0]['group'];
        }
        if (each_filter[0].condition_type === "values" || each_filter[0].condition_type === "datatype") {
          var where_in = [],
          where_not_in = [];
          for (var i = 0; i < each_filter_length; i++) {
            where_in = each_filter[i].in ? util_concatAndUniq(where_in, each_filter[i].in) : where_in;
            where_not_in = each_filter[i].not_in ? util_concatAndUniq(where_not_in, each_filter[i].not_in) : where_not_in;
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
    return filters_with_group.concat(queryable_filters);
    // } else {
    //   errorHandling(101, "Cannot call generateQueryableFiltersArray on a Connector PykQuery");
    // }
  }

  var invoke_call = function(query){
    consolidated_filters = generateConsolidatedFiltersArray();
    queryable_filters = generateQueryableFiltersArray();
    if(adapter === "inbrowser"){
      var connector = new PykQuery.adapter.inbrowser.init(query, queryable_filters);
      filter_data = connector.call();
      if(_scope === "node") {
        self.executeOnFilter();
      }

      return filter_data;
    }
    else{
      var connector = new PykQuery.adapter.db.init(query, table_name, queryable_filters);
      return connector.call(function (response) {
        filter_data = response;
        if(_scope === "node") {
          self.executeOnFilter();
        }
        return filter_data;
      });
    }
    //TODO to delete instance of adapter adapter.delete();
  }

  // getConfig is use generate whole query
  function getConfig(that) {
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
  function urlParams(attr,filter,the_change) {
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
  };

  this.appendClassSelected = function () {
    if (this.scope === "connector") {
      if (where_clause) {
        var divs = document.querySelectorAll(".pykquery-selected"),
            divs_length = divs.length,
            where_clause_length = where_clause.length;
        for (var i = 0; i < divs_length; i++) {
          divs[i].classList.remove("pykquery-selected");
        }
        for (var i = 0; i < where_clause_length; i++) {
          var where_clause_i = where_clause[i]
            , where_clause_i_len = where_clause_i.length;
          for (var j = 0; j < where_clause_i_len; j++) {
            if (where_clause_i[j].selected_dom_id) {
              var element = document.querySelectorAll("[data-id='"+where_clause_i[j].selected_dom_id+"']");
              if (element.length>0 && !element[0].classList.contains("pykquery-selected")) {
                element[0].classList.add("pykquery-selected");
              }
            }
          }
        }
      }
    } else {
      errorHandling(26,"Cannot call appendClassSelected() on node")
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
      if (metrics && !_.isEmpty(metrics)) {
       for(var i in metrics){
          var len = metrics[i].length;
          for(var j = 0; j < len; j++){
            required_columns.push(metrics[i][j] + "("+ i +")")
          }
        }
      }

      if (!_.isEmpty(dimensions)) {
        var dimensions_length = dimensions.length;
        for(var i=0 ; i<dimensions_length ; i++) {
          if (_.has(metrics, dimensions[i]) === false) {
            required_columns.push(dimensions[i]);
            group_by_columns.push(dimensions[i]);
          }
        }
      }
    }

    if (select && mode === "select") {
      if (_.intersection(columns,select).length !== 0 || select.toString() === ["*"].toString()) {
        _.each(select, function(d) {
          required_columns.push(d);
        });
      }
      else {
        return false; // column(s) not found
      }
    }

    if(unique && mode === "unique") {
      if (_.intersection(columns,unique).length !== 0) {
        _.each(unique, function(d) {
          required_columns.push(d);
        });
      }
      else {
        return false; // column(s) not found
      }
    }

    if (_.isEmpty(required_columns) && _.isEmpty(dimensions) && mode != "unique") {
      query_select = "SELECT * ";
    }
    else if (mode === "unique") {
      query_select = "SELECT DISTINCT " + required_columns.join(", ") + " ";
    }
    else {
      query_select = "SELECT " + required_columns.join(", ") + " ";
    }
    // END -- SELECT COLUMN NAMES clause


    // START -- WHERE clause
    if (filters && !_.isEmpty(filters)) {
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
            if (!_.isEmpty(d["condition"])) {
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
    if (sort && !_.isEmpty(sort)) {
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
    var element = document.getElementById(div_element);
    element.innerHTML = "";
    element.innerHTML = "<div class='"+div_id+"-filter_list'></div>";
    showFilterList();
  }

  function showFilterList() {
    var get_class_name_filter_list = document.getElementsByClassName(div_id+'-filter_list')[0]
    , where_clause_length = where_clause.length
    , next = "";
    get_class_name_filter_list.innerHTML = "";
    for (var i = 0; i < where_clause_length; i++) {
      var where_clause_i = where_clause[i]
      , where_clause_i_len = where_clause_i.length
      , value = "";
      for (var j = 0; j < where_clause_i_len; j++) {
        var where_clause_j = where_clause_i[j];
        next = j !== where_clause_i_len-1 ? where_clause_j['next'] : "";
        if (where_clause_j.in) {
          value += "<b>" + where_clause_i[j].column_name + " IN</b> (" + where_clause_j.in+") <i>" + next + " </i>";
        } else if (where_clause_j.not_in) {
          value += "<b>" + where_clause_i[j].column_name + " NOT IN</b> (" + where_clause_j.not_in+")";
        } else if (where_clause_j.condition) {
          var not_between = "";
          if (where_clause_j.condition.not) {
            not_between = "NOT";
          }
          value += "<b>" + where_clause_i[j].column_name + " " + not_between + " BETWEEN</b> " + where_clause_j.condition.min.toFixed(2)+" <b>AND</b> "+where_clause_j.condition.max.toFixed(2);
        }
      }
      // var filterBlock = "<div id='filter_block'"+i+" class='filter_block' style='padding: 0px 10px;'></div>"
      var filter_block = document.createElement("div");
      filter_block.setAttribute("class",div_id+"-filter_block");
      filter_block.setAttribute("style","padding: 0px 10px;");
      filter_block.setAttribute("id",div_id+"_filter_block"+i);
      get_class_name_filter_list.appendChild(filter_block);
      var filter_values = document.createElement("div");
      filter_values.setAttribute("class",div_id+"-filter_value");
      filter_values.innerHTML = value;
      document.getElementById(div_id+'_filter_block'+i).appendChild(filter_values);
      var filter_remove = document.createElement("div");
      filter_remove.setAttribute("class",div_id+"-filter_remove");
      filter_remove.setAttribute("id",div_id+"_filter_remove_"+i);
      filter_remove.innerHTML = "<b class='glyphicon glyphicon-trash' style='font-size: 11px;cursor:pointer'></b>";
      document.getElementById(div_id+'_filter_block'+i).appendChild(filter_remove);
    }
    var divs = document.getElementsByClassName(div_id+"-filter_remove"),
        divs_length = divs.length;
    for (var i = 0; i< divs_length; i++) {
      divs[i].onclick = function () {
        var index = this.id.split("_")
        removeFilterFromList(where_clause[index[3]]);
      }
    }
  }

  function removeFilterFromList(filter_to_be_removed) {
    var key = filter_to_be_removed[0].node_div_id_triggering_event;
    window[key].removeFilter([filter_to_be_removed], true,true);
  }
};

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
  avg : function(obj, iterator, context) {
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
      _.isArray(obj) && _.each(obj, function(value, index, list) {
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
PykQuery.adapter.db = {};

PykQuery.adapter.db.init = function(pykquery_json,table_name, queryable_filters) {

  this.call = function(onComplete) {
    var xmlhttp;

    if(table_name) {
      pykquery_json["filters"] = queryable_filters;
      var data = {
        config: pykquery_json
      };
    } else {
      return false;
    }

    if (window.XMLHttpRequest) {
      xmlhttp=new XMLHttpRequest();
    } else {
      xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState==4 && (xmlhttp.status==200 || xmlhttp.status==201)) {
        onComplete(JSON.parse(xmlhttp.response));
      }
    }
    xmlhttp.open("POST",db_api_endpoint + table_name + "filter/show",true);
    xmlhttp.setRequestHeader("Content-Type","text/plain; charset=utf-8")
    xmlhttp.send(JSON.stringify(data));
  }
}

PykQuery.adapter = PykQuery.adapter || {};
PykQuery.adapter.inbrowser = {};
//PykQuery.adapter.inbrowser.init(query);
PykQuery.adapter.inbrowser.init = function (pykquery, queryable_filters){
  // data which is used for filtering data is in connector_divid_for_raw_data
  var query_object = pykquery,
      raw_data,
      connector_divid_for_raw_data = pykquery.connector_divid_for_raw_data,
  connector_divid_for_raw_data = window[connector_divid_for_raw_data];
  raw_data = connector_divid_for_raw_data.rawdata;
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
      case "select":
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
    query_object = raw_data = connector_divid_for_raw_data = raw_data = null;
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
            case "sum":
              local_obj[processAlias(prop[i],individual_metric[j])] = _.sum(value, function (values) {
                return parseInt(values[prop[i]],10);
              });
              break;
            case "count":
              local_obj[processAlias(prop[i],individual_metric[j])] = value.length;
              break;
            case "min":
              local_obj[processAlias(prop[i],individual_metric[j])] = _.min(value, function (values) {
                return parseInt(values[prop[i]],10);
              })[prop[i]];
              break;
            case "max":
              local_obj[processAlias(prop[i],individual_metric[j])] = _.max(value, function (values) {
                return parseInt(values[prop[i]],10);
              })[prop[i]];
              break;
            case "avg":
              local_obj[processAlias(prop[i],individual_metric[j])] = _.avg(value, function (values) {
                return parseInt(values[prop[i]],10);
              });
              break;
            case "median":
              console.log(value,prop)
              local_obj[processAlias(prop[i],individual_metric[j])] = _.median(value, function (values) {
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

  function startFilterData(filter_obj) {
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
