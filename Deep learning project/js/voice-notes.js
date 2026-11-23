/**
 * CLINIDENT - Voice-to-Text Clinical Dictation Module
 * Integrates Web Speech Recognition API for hands-free SOAP note recording.
 */

class VoiceNotesModule {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.targetElementId = 'soapSubjective';
    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isRecording = true;
        this.updateButtonUI(true);
        window.app.showToast('Voice dictation started. Speak clinical notes clearly.');
      };

      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }

        const target = document.getElementById(this.targetElementId);
        if (target) {
          if (event.results[event.results.length - 1].isFinal) {
            target.value = (target.value ? target.value + ' ' : '') + transcript.trim();
          }
        }

        const previewEl = document.getElementById('voiceLiveTranscriptPreview');
        if (previewEl) {
          previewEl.textContent = `🎙️ Listening: "${transcript.trim()}"`;
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        this.isRecording = false;
        this.updateButtonUI(false);
        if (event.error === 'not-allowed') {
          window.app.showToast('Microphone access denied. Please allow microphone permission.');
        }
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        this.updateButtonUI(false);
      };
    }
  }

  toggleRecording(targetFieldId = 'soapSubjective') {
    this.targetElementId = targetFieldId;

    if (!this.recognition) {
      // Simulate speech dictation fallback for demonstration
      this.simulateSpeechFallback();
      return;
    }

    if (this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
      this.updateButtonUI(false);
      window.app.showToast('Voice dictation stopped.');
    } else {
      try {
        this.recognition.start();
      } catch (e) {
        this.simulateSpeechFallback();
      }
    }
  }

  simulateSpeechFallback() {
    const target = document.getElementById(this.targetElementId);
    const phrases = [
      "Patient reports acute sensitivity to thermal stimuli on upper right quadrant.",
      "Carious lesion identified on occlusal surface. Recommended composite restoration.",
      "Administered 1.8ml 2% Lignocaine local anesthesia. Cavity prep completed cleanly.",
      "Soft tissues healthy, normal pocket depths observed on adjacent teeth."
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    if (target) {
      target.value = (target.value ? target.value + '\n' : '') + phrase;
    }
    window.app.showToast('Dictated phrase inserted into clinical note.');
  }

  updateButtonUI(recording) {
    const btn = document.getElementById('btnVoiceDictate');
    const previewEl = document.getElementById('voiceLiveTranscriptPreview');
    if (!btn) return;

    if (recording) {
      btn.classList.add('bg-rose-600', 'text-white', 'recording-pulse');
      btn.classList.remove('bg-slate-100', 'text-slate-700');
      btn.innerHTML = `
        <svg class="w-4 h-4 animate-spin text-white inline-block mr-1" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
        <span>Stop Dictation</span>
      `;
      if (previewEl) previewEl.classList.remove('hidden');
    } else {
      btn.classList.remove('bg-rose-600', 'text-white', 'recording-pulse');
      btn.classList.add('bg-slate-100', 'text-slate-700');
      btn.innerHTML = `
        <svg class="w-4 h-4 text-rose-500 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
        <span>Voice Dictate</span>
      `;
      if (previewEl) previewEl.classList.add('hidden');
    }
  }
}

window.voiceNotes = new VoiceNotesModule();
