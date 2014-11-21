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
			columns = ["street","city","zip","state","beds","baths","sq__ft","type","sale_date","price","latitude","longitude"],
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

	raw_data = '[{"street":"3526 HIGH ST","city":"SACRAMENTO","zip":95838,"state":"CA","beds":2,"baths":1,"sq__ft":836,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":59222,"latitude":38.631913,"longitude":-121.434879},{"street":"51 OMAHA CT","city":"SACRAMENTO","zip":95823,"state":"CA","beds":3,"baths":1,"sq__ft":1167,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":68212,"latitude":38.478902,"longitude":-121.431028},{"street":"2796 BRANCH ST","city":"SACRAMENTO","zip":95815,"state":"CA","beds":2,"baths":1,"sq__ft":796,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":68880,"latitude":38.618305,"longitude":-121.443839},{"street":"2805 JANETTE WAY","city":"SACRAMENTO","zip":95815,"state":"CA","beds":2,"baths":1,"sq__ft":852,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":69307,"latitude":38.616835,"longitude":-121.439146},{"street":"6001 MCMAHON DR","city":"SACRAMENTO","zip":95824,"state":"CA","beds":2,"baths":1,"sq__ft":797,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":81900,"latitude":38.51947,"longitude":-121.435768},{"street":"5828 PEPPERMILL CT","city":"SACRAMENTO","zip":95841,"state":"CA","beds":3,"baths":1,"sq__ft":1122,"type":"Condo","sale_date":"Wed May 21 00:00:00 EDT 2008","price":89921,"latitude":38.662595,"longitude":-121.327813},{"street":"6048 OGDEN NASH WAY","city":"SACRAMENTO","zip":95842,"state":"CA","beds":3,"baths":2,"sq__ft":1104,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":90895,"latitude":38.681659,"longitude":-121.351705},{"street":"2561 19TH AVE","city":"SACRAMENTO","zip":95820,"state":"CA","beds":3,"baths":1,"sq__ft":1177,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":91002,"latitude":38.535092,"longitude":-121.481367},{"street":"11150 TRINITY RIVER DR Unit 114","city":"RANCHO CORDOVA","zip":95670,"state":"CA","beds":2,"baths":2,"sq__ft":941,"type":"Condo","sale_date":"Wed May 21 00:00:00 EDT 2008","price":94905,"latitude":38.621188,"longitude":-121.270555},{"street":"7325 10TH ST","city":"RIO LINDA","zip":95673,"state":"CA","beds":3,"baths":2,"sq__ft":1146,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":98937,"latitude":38.700909,"longitude":-121.442979},{"street":"645 MORRISON AVE","city":"SACRAMENTO","zip":95838,"state":"CA","beds":3,"baths":2,"sq__ft":909,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":100309,"latitude":38.637663,"longitude":-121.45152},{"street":"4085 FAWN CIR","city":"SACRAMENTO","zip":95823,"state":"CA","beds":3,"baths":2,"sq__ft":1289,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":106250,"latitude":38.470746,"longitude":-121.458918},{"street":"2930 LA ROSA RD","city":"SACRAMENTO","zip":95815,"state":"CA","beds":1,"baths":1,"sq__ft":871,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":106852,"latitude":38.618698,"longitude":-121.435833},{"street":"2113 KIRK WAY","city":"SACRAMENTO","zip":95822,"state":"CA","beds":3,"baths":1,"sq__ft":1020,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":107502,"latitude":38.482215,"longitude":-121.492603},{"street":"4533 LOCH HAVEN WAY","city":"SACRAMENTO","zip":95842,"state":"CA","beds":2,"baths":2,"sq__ft":1022,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":108750,"latitude":38.672914,"longitude":-121.35934},{"street":"7340 HAMDEN PL","city":"SACRAMENTO","zip":95842,"state":"CA","beds":2,"baths":2,"sq__ft":1134,"type":"Condo","sale_date":"Wed May 21 00:00:00 EDT 2008","price":110700,"latitude":38.700051,"longitude":-121.351278},{"street":"6715 6TH ST","city":"RIO LINDA","zip":95673,"state":"CA","beds":2,"baths":1,"sq__ft":844,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":113263,"latitude":38.689591,"longitude":-121.452239},{"street":"6236 LONGFORD DR Unit 1","city":"CITRUS HEIGHTS","zip":95621,"state":"CA","beds":2,"baths":1,"sq__ft":795,"type":"Condo","sale_date":"Wed May 21 00:00:00 EDT 2008","price":116250,"latitude":38.679776,"longitude":-121.314089},{"street":"250 PERALTA AVE","city":"SACRAMENTO","zip":95833,"state":"CA","beds":2,"baths":1,"sq__ft":588,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":120000,"latitude":38.612099,"longitude":-121.469095},{"street":"113 LEEWILL AVE","city":"RIO LINDA","zip":95673,"state":"CA","beds":3,"baths":2,"sq__ft":1356,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":121630,"latitude":38.689999,"longitude":-121.46322},{"street":"6118 STONEHAND AVE","city":"CITRUS HEIGHTS","zip":95621,"state":"CA","beds":3,"baths":2,"sq__ft":1118,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":122000,"latitude":38.707851,"longitude":-121.320707},{"street":"4882 BANDALIN WAY","city":"SACRAMENTO","zip":95823,"state":"CA","beds":4,"baths":2,"sq__ft":1329,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":122682,"latitude":38.468173,"longitude":-121.444071},{"street":"7511 OAKVALE CT","city":"NORTH HIGHLANDS","zip":95660,"state":"CA","beds":4,"baths":2,"sq__ft":1240,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":123000,"latitude":38.702792,"longitude":-121.38221},{"street":"9 PASTURE CT","city":"SACRAMENTO","zip":95834,"state":"CA","beds":3,"baths":2,"sq__ft":1601,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":124100,"latitude":38.628631,"longitude":-121.488097},{"street":"3729 BAINBRIDGE DR","city":"NORTH HIGHLANDS","zip":95660,"state":"CA","beds":3,"baths":2,"sq__ft":901,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":125000,"latitude":38.701499,"longitude":-121.37622},{"street":"3828 BLACKFOOT WAY","city":"ANTELOPE","zip":95843,"state":"CA","beds":3,"baths":2,"sq__ft":1088,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":126640,"latitude":38.70974,"longitude":-121.37377},{"street":"4108 NORTON WAY","city":"SACRAMENTO","zip":95820,"state":"CA","beds":3,"baths":1,"sq__ft":963,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":127281,"latitude":38.537526,"longitude":-121.478315},{"street":"1469 JANRICK AVE","city":"SACRAMENTO","zip":95832,"state":"CA","beds":3,"baths":2,"sq__ft":1119,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":129000,"latitude":38.476472,"longitude":-121.501711},{"street":"9861 CULP WAY","city":"SACRAMENTO","zip":95827,"state":"CA","beds":4,"baths":2,"sq__ft":1380,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":131200,"latitude":38.558423,"longitude":-121.327948},{"street":"7825 CREEK VALLEY CIR","city":"SACRAMENTO","zip":95828,"state":"CA","beds":3,"baths":2,"sq__ft":1248,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":132000,"latitude":38.472122,"longitude":-121.404199},{"street":"5201 LAGUNA OAKS DR Unit 140","city":"ELK GROVE","zip":95758,"state":"CA","beds":2,"baths":2,"sq__ft":1039,"type":"Condo","sale_date":"Wed May 21 00:00:00 EDT 2008","price":133000,"latitude":38.423251,"longitude":-121.444489},{"street":"6768 MEDORA DR","city":"NORTH HIGHLANDS","zip":95660,"state":"CA","beds":3,"baths":2,"sq__ft":1152,"type":"Residential","sale_date":"Wed May 21 00:00:00 EDT 2008","price":134555,"latitude":38.691161,"longitude":-121.37192}]';
	
	//START -- SELECT COLUMN NAMES clause
	if (dimensions) {
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

	if (select_columns) {
		if (_.intersection(columns,select_columns).length !== 0) {
			_.each(select_columns, function(d) {
				required_columns.push(d);
			});
		}
		else {
			return false; // column(s) not found
		}
	}

	if (metrics) {
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
			query_where += d["column_name"] + " ";
			switch (d["condition_type"]) {				
				case "values" :
					vals = [];
					if (d["in"] && d["in"].length !== 0) {
						is_IN = true;
						query_where += "IN (";
						_.each(d["in"], function (k) {
							query_where += k + ", ";
						});
						query_where = query_where.slice(0,-2) + ") ";
					}
					if (d["not_in"] && d["not_in"].length !== 0) {
						if (is_IN) {
							query_where += "AND NOT IN (";
						}
						else {
							query_where += "NOT IN (";
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
					if (d["condition"] && _.isEmpty(d["condition"]) === false) {
						query_where += "NOT " + d["condition"]["not"] + " ";
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
	if (dimensions) {
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
	// console.log(query_string,"***");
	
	return query_string;
};