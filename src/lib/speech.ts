/** Verdict read-out via the Web Speech API. */

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text: string, lang: 'en' | 'hi', onEnd?: () => void) {
  if (!speechSupported()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
  u.rate = 0.96
  u.pitch = 1
  const pick = window.speechSynthesis.getVoices().find((v) => v.lang === u.lang)
  if (pick) u.voice = pick
  u.onend = () => onEnd?.()
  u.onerror = () => onEnd?.()
  window.speechSynthesis.speak(u)
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel()
}

export function verdictScript(
  lang: 'en' | 'hi',
  o: { productName: string; verdict: string; grade: string; violationCount: number; expired: boolean },
) {
  if (lang === 'hi') {
    if (o.verdict === 'RETAKE') return 'तस्वीर साफ़ नहीं है। कृपया दोबारा फ़ोटो लें।'
    if (o.verdict === 'VIOLATION')
      return `${o.productName} में ${o.violationCount} नियम उल्लंघन मिले हैं। ग्रेड ${o.grade}।${o.expired ? ' यह उत्पाद एक्सपायर हो चुका है।' : ''}`
    return `${o.productName} सभी ज़रूरी घोषणाओं का पालन करता है। ग्रेड ${o.grade}।`
  }
  if (o.verdict === 'RETAKE') return 'The photo was not clear enough to read. Please take another one.'
  if (o.verdict === 'VIOLATION')
    return `${o.productName} has ${o.violationCount} violations. Grade ${o.grade}.${o.expired ? ' This product is expired.' : ''}`
  return `${o.productName} is compliant. All required declarations are present. Grade ${o.grade}.`
}
