PykUtil = {}

PykUtil.init = function() {

    this.pushToArray = function(a1, o1){
        a1 = !a.length ? [o1] : (a.push(o1));
        return a1;
    }

    //TODO - Change all _ ruby like names to CamelCase for all PykUtil Functions
    this.concatAndUniq = function(a1, a2) {
        if (a1 != undefined && a2 != undefined){
            a1 = a1.concat(a2)
                .filter(function(item, i, ar) {
                    return ar.indexOf(item) === i;
            });
        }
        return a1;
    }

    this.isExactlySame = function(a1, a2) {
      if (a1 && a2){
        var is_same2 = (a1.length === a2.length) && a1.every(function(element, index) {
          return _.isEqual(element,a2[index]);
        });
        return is_same2;
      }
      else{
        return false;
      }
    }

    this.subtractArray = function(a1, a2) {
        if (a1 && a2){
          if (a1.length === 0) {
            a1 = undefined;
            return a1;
          }
          var a2_length = a2.length;
            for (var i = 0; i < a2_length; i++) {
                var index = a1.indexOf(a2[i]);
                if (index > -1) {
                    a1.splice(index, 1);
                }
                if (a1.length === 0) {
                  a1 = undefined;
                  return a1;
                }
            }
        }
        return a1;
    }

    this.subtractObjectAttribute = function (a1, a2) {
      if (a1 && a2) {
        if (Object.keys(a1).length === 0) {
          a1 = undefined;
          return a1;
        }
        var a2_length = a2.length;
        for (var i = 0; i < a2_length; i++) {
          if (a1[a2[i]]) {
            delete a1[a2[i]];
          }
          if (Object.keys(a1).length === 0) {
            a1 = undefined;
            return a1;
          }
        }
      }
      return a1;
    }

    this.isBlank = function(a) {
        return !a ? true : false
    }
}
