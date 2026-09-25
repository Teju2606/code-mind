import React, { useState, useEffect, useRef } from 'react';
import { extractTopicsFromTranscript, extractActionItemsFromTranscript } from '../utils/speechExtractor';

export default function VoiceRecorder({ onUseTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasStopped, setHasStopped] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  // Audio recording storage
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Extracted post-recording results
  const [extractedTopics, setExtractedTopics] = useState([]);
  const [extractedActions, setExtractedActions] = useState([]);
  const [finalTranscriptText, setFinalTranscriptText] = useState('');

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioElementRef = useRef(null);
  const timerRef = useRef(null);
  const isRecordingRef = useRef(false);

  // Check Web Speech API availability on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Timer effect for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Clean up audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl]);

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 1. Start Recording → record microphone audio & speech
  const handleStartRecording = async () => {
    setErrorMessage(null);
    setCopied(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    audioChunksRef.current = [];

    // Attempt to capture microphone audio stream via MediaRecorder
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        let mimeType = 'audio/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported && !MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/mp4';
          }
          const mediaRecorder = new MediaRecorder(stream, { mimeType });
          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };
          mediaRecorder.onstop = () => {
            if (audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
              const url = URL.createObjectURL(audioBlob);
              setAudioUrl(url);
            }
          };
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.start(250); // Slice audio data every 250ms
        }
      }
    } catch (mediaErr) {
      console.warn('MediaRecorder microphone capture warning:', mediaErr);
      // Even if raw audio stream capture is restricted, proceed with speech recognition
    }

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setErrorMessage('Browser Speech Recognition is not available in this browser. Please use Chrome, Edge, or Safari.');
      setIsRecording(true);
      isRecordingRef.current = true;
      setHasStopped(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        isRecordingRef.current = true;
        setHasStopped(false);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += trans + ' ';
          } else {
            interim += trans;
          }
        }

        if (finalChunk) {
          setLiveTranscript(prev => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? `${trimmedPrev} ${finalChunk.trim()}` : finalChunk.trim();
          });
        }
        setInterimText(interim);
      };

      recognition.onerror = (event) => {
        if (event.error === 'no-speech') return; // Silence is normal
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser.');
          setIsRecording(false);
          isRecordingRef.current = false;
        } else if (event.error !== 'aborted') {
          setErrorMessage(`Speech recognition notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Restart if active
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      setHasStopped(false);
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setErrorMessage('Could not initialize speech recognition. Please verify microphone permissions.');
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  // 2. Stop Recording → stop and save the recording
  const handleStopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);

    // Stop MediaRecorder and release microphone stream
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.log('Error stopping media recorder:', e);
      }
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    // Stop Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Error stopping recognition:', e);
      }
    }

    // Finalize Exact Transcript
    const fullText = (liveTranscript + (interimText ? ` ${interimText}` : '')).trim();
    setLiveTranscript(fullText);
    setInterimText('');
    setFinalTranscriptText(fullText);
    setHasStopped(true);

    // Extract Main Topics & Action Items strictly without inventing information
    if (fullText) {
      const topics = extractTopicsFromTranscript(fullText);
      const actions = extractActionItemsFromTranscript(fullText);
      setExtractedTopics(topics);
      setExtractedActions(actions);
    } else {
      setExtractedTopics([]);
      setExtractedActions([]);
    }
  };

  // Copy verbatim transcript
  const handleCopyTranscript = () => {
    const textToCopy = finalTranscriptText || liveTranscript;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  // Transfer transcript to meeting intake form
  const handleTransferToIntake = () => {
    const textToSend = finalTranscriptText || liveTranscript;
    if (onUseTranscript && textToSend) {
      onUseTranscript(textToSend);
    }
  };

  // Reset session
  const handleClearSession = () => {
    if (isRecording) {
      handleStopRecording();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setLiveTranscript('');
    setInterimText('');
    setFinalTranscriptText('');
    setRecordingDuration(0);
    setHasStopped(false);
    setExtractedTopics([]);
    setExtractedActions([]);
    setErrorMessage(null);
    setIsPlayingAudio(false);
  };

  // Simulation handler for quick testing without hardware microphone
  const handleSimulateTestSpeech = (sampleText) => {
    const defaultSample = "Good morning team. We discussed the API architecture and database performance. Marcus will complete the backend integration tomorrow. Sarah will review the security checklist by Friday. The deployment should be scheduled next week.";
    const textToUse = typeof sampleText === 'string' && sampleText.trim() ? sampleText : defaultSample;

    setIsRecording(true);
    isRecordingRef.current = true;
    setLiveTranscript('');
    setInterimText('');
    setHasStopped(false);
    setRecordingDuration(0);
    if (audioUrl) setAudioUrl(null);

    let currentIndex = 0;
    const words = textToUse.split(' ');

    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setLiveTranscript(prev => (prev ? prev + ' ' : '') + words[currentIndex]);
        currentIndex++;
        setRecordingDuration(prev => prev + 1);
      } else {
        clearInterval(interval);
        setIsRecording(false);
        isRecordingRef.current = false;
        setFinalTranscriptText(textToUse);
        setHasStopped(true);
        setExtractedTopics(extractTopicsFromTranscript(textToUse));
        setExtractedActions(extractActionItemsFromTranscript(textToUse));
      }
    }, 120);
  };

  const displayText = liveTranscript + (interimText ? (liveTranscript ? ` ${interimText}` : interimText) : '');

  return (
    <div className="voice-recorder-card" id="voice-recorder-section">
      {/* Card Header */}
      <div className="voice-recorder-header">
        <div className="voice-recorder-title-wrap">
          <div className={`voice-mic-icon-badge ${isRecording ? 'pulse-recording' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </div>
          <div>
            <h3 className="voice-recorder-title">Live Voice Meeting Recording</h3>
            <p className="voice-recorder-subtitle">
              Record microphone audio, generate verbatim live transcript, and extract topics and commitments
            </p>
          </div>
        </div>

        {/* Live Recording Status Indicator */}
        <div className="voice-status-pill-wrap">
          {isRecording ? (
            <div className="voice-recording-pill active" id="voice-recording-active-badge">
              <span className="live-rec-dot"></span>
              <span className="live-rec-text">RECORDING AUDIO</span>
              <span className="live-rec-timer">{formatTime(recordingDuration)}</span>
            </div>
          ) : hasStopped && finalTranscriptText ? (
            <div className="voice-recording-pill completed" id="voice-recording-stopped-badge">
              <span className="check-dot">✓</span>
              <span>Recording Saved</span>
              <span className="duration-tag">{formatTime(recordingDuration)}</span>
            </div>
          ) : (
            <div className="voice-recording-pill standby">
              <span className="standby-dot"></span>
              <span>Ready to Record</span>
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="voice-controls-bar">
        <div className="voice-action-buttons">
          {/* 1. Start Recording Button */}
          <button
            id="start-recording-btn"
            type="button"
            className={`btn btn-primary start-rec-btn ${isRecording ? 'disabled-recording' : ''}`}
            onClick={handleStartRecording}
            disabled={isRecording}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
            <span>{isRecording ? 'Listening...' : 'Start Recording'}</span>
          </button>

          {/* 2. Stop Recording Button */}
          <button
            id="stop-recording-btn"
            type="button"
            className={`btn btn-danger stop-rec-btn ${!isRecording ? 'disabled-stopped' : ''}`}
            onClick={handleStopRecording}
            disabled={!isRecording}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <rect x="4" y="4" width="16" height="16" rx="2"></rect>
            </svg>
            <span>Stop Recording</span>
          </button>

          {/* Reset / Clear Button */}
          {(liveTranscript || hasStopped) && (
            <button
              id="clear-recording-btn"
              type="button"
              className="btn btn-secondary btn-sm clear-rec-btn"
              onClick={handleClearSession}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              <span>Reset</span>
            </button>
          )}

          {/* Quick Simulation Test Button for testing voice flow */}
          <button
            id="test-speech-simulation-btn"
            type="button"
            className="btn btn-ghost btn-sm voice-test-btn"
            onClick={() => handleSimulateTestSpeech()}
            title="Test voice-to-text with sample spoken meeting phrases"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Test Sample Voice</span>
          </button>
        </div>

        {/* Audio Wave Visualizer during active recording */}
        {isRecording && (
          <div className="voice-audio-waveform" id="voice-audio-waveform-visualizer">
            <span className="wave-bar bar-1"></span>
            <span className="wave-bar bar-2"></span>
            <span className="wave-bar bar-3"></span>
            <span className="wave-bar bar-4"></span>
            <span className="wave-bar bar-5"></span>
            <span className="wave-label">Audio active — Speak clearly into mic</span>
          </div>
        )}
      </div>

      {/* Saved Audio Playback Bar (if recorded audio stream was captured) */}
      {hasStopped && audioUrl && (
        <div className="saved-audio-player-card" id="saved-audio-player">
          <div className="audio-player-left">
            <div className="audio-player-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            </div>
            <div className="audio-player-info">
              <span className="audio-player-title">Saved Voice Recording</span>
              <span className="audio-player-duration">{formatTime(recordingDuration)} Duration • Audio Ready</span>
            </div>
          </div>
          <div className="audio-player-controls">
            <audio
              ref={audioElementRef}
              src={audioUrl}
              controls
              className="native-audio-player"
              onPlay={() => setIsPlayingAudio(true)}
              onPause={() => setIsPlayingAudio(false)}
              onEnded={() => setIsPlayingAudio(false)}
            />
          </div>
        </div>
      )}

      {/* Error / Notice Alert */}
      {errorMessage && (
        <div className="voice-alert-box error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Browser Support Notice if not available */}
      {!speechSupported && (
        <div className="voice-alert-box warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <div>
            <strong>Speech Recognition Notice:</strong> Web Speech API is supported natively in Chrome, Edge, and Safari. Click <em>"Test Sample Voice"</em> above to test transcription and automated extraction.
          </div>
        </div>
      )}

      {/* Live Transcript Text Area */}
      <div className="form-group voice-transcript-field">
        <div className="form-label">
          <span className="label-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Live Transcript Text Area
          </span>
          <div className="transcript-stats-row">
            {interimText && <span className="interim-speaking-tag">Listening to speech...</span>}
            <span className="char-counter-pill">
              {displayText ? displayText.split(/\s+/).filter(Boolean).length : 0} words • {displayText.length} chars
            </span>
          </div>
        </div>

        <div className="textarea-container">
          <textarea
            id="live-transcript-textarea"
            className={`form-textarea voice-live-textarea ${isRecording ? 'textarea-recording-glow' : ''}`}
            placeholder={isRecording ? "Listening... Speak into your microphone now to see live transcription here in real-time." : "Click 'Start Recording' and begin speaking. Live transcript will appear here word-for-word..."}
            value={displayText}
            onChange={(e) => {
              setLiveTranscript(e.target.value);
              setInterimText('');
            }}
            rows={5}
          ></textarea>
        </div>
      </div>

      {/* 3, 4, 5. POST-RECORDING RESULTS SECTION (Displayed after stopping recording) */}
      {hasStopped && finalTranscriptText && (
        <div className="voice-results-container" id="voice-post-recording-results">
          <div className="voice-results-banner">
            <div className="results-banner-left">
              <div className="results-badge-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <path d="M9 15l2 2 4-4"/>
                </svg>
              </div>
              <div>
                <h4 className="results-banner-title">Recorded Meeting Intelligence Summary</h4>
                <p className="results-banner-desc">Faithful extraction based strictly on your spoken words</p>
              </div>
            </div>

            <div className="results-banner-actions">
              <button
                id="copy-transcript-btn"
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyTranscript}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>{copied ? 'Copied!' : 'Copy Exact Transcript'}</span>
              </button>

              {onUseTranscript && (
                <button
                  id="use-in-meeting-intake-btn"
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleTransferToIntake}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                  <span>Use in Intake Form</span>
                </button>
              )}
            </div>
          </div>

          <div className="voice-results-grid">
            {/* 3. Exact Transcript */}
            <div className="voice-result-card" id="exact-transcript-section">
              <div className="result-card-header">
                <div className="result-card-title">
                  <span className="section-number-pill">1</span>
                  <span>Exact Transcript</span>
                </div>
                <span className="accuracy-tag">Verbatim Audio Record</span>
              </div>
              <div className="result-card-body">
                <div className="exact-transcript-box" id="exact-transcript-display">
                  "{finalTranscriptText}"
                </div>
              </div>
            </div>

            {/* 4. Main Topics Discussed */}
            <div className="voice-result-card" id="main-topics-section">
              <div className="result-card-header">
                <div className="result-card-title">
                  <span className="section-number-pill">2</span>
                  <span>Main Topics Discussed</span>
                </div>
                <span className="topic-count-pill">{extractedTopics.length} Topics</span>
              </div>
              <div className="result-card-body">
                {extractedTopics.length > 0 ? (
                  <ul className="topics-list" id="main-topics-list">
                    {extractedTopics.map((topic, idx) => (
                      <li key={idx} className="topic-list-item">
                        <span className="topic-bullet-icon">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </span>
                        <span className="topic-text">{topic}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="empty-topics-state">
                    <span>No distinct discussion topics identified.</span>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Action Items with Action, Owner, Deadline, Status, Exact spoken source quote */}
            <div className="voice-result-card voice-action-items-card" id="action-items-section">
              <div className="result-card-header">
                <div className="result-card-title">
                  <span className="section-number-pill">3</span>
                  <span>Action Items</span>
                </div>
                <span className="action-count-pill">{extractedActions.length} Commitments</span>
              </div>
              <div className="result-card-body">
                {extractedActions.length > 0 ? (
                  <div className="voice-actions-list" id="voice-action-items-list">
                    {extractedActions.map((actionItem) => (
                      <div key={actionItem.id} className="voice-action-item-card">
                        {/* Header: Action & Status */}
                        <div className="action-card-header-row">
                          <div className="action-title-wrap">
                            <span className="action-checkbox-mock"></span>
                            <span className="action-main-text">
                              <strong>Action:</strong> {actionItem.action}
                            </span>
                          </div>
                          <span className={`status-badge ${actionItem.status.toLowerCase()}`}>
                            <span className="status-badge-dot"></span>
                            {actionItem.status}
                          </span>
                        </div>

                        {/* Metadata: Owner & Deadline */}
                        <div className="action-card-meta-row">
                          <div className="action-meta-item">
                            <span className="meta-label">Owner:</span>
                            <div className="action-owner-chip">
                              <div
                                className="owner-mini-avatar"
                                style={{ backgroundColor: actionItem.ownerColor || '#2563eb' }}
                              >
                                {actionItem.ownerInitials || actionItem.owner?.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="owner-name-text">
                                {actionItem.owner || 'Not specified'}
                              </span>
                            </div>
                          </div>

                          <div className="action-meta-item">
                            <span className="meta-label">Deadline:</span>
                            <div className="action-deadline-chip">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              <span>{actionItem.deadline || 'Not specified'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Exact Spoken Source Quote */}
                        {actionItem.sourceSnippet && (
                          <div className="action-snippet-quote">
                            <span className="quote-label">Exact spoken source quote:</span> "{actionItem.sourceSnippet}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-actions-state">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>No actionable commitments detected in this speech sample.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
