import { useRef, useState, useCallback } from 'react'

const BEEP_FREQ = 880
const BEEP_DURATION_S = 0.18
const BEEP_INTERVAL_S = 0.35
const BEEP_BURST_COUNT = 3
const BURST_REPEAT_MS = 2200

export function useAlarmSound() {
  const ctxRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const scheduleBeepBurst = useCallback((ctx: AudioContext) => {
    let t = ctx.currentTime
    for (let i = 0; i < BEEP_BURST_COUNT; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = BEEP_FREQ
      gain.gain.setValueAtTime(0.3, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + BEEP_DURATION_S)
      osc.start(t)
      osc.stop(t + BEEP_DURATION_S)
      t += BEEP_INTERVAL_S
    }
  }, [])

  const startAlarm = useCallback(() => {
    if (ctxRef.current) return
    const ctx = new AudioContext()
    ctxRef.current = ctx
    scheduleBeepBurst(ctx)
    intervalRef.current = setInterval(() => scheduleBeepBurst(ctx), BURST_REPEAT_MS)
    setIsPlaying(true)
  }, [scheduleBeepBurst])

  const stopAlarm = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    void ctxRef.current?.close()
    ctxRef.current = null
    setIsPlaying(false)
  }, [])

  return { startAlarm, stopAlarm, isPlaying }
}
