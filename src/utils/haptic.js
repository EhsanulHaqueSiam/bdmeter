export function haptic(style = 'light') {
  if (!navigator.vibrate) return
  if (style === 'light') navigator.vibrate(10)
  else if (style === 'medium') navigator.vibrate(20)
  else navigator.vibrate([10, 50, 10])
}
