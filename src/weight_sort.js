// weight_sort(arr, [weight_key])
// Parameters:
// arr ... an array of form [ [ weight, var], ... ]
//         [ [ -3, A ], [ -1, B ], [ 5, C ], [ -1, D ] ]
//         OR
//         an array of form [ { 'weight': value, other key/values } ]
//         [ { 'weight': -3, k: A ], { 'weight': -1, v: B }, [ 5, C ] ]
//         OR
//         an object of form { 'index': {'weight': value, other key/values }, ... }
//         (please note that numerical indexes won't work)
//
// weight_key ... name of the key which holds each element's weight (default:
//                'weight')
//
//  as the last item shows, you can even mix the forms
//
// Returns:
// if the first form is used, only the 'var' will be returned; with the
// second form the elements are untouched, only their position changed.
//
// Notes:
// Entries in the source array with the same weight are returned in the
// same order
// * weight might be a function closure
function weight_sort(arr, weight_key) {
  function numerical_cmp(a, b) {
    if(a == b)
      return 0;
    return parseFloat(a) < parseFloat(b) ? -1 : 1;
  }

  var ret1={};
  if(!weight_key)
    weight_key = 'weight';

  // check if input array is an object, convert to array
  var is_object = false;
  if(typeof arr.length == 'undefined') {
    var new_arr = [];
    var is_object = true;
    for(var i in arr) {
      arr[i].__weight_sort_index = i;
      new_arr.push(arr[i]);
    }

    arr = new_arr;
  }

  // first put all elements into an assoc. array
  for(var i=0; i<arr.length; i++) {
    var cur=arr[i];
    var wgt;
    var data;

    if(cur.length) {
      wgt = cur[0];
      data = cur[1];
    }
    else {
      wgt = cur[weight_key];
      data = cur;
    }

    if(typeof wgt == "function")
      wgt = wgt();

    if(!wgt)
      wgt=0;

    if(!ret1[wgt])
      ret1[wgt]=[];

    ret1[wgt].push(data);
  }

  // get the keys, convert to value, order them
  var keys1=[];
  for(var k in ret1)
    keys1.push(k);
  keys1.sort(numerical_cmp);
  var ret2=[];

  // iterate through array and compile final return value
  for(var i=0; i<keys1.length; i++) {
    for(var j=0; j<ret1[keys1[i]].length; j++) {
      ret2.push(ret1[keys1[i]][j]);
    }
  }

  // rebuild object if necessary
  if(is_object) {
    var new_arr = {};
    for(var i = 0; i < ret2.length; i++) {
      var ob = ret2[i];

      var index = ob.__weight_sort_index;
      delete(ob.__weight_sort_index);

      new_arr[index] = ob;
    }

    ret2 = new_arr;
  }

  return ret2;
}

if(typeof module != 'undefined' && module.exports)
  module.exports = weight_sort
