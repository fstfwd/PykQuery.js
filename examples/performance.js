function dataTable(data,dimension,metric,alias,id) {
	var len = data.length;
		metrics = _.keys(metric);
		dimensions = dimension[0];
		aliases = _.keys(alias);
		rows = "<table class='PykCensus-table'><tr><th class='PykCensus-header'>" + aliases[0] +"</th><th class='PykCensus-header'>" + aliases[1] + "</th></tr>";

	for (var i=0; i<len; i++) {
		var val = _.values(data[i]);
			key = _.keys(data[0]);
		// console.log(key,val,"table");
		if (val[0] !== "") {
			rows += "<tr><td class='PykCensus-rows' data-id='"+val[0]+"''>" + val[0] + "</td><td class='PykCensus-rows'>" + val[1] + "</td></tr>"; 
		}		
	}
	rows += "</table>";
    $(id).html(rows);
}
