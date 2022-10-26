module.exports = function arrayToCoords (list) {
  return list.reduce(
    (arr, current, i) => {
      if (i % 2 === 0) {
        arr.push([null, current])
      } else {
        arr[arr.length - 1][0] = current
      }
      return arr
    },
    []
  )
}
