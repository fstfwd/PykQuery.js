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

this.returnsWhereClause = function (d) {
	var query_where = "";

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
      break;

    case "range":
    	if (_.isEmpty(d["condition"]) == false) {
    		query_where += d["column_name"] + " ";
        if (d["condition"]["not"]) {
          query_where += "NOT ";
        }
        query_where += "BETWEEN " + d["condition"]["min"] + " AND " + d["condition"]["max"] + " ";
    	}          
      break;

    case "data_types":
      // yet to be coded
      break;
  }

  return query_where;
};