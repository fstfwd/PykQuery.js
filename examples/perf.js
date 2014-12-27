$(document).ready(function () {

            table1 = new PykQuery.init("aggregation", "local", "table1", "inbrowser"); 
            table1.dimensions = ["drinkingwatersource"];
            table1.metrics = {"drinkingwatersource_population":["sum"]};
            table1.alias = {
                "Drinking Water Source" : "name",
                "Population" : "weight"
            };

            table2 = new PykQuery.init("aggregation", "local", "table2", "inbrowser"); 
            table2.dimensions = ["area"];
            table2.metrics = {"household_population":["sum"]};
            table2.alias = {
                "area": "name",
                "household_population": "weight"
            };

            d3.csv("data/performace_test.csv", function (data) {
                console.log(data.length)
                window.g1 = new PykQuery.init("global", "global", "g1", "inbrowser");
                g1.rawdata = data;
                g1.addImpacts(["table1","table2"],true);
                g1.listFilters("list_of_filters");
                $("#reset").click (function () {
                    g1.resetFilters();
                });

            table1.call();
            table2.call();

            table1.executeOnFilter = function() {
                var d = table1.flushToGet();
                // console.log("table1")
                dataTable(d,table1.dimensions,table1.metrics,table1.alias,"#table1");
                $("#table1 td").click(function(){
                var value = $(this).html();
                    id = $(this).attr("data-id");
                // console.log("hey", value,id)
                table1.addFilter({"column_name": "drinkingwatersource", "condition_type": "values", "in": [value],"next": "OR", "selected_dom_id" : id}, true);
                
                });
            }

            table2.executeOnFilter = function() {
                var d = table2.flushToGet();
                dataTable(d,table2.dimensions,table2.metrics,table2.alias,"#table2");
                $("#table2 td").click(function(){
                var value = $(this).html();
                    id = $(this).attr("data-id");
                table2.addFilter({"column_name": "area", "condition_type": "values", "in": [value],"next": "OR", "selected_dom_id" : id}, true);
                
                });
            }

            var data1 = table1.flushToGet();
                data2 = table2.flushToGet();

            dataTable(data1,table1.dimensions,table1.metrics,table1.alias,"#table1");
            dataTable(data2,table2.dimensions,table2.metrics,table2.alias,"#table2");
            // console.log(d3.select("#table1 table"))

            $("#table1 td").click(function(){
                var date = new Date();
                    var i,avg =0;
                    var a = [];
                    for(i = 0;i<100;i++) {
                        // console.log(i);
                        var start = new Date().getTime();
                        var value = $(this).html();
                            id = $(this).attr("data-id");
                        table1.addFilter({"column_name": "drinkingwatersource", "condition_type": "values", "in": [value],"next": "OR", "selected_dom_id" : id}, true);
                        var end = new Date().getTime();
                        // if (i%2 === 0) {
                            a[i] = end - start;
                            avg += a[i] 
                        // }                       
                    }
                console.log("Performance",a,avg/100);

            });

            $("#table2 td").click(function(){
                var value = $(this).html();
                    id = $(this).attr("data-id");
                table2.addFilter({"column_name": "area", "condition_type": "values", "in": [value],"next": "OR", "selected_dom_id" : id}, true);
                
            });


        });
    });