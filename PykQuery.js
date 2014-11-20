var PykQuery = {}

PykQuery.init = function(mode, _scope, divid ) {

  that = this;
  var div_id;
  var available_mode = ["aggregation", "unique", "select", "datatype"];
  var available_scope = ["local", "global"];

  if (available_mode.indexOf(mode) > -1 && available_scope.indexOf(_scope) > -1 && divid != undefined) {
    mode = mode;
    _scope = _scope;
    div_id = divid;
  } else {
    //Later - the error code should mention which particular data point is wrong
    console.error("error in cofiguration");
    return false;
  }

  var addfilter = [],
      dimensions = [],
      metrics = {},
      cols = [],
      sort = {},
      limit = 2000,
      impacted_by =[],
      impacts =[],
      offset = 0;

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

  //Used internally but not accessible to the user

  Object.defineProperty(this, '__impacted_by', {
    get: function() {
      return impacted_by;
    },
    set: function(value) { 
       impacted_by.push(value)
    }
  });

  Object.defineProperty(this, 'sort', {
    get: function() {
      return sort
    },
    set: function(name) { //"[{"col1": "asc"}, ]"
      for (var prop in name) {
        if(prop == undefined){
          console.error("Column name is undefined in sort.")
          return;
        }
        if (name[prop] == undefined || (name[prop] != "asc" && name[prop] != "desc")) {
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
      }
    });
    var obj = {
      add: function(name) {
        if (filterValidation(name)) {
          addFilterInQuery(name)
          addFilterPropagate(name)
        }
      },
      remove: function(column_name, condition_type, params) {
        editFilter(column_name, condition_type, params, false);
      },
    };
    return obj;
  }

  // --------- Generic Functions on Array
  
  // Util function - concat 2 arrays and return uniq
  var concat_and_uniq = function(a1, a2){
    a1 = a1.concat(a2)
      .filter(function(item, i, ar) {
        return ar.indexOf(item) === i;
    });
    return a1;
  }

  var is_exactly_same = function(a1, a2) {
    var is_same2 = (a1.length == a2.length) && a1.every(function(element, index) {
      return element === a2[index];
    });
    return is_same2;
  }

  var subtract_array = function(a1, a2){
    if(a2 != undefined){
      for(var i =0;i<a2.length;i++){
        var index = a1.indexOf(a2[i]);
        if(index >-1 ) {
          a1.splice(index,1);
        }
      }
    }
    return a1;
  }

  //--------------

  var addFilterInQuery = function(new_filter) {
    var is_new_filter = true;
    for (var i = 0; i < addfilter.length; i++) {
      var old_filter = addfilter[i];
      if (old_filter['column_name'] == new_filter['column_name'] && old_filter['condition_type'] == new_filter['condition_type']){
        //INPUT - old_filter, new_filter
        //INPUT - IN(A, B), IN(A, C)
        //OUTPUT -- IN (A, B, C)
        if (old_filter['condition_type'] == "values") {
          var is_same1 = is_exactly_same(new_filter['in'], old_filter['in']);
          var is_same2 = is_exactly_same(new_filter['not_in'], old_filter['not_in']);
          if (is_same2 == true && is_same1 == true) {
            console.warn('Clean up your JS: Same filter cannot add');
            return false;
          }
          else {
            old_filter['in'] = concat_and_uniq(old_filter['in'], new_filter['in']);
            old_filter['not_in'] = concat_and_uniq(old_filter['not_in'], new_filter['not_in']);
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
        global_filter.addFilterInQuery(new_filter)
      }
    }
  }

  var editFilter = function(column_name, condition_type, params, is_propagated_change) {
    var len = addfilter.length;
    for (var x = 0; x < len; x++) {
      if (addfilter[x]['column_name'] == column_name && addfilter[x]['condition_type'] == condition_type) {
        if (condition_type == "values") {
          addfilter[x]['in'] = subtract_array(addfilter[x]['in'], params['in']);
          addfilter[x]['not_in'] = subtract_array(addfilter[x]['not_in'], params['not_in']); 
        } 
        else if (condition_type == "range") {
          var __min = params['min'];
          var __max = params['max'];
          if(__min != undefined && __max != undefined)
            if(__min == addfilter[x]['condition']['min'] && __max == addfilter[x]['condition']['max']) {
              addfilter.splice(x,1);
            }
        }
        if(_scope == "local") {
            for(var j =0;j<impacts.length;j++) {
              var obj = impacts[j];
              var temp_obj = window[obj];
              temp_obj.editFilter(column_name, condition_type, params);
            }
          }
          if(_scope == "global") {
            for(var j =0;j<impacted_by.length;j++) {
              var obj = impacted_by[j];
              var temp_obj = window[obj];
              temp_obj.editFilter(column_name, condition_type, params);
            }
          }

      }    
    }
  }

  //structure of global {id:divid,impact:true,impact:false}
   this.addGlobal = function(global) {
     var temp_global = global;
     var mydiv_id = findQueryByDivid(div_id);
     console.log(temp_global)
     if (temp_global['id'] != undefined && (temp_global['impacted_by'] == true || temp_global['impacts'] == true)) {
       if (_scope == "local") {
         var id = findQueryByDivid(temp_global['id']);
         if (id != undefined) {
           if (temp_global['impacts'] == true) {
             impacts.push(id);
             console.log('added to impacts');
           }
           if (temp_global["impacted_by"] == true) {
             window[id].__impacted_by = mydiv_id;
             console.log("added to impacted_by");
           }
         }
         else {
           console.error("div-id not exit");
         }
       }
       else {
         console.warn("you cant enter global filter to global query");
       }
     }
     else {
       console.error("error in " + temp_global['id']);
     }
   }

    //code for validation before adding filter
    var filterValidation = function(name) { 
      var filter1 = [{
          "column_name": "tablename.col1",
          "condition_type": "range",
          "condition": {
            "min": 10,
            "max": 100,
            "not": false
          },
          "next": "AND"
        }, {
          "column_name": true,
          "condition_type": true,
          "in": true,
          "not_in": true,
          "next": true,
        }, {
          "column_name": "col1",
          "condition_type": "data_types",
          "IN": ["integer", "float"],
          "NOT IN": ["blank"],
          "next": "OR",
        }]
        
      if (Object.keys(name).length == 0) {
        console.log("empty object not allowed")
        return false;
      }
      if (name["condition_type"] == "range") {
        for (prop in filter1[0]) {
          if (name["next"] == undefined) {
            name["next"] = "OR";
          }
          if (name[prop] == undefined) {
            console.log("not define ", prop);
            if (name[prop] == "condition") {
              var con = name[prop];
              if (con["min"] == undefined && con["max"] == undefined)
                return false;
            }
            return false;
          }
        }
        return true;
      } else if (name["condition_type"] == "values") {
          var temp_obj = filter1[1];
          if (name["not_in"] == undefined && name['in'] == undefined) {
            console.log("in and not_in are not define");
            return false;
          } else {
             if(name["not_in"] == undefined ) name["not_in"]=[];
             if(name['in'] == undefined) name["in"] =[];
          }
          if (name['column_name'] == undefined) {
            console.log("column_name is not define ");
            return false;
          }
          if (name["not_in"].length == 0 && name['in'].length == 0) {
            console.log("in and not_in both cant be empty");
            return false;
          }
          if (name["next"] == undefined) {
            name["next"] = "OR";
          }
          return true;
      } else {
        console.log("condition_type is not defined");
        return false;
      }

    }

    var metricsValidation = function(name) {
      var data = ['min', 'max', 'avg', 'sum', 'median', 'count'];
      
      if (Object.keys(name).length == 0) {
        console.log("empty object not allowed")
        return false;
      }
      for (prop in name) {
        var temp_arr = name[prop];
        if (name[prop] == undefined || temp_arr.length == 0) {
          console.log("not define ", prop);
          return false;
        }
        for (var i = 0; i < temp_arr.length; i++) {
          if (data.indexOf(temp_arr[i]) <= -1) {
            console.log("matrix is not available");
            return false;
          }
        }
      }
      return true;
    }
  

  // getConfig is use generate whole query and return data
  this.getConfig = function() {
    var filter_obj = {};
    var querydata;
    var arr = Object.getOwnPropertyNames(this);
    for (var i in arr) {
      if (this.propertyIsEnumerable(arr[i]) == false) {
        filter_obj[arr[i]] = this[arr[i]];
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

//   var findQueryByDivid = function(id) {
//     var obj_name = $("#" + id).attr("pyk_object");
//     if(obj_name == undefined)
//      console.log("div not exit "+id);
//     return obj_name;
//   }
  
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