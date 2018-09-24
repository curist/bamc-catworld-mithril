export const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
export const defer = async task => (await delay(0), task())

export const padLeft = (s='', len=0, pad=' ') => {
  const sLen = s.length
  if(sLen > len) {
    return s
  }
  return Array.from({length: len - sLen}).fill(pad).join('') + s
}

export const formatDate = date => {
  const h = padLeft('' + date.getHours(), 2, '0')
  const m = padLeft('' + date.getMinutes(), 2, '0')
  const s = padLeft('' + date.getSeconds(), 2, '0')
  return `${h}:${m}:${s}`
}

export const sum = arr => arr.reduce((total, n) => total + (n || 0), 0)
