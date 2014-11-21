PykQuery.adapter.inbrowser = {}

PykQuery.adapter.inbrowser.init = function(pykquery){
    global_divid_for_raw_data = window[pykquery.global_divid_for_raw_data]
    raw_data = global_divid_for_raw_data.rawdata;
    console.log(raw_data,global_divid_for_raw_data);
    
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