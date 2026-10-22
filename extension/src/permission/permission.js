const btn = document.getElementById('grant-btn');
const status = document.getElementById('status');

btn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    btn.style.display = 'none';
    status.style.display = 'block';
    setTimeout(() => {
      window.close();
    }, 1200);
  } catch (err) {
    alert('Microphone access was denied or unavailable. Please click Allow in your browser bar.');
  }
});
