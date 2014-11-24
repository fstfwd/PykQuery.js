
var filterList = function(div_element,filters){ // filters parameter should be removed while integrating with pykquery
	var where_clause = filters; // this line will be remove because were_clause is local in pykquery
  $('#'+div_element).empty();
  $('#'+div_element).append("<div class='filter_list'></div>");
  showFilterList(where_clause,div_element);
  $( ".filter_remove").unbind( "click" );
  $(document).on('click','.filter_remove',function(){
    var index  = $(this).attr("id").split("filter_remove_");
    console.log($(this).attr("id"));
    //var data 

    removeFilterFromList(index[1],where_clause,div_element);
  });
}
var showFilterList = function(filters) {
  var where_clause = filters,// this line will be remove because were_clause is local in pykquery
    len = where_clause.length,
    filter_values = "values in filter";
  $('.filter_list').empty();
  console.log('------',len)
  for(var i =0 ;i< len;i++){
    console.log(i,"----")
    //$('.filter_block').empty();
    $('.filter_list').append("<div class='filter_block' id ='filter_block"+i+"'></div>");
    $('#filter_block'+i).append("<div class ='filter_value"+i+"'>"+filter_values+"</div>");
    $('#filter_block'+i).append("<div id ='filter_remove_"+i+"'class ='filter_remove'>remove</div>");
    //return false;
  }
}
var removeFilterFromList = function(index,where_clause){ // remove where_clause from parameter
  where_clause.splice(index,1);
  showFilterList(where_clause);//remove where_clause
}