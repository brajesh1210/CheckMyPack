import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { runPipeline, type PipelineProgress, type ScanOutcome } from '../lib/pipeline'
import { makeSampleBlob } from './samples'
import { useApp, toStored } from '../store/app'

interface RunState {
  status: 'idle' | 'running' | 'done' | 'error'
  progress: PipelineProgress | null
  outcome: ScanOutcome | null
  error: string | null
}

interface Ctx extends RunState {
  startFromBlob: (b: Blob) => void
  startFromVideo: (v: HTMLVideoElement) => void
  startSample: (id: string) => void
  reset: () => void
}

const ScanCtx = createContext<Ctx | null>(null)

export function ScanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RunState>({ status: 'idle', progress: null, outcome: null, error: null })
  const addScan = useApp((s) => s.addScan)
  const runId = useRef(0)

  const execute = useCallback(
    async (getSource: () => Promise<Blob | HTMLVideoElement>) => {
      const my = ++runId.current
      setState({ status: 'running', progress: { stage: 'compress' }, outcome: null, error: null })
      try {
        const source = await getSource()
        const outcome = await runPipeline(
          source,
          (p) => {
            if (runId.current === my) setState((s) => ({ ...s, progress: p }))
          },
          { online: navigator.onLine },
        )
        if (runId.current !== my) return
        addScan(toStored(outcome))
        setState({ status: 'done', progress: { stage: 'done' }, outcome, error: null })
      } catch (e) {
        if (runId.current !== my) return
        setState({
          status: 'error',
          progress: null,
          outcome: null,
          error: e instanceof Error ? e.message : 'The scan could not be completed.',
        })
      }
    },
    [addScan],
  )

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      startFromBlob: (b) => void execute(async () => b),
      // The video element is captured synchronously inside compress().
      startFromVideo: (v) => void execute(async () => v),
      startSample: (id) => void execute(async () => makeSampleBlob(id)),
      reset: () => setState({ status: 'idle', progress: null, outcome: null, error: null }),
    }),
    [state, execute],
  )

  return <ScanCtx.Provider value={value}>{children}</ScanCtx.Provider>
}

export function useScanRun() {
  const ctx = useContext(ScanCtx)
  if (!ctx) throw new Error('useScanRun must be used inside <ScanProvider>')
  return ctx
}
