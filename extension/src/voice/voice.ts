// Voice engine running inside extension-origin iframe
let recognition: any = null;
let activeNonce = '';

window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'START_LISTENING') {
    activeNonce = data.nonce;
    startSpeechRecognition(data.language || 'en-US');
  } else if (data.type === 'STOP_LISTENING') {
    stopSpeechRecognition();
  }
});

function startSpeechRecognition(language: string) {
  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognitionClass) {
    postToParent({
      type: 'VOICE_ERROR',
      nonce: activeNonce,
      payload: 'SpeechRecognition not available',
    });
    return;
  }

  try {
    if (recognition) {
      recognition.abort();
    }

    recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      postToParent({ type: 'VOICE_STATE', nonce: activeNonce, payload: 'listening' });
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        postToParent({ type: 'VOICE_RESULT', nonce: activeNonce, payload: { interim, isFinal: false } });
      }
      if (final) {
        postToParent({ type: 'VOICE_RESULT', nonce: activeNonce, payload: { final, isFinal: true } });
      }
    };

    recognition.onerror = (event: any) => {
      postToParent({ type: 'VOICE_ERROR', nonce: activeNonce, payload: event.error });
    };

    recognition.onend = () => {
      postToParent({ type: 'VOICE_STATE', nonce: activeNonce, payload: 'idle' });
    };

    recognition.start();
  } catch (err: any) {
    postToParent({ type: 'VOICE_ERROR', nonce: activeNonce, payload: err?.message || 'Mic error' });
  }
}

function stopSpeechRecognition() {
  if (recognition) {
    try {
      recognition.stop();
    } catch {}
  }
}

function postToParent(msg: any) {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(msg, '*');
  }
}
