export function rand (min, max) {
  return min + Math.random() * (max - min)
}

export function asyncTimeout (cb, timeout = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      cb()
      resolve()
    }, timeout)
  })
}

//
