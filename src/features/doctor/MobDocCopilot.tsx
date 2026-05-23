import { memo, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { toast } from 'sonner'
import { CopilotService, type CopilotState } from '@/services/copilot.service'
import { useAuthStore } from '@/store/authStore'

/**
 * Visit Co-Pilot — live AI assistant for the doctor during a telemedicine call.
 *
 * Flow:
 *   1. Doctor lands on /doctor/telemedicine/:sessionId/copilot — we start (or load) a
 *      co-pilot session keyed to the telemedicine session.
 *   2. Tap "Start listening" — the browser's Web Speech API streams interim transcripts
 *      back. Finalized phrases are pushed to the backend in chunks.
 *   3. Every CHUNK_FLUSH_MS the latest text is POSTed, then every BRIEF_REFRESH_MS we
 *      ask Claude to refresh the structured brief.
 *   4. "Save to note" calls /finalize, which writes a consultation note with the
 *      doctor-approved diagnosis / plan / prescriptions.
 *
 * Transcription runs entirely in the browser so we don't ship audio off-device.
 */

const CHUNK_FLUSH_MS  = 6000   // POST new transcript every 6s
const BRIEF_REFRESH_MS = 20000 // ask Claude for a refreshed brief every 20s

// Web Speech API isn't in TS lib yet — narrow type for what we use.
type SpeechRecognitionLike = {
  start(): void
  stop(): void
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string; isFinal?: boolean }>> }) => void) | null
  onerror: ((e: { error?: string }) => void) | null
  onend: (() => void) | null
}

function getRecognizer(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) return null
  const r = new Ctor()
  r.continuous = true
  r.interimResults = true
  r.lang = 'en-US'
  return r
}

export default memo(function MobDocCopilot() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<CopilotState | null>(null)
  const [loading, setLoading] = useState(true)
  const [listening, setListening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const [briefFailures, setBriefFailures] = useState(0)
  const [lastBriefAt, setLastBriefAt]     = useState<number | null>(null)

  // Pending transcript not yet POSTed.
  const pendingRef     = useRef<string>('')
  const recognizerRef  = useRef<SpeechRecognitionLike | null>(null)
  const flushTimerRef  = useRef<number | null>(null)
  const briefTimerRef  = useRef<number | null>(null)
  const copilotIdRef   = useRef<number | null>(null)

  // Editable note fields, seeded from the latest brief.
  const [diagnosis, setDiagnosis] = useState('')
  const [plan, setPlan]           = useState('')
  const [rx, setRx]               = useState('')
  const [followUp, setFollowUp]   = useState('')

  useEffect(() => {
    if (!sessionId) return
    CopilotService.start(Number(sessionId))
      .then((s) => { setState(s); copilotIdRef.current = s.id })
      .catch(() => toast.error('Could not start Co-Pilot'))
      .finally(() => setLoading(false))
  }, [sessionId])

  // Seed editable fields when a fresh brief arrives.
  useEffect(() => {
    if (!state?.brief) return
    if (!diagnosis && state.brief.soap?.assessment) setDiagnosis(state.brief.soap.assessment)
    if (!plan && state.brief.soap?.plan)           setPlan(state.brief.soap.plan)
    if (!rx && state.brief.rxDraft?.length)        setRx(state.brief.rxDraft.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.brief])

  const flushChunk = async () => {
    const id = copilotIdRef.current
    if (!id) return
    const text = pendingRef.current.trim()
    if (!text) return
    pendingRef.current = ''
    try {
      const next = await CopilotService.append(id, text)
      setState(next)
    } catch {
      // Re-queue so we don't lose words on transient failure.
      pendingRef.current = (text + ' ' + pendingRef.current).trim()
    }
  }

  const refreshBrief = async () => {
    const id = copilotIdRef.current
    if (!id) return
    try {
      const next = await CopilotService.refreshBrief(id)
      setState(next)
      setBriefFailures(0)
      setLastBriefAt(Date.now())
    } catch {
      // Don't toast on every tick — the auto-refresh runs every 20s. Surface a
      // visible "AI not responding" badge after 2 consecutive failures so the
      // doctor knows the brief on screen is stale.
      setBriefFailures((n) => {
        const next = n + 1
        if (next === 2) toast.warning('AI brief refresh is failing. The displayed brief may be stale.')
        return next
      })
    }
  }

  const handleToggleListen = () => {
    if (listening) {
      recognizerRef.current?.stop()
      return
    }
    const rec = getRecognizer()
    if (!rec) {
      setUnsupported(true)
      toast.error('Your browser does not support live transcription. Use Chrome on desktop.')
      return
    }
    rec.onresult = (event) => {
      // Append only finalized phrases to keep the transcript clean.
      let finalText = ''
      const results = event.results as ArrayLike<ArrayLike<{ transcript: string; isFinal?: boolean }>>
      for (let i = 0; i < results.length; i++) {
        const r = results[i]
        const first = r[0]
        if (first && first.isFinal) finalText += first.transcript + ' '
      }
      if (finalText) pendingRef.current += finalText
    }
    rec.onerror = (e) => {
      if (e.error && e.error !== 'no-speech') toast.error(`Mic error: ${e.error}`)
    }
    rec.onend = () => {
      setListening(false)
    }
    recognizerRef.current = rec
    rec.start()
    setListening(true)
    flushTimerRef.current = window.setInterval(flushChunk, CHUNK_FLUSH_MS)
    briefTimerRef.current = window.setInterval(refreshBrief, BRIEF_REFRESH_MS)
  }

  // Stop everything on unmount. Use sendBeacon for the final transcript flush so
  // pending words don't get dropped when the doctor closes the tab — async fetch()
  // is unreliable during page-unload.
  useEffect(() => {
    return () => {
      recognizerRef.current?.stop()
      if (flushTimerRef.current) window.clearInterval(flushTimerRef.current)
      if (briefTimerRef.current) window.clearInterval(briefTimerRef.current)
      const id    = copilotIdRef.current
      const text  = pendingRef.current.trim()
      const token = useAuthStore.getState().accessToken
      // fetch({ keepalive: true }) survives page-unload AND carries the Authorization
      // header (unlike sendBeacon, which can't set custom headers).
      if (id && text && token) {
        try {
          fetch(`/api/v1/copilot/${id}/transcript`, {
            method:  'POST',
            keepalive: true,
            credentials: 'include',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ chunk: text }),
          }).catch(() => { /* unload race — nothing more we can do */ })
          pendingRef.current = ''
        } catch {
          flushChunk()
        }
      } else {
        flushChunk()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!listening && flushTimerRef.current) {
      window.clearInterval(flushTimerRef.current); flushTimerRef.current = null
    }
    if (!listening && briefTimerRef.current) {
      window.clearInterval(briefTimerRef.current); briefTimerRef.current = null
    }
  }, [listening])

  const handleSave = async () => {
    const id = copilotIdRef.current
    if (!id) return
    setBusy(true)
    try {
      // Flush any pending words and force a final brief refresh first.
      await flushChunk()
      const next = await CopilotService.finalize(id, {
        diagnosis: diagnosis || state?.brief?.soap?.assessment || '',
        treatmentPlan: plan || state?.brief?.soap?.plan || '',
        prescriptions: rx,
        followUpDate: followUp || undefined,
      })
      setState(next)
      toast.success('Saved to consultation note')
      navigate(-1)
    } catch (err) {
      const code = (err as { errorCode?: string })?.errorCode
      if (code === 'NOTE_EXISTS') {
        toast.error('A consultation note already exists for this appointment.')
      } else {
        toast.error('Could not save consultation note.')
      }
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <MobScreen>
        <MobTopBar title="Visit Co-Pilot" back />
        <div style={{ padding: 24, textAlign: 'center', color: MB.text3 }}>Loading…</div>
      </MobScreen>
    )
  }

  const brief = state?.brief
  const redFlags = brief?.redFlags ?? []

  return (
    <MobScreen>
      <MobTopBar title="Visit Co-Pilot" back />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* Mic control */}
        <Card padding={14} style={{ marginBottom: 14, background: listening ? MB.dangerBg : MB.primary50 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: listening ? MB.danger : MB.primary700 }}>
                {listening ? '● Listening…' : 'Tap to start listening'}
              </div>
              <div style={{ fontSize: 11, color: MB.text3, marginTop: 2 }}>
                {unsupported
                  ? 'This browser cannot transcribe. Use Chrome on desktop.'
                  : 'Audio stays in your browser. Only the text transcript is sent to the AI.'}
              </div>
            </div>
            <Btn variant={listening ? 'secondary' : 'primary'} size="md" onClick={handleToggleListen}>
              <Icon name={listening ? 'pause' : 'mic'} size={14} />
              {listening ? 'Stop' : 'Start'}
            </Btn>
          </div>
        </Card>

        {/* Red flag banner */}
        {redFlags.length > 0 && (
          <Card padding={12} style={{ marginBottom: 14, background: MB.dangerBg, borderTop: `2px solid ${MB.danger}` }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Icon name="alert" size={16} color={MB.danger} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: MB.danger, letterSpacing: '0.04em' }}>RED FLAGS</div>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13, color: MB.text }}>
                  {redFlags.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Live brief */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div className="mb-eyebrow">AI Brief</div>
          {briefFailures >= 2 && (
            <div style={{ fontSize: 11, color: MB.danger, fontWeight: 600 }}>● AI not responding</div>
          )}
          {briefFailures < 2 && lastBriefAt && (
            <div style={{ fontSize: 11, color: MB.text3 }}>
              Updated {Math.max(0, Math.round((Date.now() - lastBriefAt) / 1000))}s ago
            </div>
          )}
        </div>
        <Card padding={12} style={{ marginBottom: 14 }}>
          <BriefRow label="Chief complaint" value={brief?.chiefComplaint || '—'} />
          <BriefRow label="HPI" value={brief?.hpi || '—'} />
          <BriefRow label="Differentials" value={brief?.differentials?.join(' • ') || '—'} />
          <BriefRow label="ICD suggestions" value={brief?.suggestedIcd?.join('; ') || '—'} last />
        </Card>

        {/* Editable note seeded from brief */}
        <div className="mb-eyebrow" style={{ marginBottom: 6 }}>Consultation note (review &amp; edit)</div>
        <Card padding={12} style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <LabeledArea label="Diagnosis"      value={diagnosis} onChange={setDiagnosis} rows={2} />
          <LabeledArea label="Treatment plan" value={plan}      onChange={setPlan}      rows={3} />
          <LabeledArea label="Prescriptions"  value={rx}        onChange={setRx}        rows={3} />
          <div>
            <label style={{ fontSize: 11, color: MB.text3 }}>Follow-up date</label>
            <input
              type="date"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              style={{ width: '100%', padding: 8, border: `1px solid ${MB.line2}`, borderRadius: 8, fontSize: 13 }}
            />
          </div>
        </Card>

        {/* Live transcript (collapsible feel) */}
        <details>
          <summary style={{ fontSize: 12, color: MB.text3, cursor: 'pointer' }}>
            Live transcript ({(state?.transcript?.length ?? 0)} chars)
          </summary>
          <div style={{ marginTop: 8, padding: 10, fontSize: 12, background: MB.bg2, borderRadius: 8, color: MB.text2, whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
            {state?.transcript || '—'}
          </div>
        </details>
      </div>

      <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0, display: 'flex', gap: 10 }}>
        <Btn variant="secondary" size="lg" style={{ flex: 1 }} disabled={busy} onClick={refreshBrief}>
          <Icon name="sparkle" size={14} /> Refresh brief
        </Btn>
        <Btn variant="primary" size="lg" style={{ flex: 1.4 }} loading={busy} onClick={handleSave} disabled={state?.finalized}>
          {state?.finalized ? 'Saved' : 'Save to note'}
        </Btn>
      </div>
    </MobScreen>
  )
})

function BriefRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: last ? 'none' : `1px solid ${MB.line2}` }}>
      <div style={{ fontSize: 11, color: MB.text3, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: MB.text }}>{value}</div>
    </div>
  )
}

function LabeledArea({ label, value, onChange, rows }: {
  label: string; value: string; onChange: (v: string) => void; rows: number
}) {
  return (
    <div>
      <label style={{ fontSize: 11, color: MB.text3 }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={{ width: '100%', padding: 8, border: `1px solid ${MB.line2}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
      />
    </div>
  )
}
