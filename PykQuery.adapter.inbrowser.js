PykQuery.adapter.inbrowser = {}

PykQuery.adapter.inbrowser.init = function(pykquery){
    global_divid_for_raw_data = window[pykquery.global_divid_for_raw_data]
    raw_data = global_divid_for_raw_data.rawdata;
    
}