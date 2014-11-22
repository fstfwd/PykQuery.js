function filterDbQueryString(options) {
			
	var filter = options.filter,
			mode = options.mode,
			metrics = options.metrics,
			select_columns = options.select_columns,
			sort = options.sort,
			dimensions = options.dimensions,
			limit  = options.limit,
			offset = options.offset;

	var table_name = "test1data",
			columns = options.columns,
			required_columns = [];
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
		if (_.intersection(columns,dimensions).length !== 0) {
			required_columns = dimensions.slice();
		}
		else {
			return false; // dimension(s) not found
		}
	}
	else {
		dimensions = false;
	}

	if (select_columns && mode !== "aggregation") {
		if (_.intersection(columns,select_columns).length !== 0) {
			_.each(select_columns, function(d) {
				required_columns.push(d);
			});
		}
		else {
			return false; // column(s) not found
		}
	}

	if (metrics && mode === "aggregation") {
		for (key in metrics) {
			if (_.intersection(columns,[key]).length !== 0 && metrics[key].length !== 0) {
				var aggregation_column_name = "";
				_.each(metrics[key], function (d) {
					aggregation_column_name = d + "(" + key + ")";
					required_columns.push(aggregation_column_name);
				});
			}
		}
	}

	if (_.isEmpty(required_columns) == true && _.isEmpty(dimensions) == true) {
		query_select = "SELECT * ";
	}
	else {
		query_select = "SELECT " + required_columns.join(", ") + " ";
	}
	// END -- SELECT COLUMN NAMES clause


	// START -- WHERE clause
	if (filter) {
		query_where = "WHERE ";
		next_op = false;			
		_.each(filter, function (d) {
			if (next_op) {
				query_where += next_op + " ";
			}
			// query_where += d["column_name"] + " ";
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
	if (sort) {
		query_order_by = "ORDER BY ";
		for (key in sort) {
			query_order_by += key + " " + sort[key] + ", ";
		}
		query_order_by = query_order_by.slice(0,-2) + " ";
	}
	else {
		query_order_by = "ORDER BY " + dimensions[0] + " ";
	}
	// END -- ORDER clause


	// Limit & offset to be added to the query
	query_limit = (limit) ? ("LIMIT " + limit + " ") : query_limit;
	query_offset = (offset) ? ("OFFSET " + offset + " ") : query_limit;

	// FINAL DB QUERY STRING
	query_string[0] = query_select + query_from + query_where + query_group_by + query_order_by + query_limit + query_offset;
	query_string[1] = query_select + "<br/>"
								+ query_from + "<br/>"
								+ query_where + "<br/>"
								+ query_group_by + "<br/>"
								+ query_order_by + "<br/>"
								+ query_limit + "<br/>"
								+ query_offset;
	// console.log(query_string[0],"***");
	
	return query_string;
};