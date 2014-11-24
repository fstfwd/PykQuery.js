var toSql = function(options) {
  that = options;

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
		  raw_data = [],
		  final_data = [];

  var query_string = [],
		  query_select = "",
		  query_from = "FROM "+table_name+" ",
		  query_where = "",
		  query_group_by = "",
		  query_order_by = "",
		  query_limit = "",
		  query_offset = "",
		  next_op,
		  vals,
		  is_IN = false;

  //START -- SELECT COLUMN NAMES clause
  if (dimensions && mode === "aggregation") {
    required_columns = _.flatten(dimensions);

    if (metrics) {
    	for(var i in metrics){
	      len = metrics[i].length;
	      for(var j = 0; j < len; j++){
	        required_columns.push(metrics[i][j] + "("+ i +")")
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

  if (_.isEmpty(required_columns) == true && _.isEmpty(dimensions) == true) {
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
    query_where = "WHERE ";
    next_op = false;
    
    _.each(filters, function (d) {      
      if (next_op) {
        query_where += next_op + " ";
      }

      switch (d["condition_type"]) {

        case "values" :
          vals = [];
          if (d["in"] && d["in"].length !== 0) {
            is_IN = true;
            query_where += d["column_name"] + " IN (";
            _.each(d["in"], function (k) {
              query_where += k + ", ";
            });
            query_where = query_where.slice(0,-2) + ") ";
          }
          if (d["not_in"] && d["not_in"].length !== 0) {
            if (is_IN) {
              query_where += "AND " + d["column_name"] + " NOT IN (";
            }
            else {
              query_where += d["column_name"] + " NOT IN (";
            }
            _.each(d["not_in"], function (a) {
              query_where += a + ", ";
            });
            query_where = query_where.slice(0,-2) + ") ";
          }
          if (d["next"]) {
            next_op = d["next"];
          }
          else {
            next_op = false;
          }
          break;

        case "range":
        	if (_.isEmpty(d["condition"]) == false) {
        		query_where += d["column_name"] + " ";
	          if (d["condition"]["not"]) {
	            query_where += "NOT ";
	          }
	          query_where += "BETWEEN " + d["condition"]["min"] + " AND " + d["condition"]["max"] + " ";
	          if (d["next"]) {
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
    query_group_by = "GROUP BY " + dimensions.join(", ") + " ";
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
  query_string = div_id + ": " + query_select + query_from + query_where + query_group_by + query_order_by + query_limit + query_offset;
  console.log(query_string," *****");

  return query_string;
};