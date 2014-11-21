//TODO - Isha if PykQuery object related to PykChart changes its filterdata then re-render the chart

var PykQuery = {} 
PykQuery.init = function(mode, _scope, divid, adapter) {

  that = this;
  var div_id;
  var available_mode = ["aggregation", "unique", "select", "datatype", "global"];
  var available_scope = ["local", "global"];
  var available_adapters = ["inbrowser", "rumi"];
  var util = new PykUtil.init();
  //TODO Check if divid exists in DOM.
    
  if (available_mode.indexOf(mode) > -1 && available_scope.indexOf(_scope) > -1 && !util.isBlank(divid) && available_adapters.indexOf(adapter) > -1) {
    mode = mode;
    _scope = _scope;
    adapter = adapter;
    div_id = divid;
    if (mode == "global" && _scope != "global"){
        console.error(divid + ": scope and mode both should be global.");
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
      impacts =[],
      offset = 0,
      filter_data,raw_data,global_divid_for_rawdata;
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
  if( _scope == "local" && adapter == "inbrowser") {
    Object.defineProperty(this, 'global_divid_for_raw_data', {
      get: function() {
        return global_divid_for_rawdata;
      },
      set: function(my_global_div_id) {
        global_divid_for_rawdata = my_global_div_id;
      }
    });
  }
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
          dimensions.push(name);
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
          cols.push(name);
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

  //Used internally but not accessible to the user

  Object.defineProperty(this, '__impacts', {
    get: function() {
      return impacts;
    },
    set: function(value) {
       impacts.push(value)
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
      var len = impacts.length;
      for (var j = 0; j < len; j++) {
        var global_filter = window[impacts[j]];
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

  //this function is only called on Global
  //listOfLocals is a list of divid of locals
  this.addLocals = function(listOfLocals){
      if( listOfLocals != undefined && listOfLocals.length > 0){
          len = listOfLocals.length;
          for(var i = 0; i < len; i++){
              var l = findQueryByDivid(listOfLocals[i]);
              var local = window[l];
              if (local == undefined){
                  console.error("You are trying to addLocal " + listOfLocals[i] + " whose DIV does not exist.");
                  return false;
              }
              local.__impacts = util.pushToArray(local.__impacts, div_id);
              //in most scenarios there will be only one global hence a smart pre-set
              if(local.__impacts.length == 1 && adapter == "inbrowser"){ 
                local.global_divid_for_raw_data = div_id;
              }  
              impacts = util.pushToArray(impacts, listOfLocals[i]);
          }
      }
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
  
  this.call = function(){
    if (_scope == "local"){
      filterdata = invoke_call(this.getConfig())
    }
    else{
      filterdata = invoke_call(this.getConfig())
      var len = impacts.length;
      for(var j =0;j<len;j++) {
        var local_filter = window[impacts[j]];
         local_filter.filterdata =local_filter.call();
      }
    }
  }
  
  var invoke_call = function(pykquery_json){
    if(adapter == "inbrowser"){
      var adapter = new PykQuery.adapter.inbrowser.init(pykquery_json);
    }
    else{
      var adapter = new PykQuery.adapter.rumi.init(pykquery_json);
    }
    var response = adapter.call();
    //TODO to delete instance of adapter adapter.delete();
    return response;
  }
  
  // getConfig is use generate whole query and return data
  this.getConfig = function() {
    var filter_obj = {};
    var querydata;
    var arr = Object.getOwnPropertyNames(this);
    for (var i in arr) {
      if (this.propertyIsEnumerable(arr[i]) == false) {
        filter_obj[arr[i]] = this[arr[i]];
        //console.log(arr);
      }
    }
    //filter_obj['filter'] = this.filters;
    // if(myadapter == "database") {
    //   querydata = databaseQuery(filter_obj);
    //   return querydata;
    // } else(myadapter == "browser"){
      // call to browser data;
    //}
    return filter_obj;
  };

  this.storeObjectInMemory = function(obj_name) {
    $("#"+div_id).attr("pyk_object", obj_name);
     
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

var findQueryByDivid = function(id) {
    var obj_name = $("#" + id).attr("pyk_object");
    if(obj_name == undefined){
        console.log("div not exit "+id);
    }
    return obj_name;
}
  
//   // filter data with underscore
// }

// PykQuery.browserdata = function(filterObj){
//     that = this;

//     $.getJSON( "test1data.json", function(dat) { 
//       that.data = dat;
//       console.log(that.data)
//       var mode = filterObj.mode;
//       // checking whether filter is exit in query or not 
//       // if(filterObj.filters.length > 0) { 
//       //   console.log('start filter');
//       //   startFilterData(filterObj); //call to start filter
//       // }
//       switch(mode) {
//           case "aggregation":
//           startAggration(filterObj);
//           break;
//           case "unique":
//           break;
//           case "datatype":
//           break;
//           defaultkey: "value", 
//           console.log('wrong condition type');
//         }
//     });

//     var startAggration = function(filterObj){
//       var temp_data = data;
//       var matrics = filterObj.matrics;
//       temp_data = _.groupBy(data,filterObj.dimensions[0]);
//        _.map(temp_data,function(obj){

//          return console.log(obj)
//       // })
//       console.log(temp_data)

//     }

//     var startFilterData = function(filterObj) {
//       var temp_obj =  filterObj.filters;
//       console.log(filterObj.select,temp_obj);
//       for(var i=0;i<temp_obj.length;i++) {
//         //var obj = {columnname:['count']}
//         //checking which type of filter exit 
//         switch(temp_obj[i]["condition_type"]) {
//           case "values":
//           valueFilter(temp_obj[i],filterObj.select)
//           console.log('---- value code')
//           break;
//           case "range":
//           rangeFilter(temp_obj[i],filterObj.select);
//           console.log('---- range code');
//           break;
//           case "datatype":
//           break;
//           default:
//           console.log('wrong condition type');
//         }
//       }

//     }

//     var valueFilter = function(obj_name,columns) {
//       console.log(obj_name,columns);
//       var _in = obj_name['in'],
//           not_in = obj_name['not_in'],
//           column_name = obj_name['column_name'],
//           temp_data, col;
//       console.log(not_in,_in,column_name);
//       temp_data = _.filter(data ,function(obj){
//                     if(not_in.indexOf(obj[column_name]) < 0){
//                       return obj;
//                     }
//                   });
//       temp_data = _.filter(temp_data ,function(obj){
//                     if(_in.indexOf(obj[column_name]) > -1){
//                       return obj;
//                     } 
//                   });
//       if(columns.length != 0){
//         temp_data = _.map(temp_data ,function(obj){ 
//                       return _.pick(obj,columns);
//                     });
//       }  

//       console.log(temp_data);
//     }
//     var rangeFilter = function(obj_name,columns){
//       var min = obj_name['condition']['min'],
//           max = obj_name['condition']['max'],
//           column_name = obj_name['column_name'],
//           temp_data, col;
//       console.log(min,max);
//       temp_data = _.filter(data ,function(obj){
//                     if(obj[column_name] <= max && obj[column_name] >=min){
//                       return obj;
//                     }
//                   });
//       //return perticular columns data 
//       if(columns.length != 0){
//         temp_data = _.map(temp_data ,function(obj){ 
//                       return _.pick(obj,columns);
//                     });
//       }
//       console.log(temp_data);
//     }
    
  }