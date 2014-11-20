PykUtil = {}

PykUtil.init = function(){

//TODO - Change all _ ruby like names to CamelCase for all PykUtil Functions
this.concat_and_uniq = function(a1, a2){
  a1 = a1.concat(a2)
    .filter(function(item, i, ar) {
      return ar.indexOf(item) === i;
  });
 return a1;
}

  this.is_exactly_same = function(a1, a2) {
  	console.log(a1,a2)
    var is_same2 = (a1.length == a2.length) && a1.every(function(element, index) {
      return element === a2[index];
    });
    return is_same2;
  }

  this.subtract_array = function(a1, a2){
    if(a2 != undefined){
      for(var i =0;i<a2.length;i++){
        var index = a1.indexOf(a2[i]);
        if(index >-1 ) {
          a1.splice(index,1);
        }
      }
    }
    return a1;
  }

  this.isBlank = function(a){
    (a == undefined || a == "") ? true : false
  }
  console.log("finish")
}

