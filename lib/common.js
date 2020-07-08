const forEachObject = (obj, fn) => {
  for(let key in obj) {
    fn(key, obj[key], obj)
  }
}

module.exports = {
  forEachObject
}