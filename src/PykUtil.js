PykUtil = {}

PykUtil.init = function() {

    this.pushToArray = function(a1, o1){
        if( a1.length == 0 ){
            a1 = [o1]
        }
        else{
            a1.push(o1);
        }
        return a1
    }

    //TODO - Change all _ ruby like names to CamelCase for all PykUtil Functions
    this.concat_and_uniq = function(a1, a2) {
        if (a1 != undefined && a2 != undefined){
            a1 = a1.concat(a2)
                .filter(function(item, i, ar) {
                    return ar.indexOf(item) === i;
            });
        }
        return a1;
    }

    this.is_exactly_same = function(a1, a2) {
        if (a1 != undefined && a2 != undefined){
            var is_same2 = (a1.length == a2.length) && a1.every(function(element, index) {
                return element === a2[index];
            });
            return is_same2;
        }
        else{
            return true;
        }
    }

    this.subtract_array = function(a1, a2) {
        if (a1 != undefined && a2 != undefined){
            for (var i = 0; i < a2.length; i++) {
                var index = a1.indexOf(a2[i]);
                if (index > -1) {
                    a1.splice(index, 1);
                }
                if (a1.length===0) {
                  a1 = undefined;
                }
            }
        }
        return a1;
    }

    this.isBlank = function(a) {
        return (a == undefined || a == "") ? true : false
    }
}
