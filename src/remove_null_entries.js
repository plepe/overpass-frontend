function remove_null_entries(arr) {
  var p;
  while((p = arr.indexOf(null)) != -1)
    arr.splice(p, 1)

  return arr
}

module.exports = remove_null_entries
