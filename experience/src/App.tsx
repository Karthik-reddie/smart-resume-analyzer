import React, { useEffect, useMemo, useState } from 'react'

export type Profile = {
  name: string
  email: string
  skills: string[]
  education: any[]
  experience: any[]
  raw_text: string
}

export type ScoreReport = {
  ats_score: number
  skill_match_score: number
  relevance_score: number
  coverage_score: number
  coverage_details: {
    has_experience: boolean
    has_education: boolean
    has_skills: boolean
    has_contact: boolean
    word_count: number
  }
  matched_skills: string[]
  missing_skills: string[]
  recommendations: {
    summary_suggestions: string
    skills_suggestions: string[]
    experience_suggestions: string[]
  }
  job_description_skills_detected: string[]
}

const LS_PROFILE_KEY = 'ats_cached_profile'
const LS_JD_KEY = 'ats_cached_jd'
const LS_REPORT_KEY = 'ats_cached_report'

export default function App() {
  // Application state
  const [profile, setProfile] = useState<Profile | null>(null)
  const [jobDescription, setJobDescription] = useState<string>('')
  const [report, setReport] = useState<ScoreReport | null>(null)

  // Request & UI lifecycles
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'job'>('upload')
  const [activeOutputTab, setActiveOutputTab] = useState<'bullets' | 'checklist' | 'summary'>('bullets')
  
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [scoring, setScoring] = useState(false)
  const [scoringPhase, setScoringPhase] = useState('')
  const [scoreError, setScoreError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [customResumeText, setCustomResumeText] = useState<string>('')
  const [showTextRecovery, setShowTextRecovery] = useState(false)

  // Hydrate from localStorage on boot
  useEffect(() => {
    try {
      const cachedProfile = localStorage.getItem(LS_PROFILE_KEY)
      const cachedJd = localStorage.getItem(LS_JD_KEY)
      const cachedReport = localStorage.getItem(LS_REPORT_KEY)

      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile) as Profile
        setProfile(parsed)
        setCustomResumeText(parsed.raw_text || '')
      }
      if (cachedJd) {
        setJobDescription(cachedJd)
      }
      if (cachedReport) {
        setReport(JSON.parse(cachedReport) as ScoreReport)
      }
    } catch (e) {
      console.warn('Could not hydrate storage', e)
    }
  }, [])

  // Sync inputs to localStorage
  useEffect(() => {
    if (jobDescription) {
      localStorage.setItem(LS_JD_KEY, jobDescription)
    } else {
      localStorage.removeItem(LS_JD_KEY)
    }
  }, [jobDescription])

  // Handle manual resume text edits
  const handleResumeTextChange = (text: string) => {
    setCustomResumeText(text)
    if (profile) {
      const updated = { ...profile, raw_text: text }
      setProfile(updated)
      localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(updated))
    } else {
      const draftProfile: Profile = {
        name: 'Manual Entry',
        email: '',
        skills: [],
        education: [],
        experience: [],
        raw_text: text
      }
      setProfile(draftProfile)
      localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(draftProfile))
    }
  }

  // File Upload Handler
  async function handleFileUpload(file: File) {
    const filename = file.name || ''
    const lower = filename.toLowerCase()
    const ok = lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx') || lower.endsWith('.txt')
    if (!ok) {
      setUploadError('Invalid file type. Allowed formats: PDF, DOCX, DOC, TXT.')
      return
    }

    setUploadError(null)
    setUploading(true)
    setUploadProgress(10)

    const start = Date.now()
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - start
      const p = Math.min(88, 10 + (elapsed / 2000) * 78)
      setUploadProgress(p)
    }, 150)

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const resp = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      })

      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}))
        const msg = j?.error?.message || `Upload failed (Status ${resp.status})`
        throw new Error(msg)
      }

      const parsedProfile = (await resp.json()) as Profile
      setProfile(parsedProfile)
      setCustomResumeText(parsedProfile.raw_text || '')
      localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(parsedProfile))
      setUploadProgress(100)
      
      // Auto switch to Job Description tab for smooth UX
      setTimeout(() => {
        setUploading(false)
        setActiveInputTab('job')
      }, 500)
    } catch (e: any) {
      setUploadError(e?.message || 'Failed to process resume file.')
      setUploading(false)
    } finally {
      window.clearInterval(timer)
    }
  }

  // Calculate ATS Score and recommendations
  async function calculateATSScore() {
    const resumeText = customResumeText || profile?.raw_text || ''
    if (!resumeText.trim()) {
      setScoreError('Please upload a resume or paste text first.')
      return
    }
    if (!jobDescription.trim()) {
      setScoreError('Please enter a target Job Description.')
      return
    }

    setScoreError(null)
    setScoring(true)
    setReport(null)

    // Interactive simulated parsing phases for premium feel
    const phases = [
      'Extracting Semantic Entities...',
      'Mapping Competencies to Job Schema...',
      'Evaluating Experience Density...',
      'Drafting Recruiter Refactoring Recommendations...'
    ]

    for (let i = 0; i < phases.length; i++) {
      setScoringPhase(phases[i])
      await new Promise((r) => setTimeout(r, 600))
    }

    try {
      const payload = {
        resume_text: resumeText,
        job_description: jobDescription,
        skills: profile?.skills || []
      }

      const resp = await fetch('/api/score-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}))
        const msg = j?.error?.message || `Optimization failed (Status ${resp.status})`
        throw new Error(msg)
      }

      const scoreReport = (await resp.json()) as ScoreReport
      setReport(scoreReport)
      localStorage.setItem(LS_REPORT_KEY, JSON.stringify(scoreReport))
    } catch (e: any) {
      setScoreError(e?.message || 'AI Scoring engine failed.')
    } finally {
      setScoring(false)
    }
  }

  // Clear workspace
  function clearWorkspace() {
    setProfile(null)
    setJobDescription('')
    setReport(null)
    setCustomResumeText('')
    setShowTextRecovery(false)
    localStorage.removeItem(LS_PROFILE_KEY)
    localStorage.removeItem(LS_JD_KEY)
    localStorage.removeItem(LS_REPORT_KEY)
  }

  // Copy suggestions to clipboard helper
  function copyToClipboard(text: string, index: number) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    })
  }

  // Quick action: Add missing skill to current draft skills
  function quickAddSkill(skill: string) {
    if (!profile) return
    const currentSkills = profile.skills || []
    if (!currentSkills.includes(skill)) {
      const updated = {
        ...profile,
        skills: [...currentSkills, skill]
      }
      setProfile(updated)
      localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(updated))
      
      // If report already generated, patch it locally for instant feedback loop
      if (report) {
        const nextMatched = sortedUnique([...report.matched_skills, skill])
        const nextMissing = report.missing_skills.filter(s => s !== skill)
        const nextSkillMatchScore = round(
          (nextMatched.length / 
          Math.max(1, report.job_description_skills_detected.length)) * 100
        )
        const nextAtsScore = Math.round(
          (nextSkillMatchScore * 0.5) +
          (report.relevance_score * 0.3) +
          (report.coverage_score * 0.2)
        )

        const updatedReport = {
          ...report,
          matched_skills: nextMatched,
          missing_skills: nextMissing,
          skill_match_score: nextSkillMatchScore,
          ats_score: nextAtsScore
        }
        setReport(updatedReport)
        localStorage.setItem(LS_REPORT_KEY, JSON.stringify(updatedReport))
      }
    }
  }

  function sortedUnique(arr: string[]) {
    return Array.from(new Set(arr)).sort()
  }

  function round(num: number) {
    return Math.round(num * 10) / 10
  }

  // Color mapping based on score
  const scoreColors = useMemo(() => {
    if (!report) return { text: 'text-gray-400', border: 'border-gray-500', bg: 'bg-gray-500/10', glow: 'shadow-gray-500/20' }
    const score = report.ats_score
    if (score < 50) {
      return {
        text: 'text-rose-400',
        border: 'border-rose-500/40',
        bg: 'bg-rose-500/10',
        glow: 'shadow-rose-500/20',
        stroke: '#f43f5e',
        label: 'CRITICAL REFACTOR REQUIRED'
      }
    } else if (score < 80) {
      return {
        text: 'text-amber-400',
        border: 'border-amber-500/40',
        bg: 'bg-amber-500/10',
        glow: 'shadow-amber-500/20',
        stroke: '#fbbf24',
        label: 'COMPETITIVE ALIGNMENT'
      }
    } else {
      return {
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        bg: 'bg-emerald-500/10',
        glow: 'shadow-emerald-500/20',
        stroke: '#34d399',
        label: 'GOD-TIER RESUME MATCH'
      }
    }
  }, [report])

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-12">
      {/* Dynamic Background Highlights */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-900/15 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-900/15 blur-[120px] animate-pulse-glow" />

      {/* Main Workspace Frame */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        
        {/* God-Tier Header */}
        <header className="glass-panel relative mb-8 rounded-2xl p-6 border-glow-indigo">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 glow-btn-indigo animate-float">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-indigo-200 via-slate-100 to-cyan-200 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
                  SMART ATS RESUME OPTIMIZER
                </h1>
                <p className="mt-1 text-xs font-medium text-slate-400 sm:text-sm">
                  Engineered validation models to maximize recruiter indexing and score alignment
                </p>
              </div>
            </div>

            {/* Connection Status Badge */}
            <div className="flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-1.5 border border-slate-800">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-300">Scoring Engine Connected</span>
            </div>
          </div>
        </header>

        {/* 2-Column Split Workspace */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Left Column: Interactive Inputs Panel (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Input Workspace Panel */}
            <div className="glass-panel flex-1 rounded-2xl border border-slate-800 p-6 flex flex-col">
              
              {/* Tab Navigation */}
              <div className="mb-6 flex rounded-lg bg-slate-950 p-1 border border-slate-800/80">
                <button
                  className={`flex-1 rounded-md py-2.5 text-xs font-bold transition-all duration-300 ${
                    activeInputTab === 'upload'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  onClick={() => setActiveInputTab('upload')}
                >
                  1. RESUME INGESTION
                </button>
                <button
                  className={`flex-1 rounded-md py-2.5 text-xs font-bold transition-all duration-300 ${
                    activeInputTab === 'job'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  onClick={() => setActiveInputTab('job')}
                >
                  2. ROLE TARGET
                </button>
              </div>

              {/* Tab 1: Resume Upload */}
              {activeInputTab === 'upload' && (
                <div className="flex-1 flex flex-col">
                  {!profile ? (
                    <div className="flex-1 flex flex-col justify-center">
                      <div
                        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-300 ${
                          uploading
                            ? 'border-indigo-500/40 bg-indigo-950/20'
                            : 'border-slate-800 bg-slate-950/40 hover:border-indigo-500/30 hover:bg-slate-900/20'
                        }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          const f = e.dataTransfer.files?.[0]
                          if (f) handleFileUpload(f)
                        }}
                      >
                        <div className="rounded-full bg-slate-900 p-4 border border-slate-800">
                          <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-slate-200">Drag & Drop Resume</h3>
                        <p className="mt-2 text-center text-xs text-slate-500">
                          Supports PDF, DOCX, DOC, or TXT
                        </p>
                        
                        <div className="mt-6">
                          <label className="cursor-pointer rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white transition-all glow-btn-indigo block">
                            BROWSE FILE
                            <input
                              className="hidden"
                              type="file"
                              accept={'.pdf,.doc,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) handleFileUpload(f)
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {uploading && (
                        <div className="mt-6 rounded-xl bg-slate-900/60 p-4 border border-slate-800/80">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                            <span>Ingesting & Parsing Resume...</span>
                            <span className="text-indigo-400">{Math.round(uploadProgress)}%</span>
                          </div>
                          <div className="mt-3 h-2 w-full overflow-hidden rounded bg-slate-950">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      )}

                      {uploadError && (
                        <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400">
                          {uploadError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-between">
                      {/* Active Profile Info */}
                      <div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-900/80 p-4 border border-slate-800 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-indigo-500/10 p-2 border border-indigo-500/20">
                              <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-200">{profile.name || 'Candidate profile parsed'}</h4>
                              <p className="text-xs text-slate-400">{profile.email || 'Email not detected'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setProfile(null)
                              setReport(null)
                              setCustomResumeText('')
                              localStorage.removeItem(LS_PROFILE_KEY)
                              localStorage.removeItem(LS_REPORT_KEY)
                            }}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all"
                            title="Remove file"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Extracted skills section */}
                        {profile.skills && profile.skills.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Skills Extracted</h5>
                            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-950/40 rounded-lg border border-slate-850">
                              {profile.skills.map((skill) => (
                                <span key={skill} className="rounded bg-indigo-950/60 border border-indigo-500/25 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                                  {skill.toUpperCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recovery / Edit Resume Text Toggle */}
                        <div className="mt-4">
                          <button
                            onClick={() => setShowTextRecovery(!showTextRecovery)}
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            <span>{showTextRecovery ? 'Hide' : 'Edit / Review'} Raw Extracted Text</span>
                            <svg className={`h-3 w-3 transition-transform ${showTextRecovery ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {showTextRecovery && (
                            <div className="mt-3">
                              <textarea
                                value={customResumeText}
                                onChange={(e) => handleResumeTextChange(e.target.value)}
                                className="w-full h-48 rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                                placeholder="Paste or modify resume text here to re-analyze..."
                              />
                              <p className="mt-1 text-[10px] text-slate-500">
                                Changes are saved dynamically. You can optimize the score by manually typing missing keywords.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 border-t border-slate-800/80 pt-4">
                        <button
                          onClick={() => setActiveInputTab('job')}
                          className="w-full rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 py-3 text-xs font-bold text-slate-200 transition-all text-center"
                        >
                          PROCEED TO JOB DESCRIPTION &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Job Description */}
              {activeInputTab === 'job' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Target Role / Job Description</label>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {jobDescription.length} characters
                      </span>
                    </div>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="w-full flex-1 min-h-[220px] rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                      placeholder="Paste the target job description here. The parser will scan for critical technical qualifications, competencies, and years of experience to compile scoring benchmarks..."
                    />
                  </div>

                  <div className="mt-6 border-t border-slate-800/80 pt-4 flex gap-3">
                    <button
                      onClick={() => setActiveInputTab('upload')}
                      className="rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 px-4 py-3 text-xs font-bold text-slate-400 transition-all"
                    >
                      &larr; BACK
                    </button>
                    
                    <button
                      onClick={calculateATSScore}
                      disabled={scoring || !jobDescription.trim() || !(profile || customResumeText.trim())}
                      className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 disabled:from-slate-800 disabled:to-slate-800 py-3 text-xs font-bold text-white transition-all glow-btn-indigo disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {scoring ? 'RUNNING AI PARSERS...' : 'CALCULATE ATS ALIGNMENT'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error notifications */}
            {(scoreError || uploadError) && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-400 flex items-start gap-2.5">
                <svg className="h-5 w-5 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h5 className="font-bold">Execution Error</h5>
                  <p className="mt-1 font-semibold text-slate-300">{scoreError || uploadError}</p>
                </div>
              </div>
            )}

            {/* Scoring Processing Loader */}
            {scoring && (
              <div className="glass-panel border-glow-indigo rounded-xl p-5 border border-indigo-500/20 relative overflow-hidden">
                {/* Floating internal dots */}
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-indigo-500/5 blur-xl animate-pulse-glow" />
                
                <div className="flex items-center gap-4">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500"></span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">AI Optimizer Running</h5>
                    <p className="mt-1 text-xs font-semibold text-slate-200">{scoringPhase}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Glow Dashboard (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            
            {/* Empty State */}
            {!report && !scoring && (
              <div className="glass-panel flex-1 rounded-2xl border border-slate-800 p-8 flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-slate-900/60 p-5 border border-slate-800 text-slate-500 animate-float mb-6">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-300">Awaiting Alignment Calculations</h3>
                <p className="mt-2 max-w-sm text-xs font-medium text-slate-500">
                  Provide candidate resume and define target role details to activate recruiter indexing scores, semantic gaps, and customizable optimizations.
                </p>
              </div>
            )}

            {/* Scored State Dashboard */}
            {report && !scoring && (
              <div className="flex-1 flex flex-col gap-6">
                
                {/* Score Grid & Radials */}
                <div className="glass-panel rounded-2xl border border-slate-800 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    {/* Circle Radial Progress */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
                      <div className="relative flex items-center justify-center h-32 w-32">
                        {/* Outer Glow Ring */}
                        <div className={`absolute inset-1.5 rounded-full border-2 ${scoreColors.border} opacity-40`} />
                        
                        {/* SVG Gauge */}
                        <svg className="absolute h-full w-full -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="52"
                            className="stroke-slate-800"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="52"
                            stroke={scoreColors.stroke}
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 52}
                            strokeDashoffset={2 * Math.PI * 52 * (1 - report.ats_score / 100)}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>

                        {/* Inside Text */}
                        <div className="text-center z-10">
                          <span className="text-3xl font-extrabold tracking-tight text-white">{report.ats_score}</span>
                          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Score</span>
                        </div>
                      </div>

                      <div className="mt-4 text-center">
                        <span className={`inline-block text-[10px] font-bold tracking-widest px-3 py-1 rounded-full ${scoreColors.bg} ${scoreColors.text} border border-slate-800`}>
                          {scoreColors.label}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Scores Grid */}
                    <div className="md:col-span-7 flex flex-col gap-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Breakdown Indices</h4>
                      
                      {/* Metric 1: Skill Match */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-300">Skill Competency Match</span>
                          <span className="font-bold text-slate-100">{report.skill_match_score}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/40">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${report.skill_match_score}%` }} />
                        </div>
                      </div>

                      {/* Metric 2: Relevance */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-300">Semantic Context Relevance</span>
                          <span className="font-bold text-slate-100">{report.relevance_score}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/40">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${report.relevance_score}%` }} />
                        </div>
                      </div>

                      {/* Metric 3: Coverage */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-300">Resume Format/Depth Coverage</span>
                          <span className="font-bold text-slate-100">{report.coverage_score}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/40">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${report.coverage_score}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skill Matrix Workspace */}
                <div className="glass-panel rounded-2xl border border-slate-800 p-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Competency Gaps Matrix</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Matched Skills */}
                    <div className="rounded-xl bg-slate-900/40 p-4 border border-slate-800">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="rounded-full bg-emerald-500/10 p-1 border border-emerald-500/20 text-emerald-400">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Matched Skills ({report.matched_skills.length})</h5>
                      </div>

                      {report.matched_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {report.matched_skills.map(s => (
                            <span key={s} className="inline-flex items-center rounded bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              {s.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] font-medium text-slate-500">No skills matching job description identified.</p>
                      )}
                    </div>

                    {/* Missing Skills Gaps */}
                    <div className="rounded-xl bg-slate-900/40 p-4 border border-slate-800">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="rounded-full bg-amber-500/10 p-1 border border-amber-500/20 text-amber-400">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Missing Skills ({report.missing_skills.length})</h5>
                      </div>

                      {report.missing_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {report.missing_skills.map(s => (
                            <button
                              key={s}
                              onClick={() => quickAddSkill(s)}
                              className="inline-flex items-center gap-1 rounded bg-slate-950 border border-slate-850 px-2 py-0.5 text-[10px] font-bold text-amber-400 hover:border-amber-400/50 hover:bg-slate-900 transition-all text-left"
                              title="Click to add to your skills matrix"
                            >
                              <span>{s.toUpperCase()}</span>
                              <span className="text-[10px] font-bold text-slate-500 hover:text-amber-400">+</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-emerald-400">Perfect skill match! Excellent coverage.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optimization suggestions Center */}
                <div className="glass-panel rounded-2xl border border-slate-800 p-6 flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Optimization Center</h4>
                    
                    {/* Navigation tabs */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveOutputTab('bullets')}
                        className={`rounded px-3 py-1.5 text-[10px] font-bold transition-all ${
                          activeOutputTab === 'bullets'
                            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        EXP. BULLETS
                      </button>
                      <button
                        onClick={() => setActiveOutputTab('checklist')}
                        className={`rounded px-3 py-1.5 text-[10px] font-bold transition-all ${
                          activeOutputTab === 'checklist'
                            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        CHECKLIST
                      </button>
                      <button
                        onClick={() => setActiveOutputTab('summary')}
                        className={`rounded px-3 py-1.5 text-[10px] font-bold transition-all ${
                          activeOutputTab === 'summary'
                            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        SUMMARY
                      </button>
                    </div>
                  </div>

                  {/* Tab 1: Experience Bullet suggestions */}
                  {activeOutputTab === 'bullets' && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h5 className="text-xs font-bold text-slate-350">Actionable Experience Enhancers</h5>
                        <p className="mt-1 text-[10px] text-slate-500 font-medium">
                          Inject these quantitative, highly tailored bullets into your Experience section roles to index missing skills:
                        </p>
                      </div>

                      <div className="flex flex-col gap-3">
                        {report.recommendations.experience_suggestions.map((bullet, idx) => (
                          <div key={idx} className="group relative rounded-xl bg-slate-950/70 p-4 border border-slate-850 hover:border-slate-800 transition-all">
                            <p className="text-xs font-semibold text-slate-300 pr-12 leading-relaxed">
                              {bullet}
                            </p>
                            <button
                              onClick={() => copyToClipboard(bullet, idx)}
                              className="absolute top-4 right-4 rounded-lg bg-slate-900 border border-slate-800 p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 transition-all"
                              title="Copy to clipboard"
                            >
                              {copiedIndex === idx ? (
                                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Skills Action Checklist */}
                  {activeOutputTab === 'checklist' && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h5 className="text-xs font-bold text-slate-350">Skills and Competency Checklist</h5>
                        <p className="mt-1 text-[10px] text-slate-500 font-medium">
                          Follow this roadmap checklist of content refactors to immediately maximize scoring profiles:
                        </p>
                      </div>

                      <div className="flex flex-col gap-3">
                        {report.recommendations.skills_suggestions.map((sug, idx) => (
                          <div key={idx} className="flex items-start gap-3 rounded-xl bg-slate-950/40 p-4 border border-slate-900">
                            <div className="mt-0.5 rounded bg-indigo-500/10 p-1 border border-indigo-500/20 text-indigo-400 shrink-0">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                            <span className="text-xs font-semibold text-slate-300 leading-relaxed">{sug}</span>
                          </div>
                        ))}

                        {/* Formatting diagnostic results */}
                        <div className="mt-2 border-t border-slate-850 pt-4">
                          <h6 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Formatting Analysis</h6>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <span className={`inline-block h-2.5 w-2.5 rounded-full ${report.coverage_details.has_experience ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span className="text-slate-400">Experience Block</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <span className={`inline-block h-2.5 w-2.5 rounded-full ${report.coverage_details.has_education ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span className="text-slate-400">Education Block</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <span className={`inline-block h-2.5 w-2.5 rounded-full ${report.coverage_details.has_skills ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span className="text-slate-400">Skills Grid Block</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <span className={`inline-block h-2.5 w-2.5 rounded-full ${report.coverage_details.has_contact ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span className="text-slate-400">Contact Details</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Summary suggestions */}
                  {activeOutputTab === 'summary' && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h5 className="text-xs font-bold text-slate-350">Professional Summary Rewrite Suggestion</h5>
                        <p className="mt-1 text-[10px] text-slate-500 font-medium">
                          Elevate your executive positioning by rewording the top hook of your resume:
                        </p>
                      </div>

                      <div className="group relative rounded-xl bg-slate-950/70 p-4 border border-slate-850 hover:border-slate-800 transition-all">
                        <p className="text-xs font-semibold text-slate-300 pr-12 leading-relaxed">
                          {report.recommendations.summary_suggestions}
                        </p>
                        <button
                          onClick={() => copyToClipboard(report.recommendations.summary_suggestions, 99)}
                          className="absolute top-4 right-4 rounded-lg bg-slate-900 border border-slate-800 p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 transition-all"
                          title="Copy to clipboard"
                        >
                          {copiedIndex === 99 ? (
                            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Clear and Reset Workspace buttons */}
                  <div className="border-t border-slate-850 pt-4 flex justify-end">
                    <button
                      onClick={clearWorkspace}
                      className="rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 hover:text-slate-200 px-4 py-2 text-xs font-bold text-slate-400 transition-all"
                    >
                      RESET WORKSPACE
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
