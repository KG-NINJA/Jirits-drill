document.addEventListener('DOMContentLoaded', () => {
  // 自律訓練法ガイドの文例（日本語・英語）
  const guideStepsJa = [
    { text: 'これから自律訓練法を始めます。楽な姿勢で座ってください。', wait: 3000 },
    { text: '目を閉じて、深呼吸をしましょう。', wait: 4000 },
    { text: '気持ちがとても落ち着いている、と心の中で繰り返します。', wait: 7000 },
    { text: '両腕が重たい、と心の中で繰り返します。', wait: 12000 },
    { text: '両腕が温かい、と心の中で繰り返します。', wait: 12000 },
    { text: '心臓が静かに打っている、と心の中で繰り返します。', wait: 9000 },
    { text: '楽に呼吸している、と心の中で繰り返します。', wait: 9000 },
    { text: 'おなかが温かい、と心の中で繰り返します。', wait: 9000 },
    { text: 'ひたいが涼しい、と心の中で繰り返します。', wait: 9000 },
    { text: 'ゆっくりと意識を戻します。手足を軽く動かし、深呼吸して目を開けましょう。', wait: 6000 },
    { text: 'お疲れさまでした。', wait: 2000 }
  ];
  const guideStepsEn = [
    { text: 'We will now begin autogenic training. Sit comfortably.', wait: 3000 },
    { text: 'Close your eyes and take a deep breath.', wait: 4000 },
    { text: 'Repeat in your mind: I feel calm and relaxed.', wait: 7000 },
    { text: 'Repeat: My arms feel heavy.', wait: 12000 },
    { text: 'Repeat: My arms feel warm.', wait: 12000 },
    { text: 'Repeat: My heartbeat is calm and regular.', wait: 9000 },
    { text: 'Repeat: My breathing is calm and easy.', wait: 9000 },
    { text: 'Repeat: My abdomen feels warm.', wait: 9000 },
    { text: 'Repeat: My forehead feels cool.', wait: 9000 },
    { text: 'Slowly return your awareness. Move your hands and feet, take a deep breath, and open your eyes.', wait: 6000 },
    { text: 'Good job. The session is complete.', wait: 2000 }
  ];
  let guideSteps = guideStepsJa;


  // UI取得
  const guideText = document.getElementById('guide-text');
  const progress = document.getElementById('progress');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const resetBtn = document.getElementById('reset-btn');
  const langSelect = document.getElementById('lang-select');
  const voiceSelect = document.getElementById('voice-select');

  // 状態管理
  let currentStep = 0;
  let isRunning = false;
  let isPaused = false;
  let timer = null;
  let synth = window.speechSynthesis;
  let utter = null;
  let voices = [];
  let currentVoice = null;

  // BGMオブジェクト
  const bgmAudio = document.getElementById('bgm-audio');
  const bgmUpload = document.getElementById('bgm-upload');
  const bgmFilename = document.getElementById('bgm-filename');
  const bgmSelectBtn = document.getElementById('bgm-select-btn');
  const bgmVolume = document.getElementById('bgm-volume');

  // ボタン押下でファイル選択ダイアログを開く
  bgmSelectBtn.addEventListener('click', () => {
    bgmUpload.click();
  });

  // ユーザーが音楽ファイルを選択したらBGMを差し替え
  bgmUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) {
      const url = URL.createObjectURL(file);
      bgmAudio.src = url;
      bgmFilename.textContent = file.name;
      stopBgm();
    } else {
      bgmAudio.src = 'bgm.mp3';
      bgmFilename.textContent = '';
      stopBgm();
    }
  });

  // 現在のBGM音量（0.0〜1.0）
  let userBgmVolume = 1.0;
  // スライダーでBGM音量調整
  bgmVolume.addEventListener('input', () => {
    userBgmVolume = bgmVolume.value / 100;
    bgmAudio.volume = userBgmVolume;
  });

  function playBgm() {
    if(bgmAudio.paused) {
      bgmAudio.currentTime = 0;
      bgmAudio.volume = userBgmVolume;
      bgmAudio.play();
    } else {
      bgmAudio.volume = userBgmVolume;
    }
  }
  function pauseBgm() {
    if(!bgmAudio.paused) bgmAudio.pause();
  }
  function stopBgm() {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
  }


  // 音声ガイドの再生
  let currentLang = 'ja-JP';
  function speak(text, onend) {
    if(!('speechSynthesis' in window)) {
      guideText.textContent = 'この端末は音声ガイドに対応していません。';
      return;
    }
    if(synth.speaking) synth.cancel();
    utter = new SpeechSynthesisUtterance(text);
    utter.lang = currentLang;
    utter.rate = 0.7; // ゆっくり読み上げでリラックス効果UP
    if(currentVoice) utter.voice = currentVoice;
    utter.onend = onend;
    synth.speak(utter);
  }

  // 音声リストをvoice-selectに反映
  function populateVoices() {
    voices = synth.getVoices();
    // 選択中の言語に合うvoiceのみ表示
    const filtered = voices.filter(v => v.lang === currentLang);
    voiceSelect.innerHTML = '';
    filtered.forEach((voice, i) => {
      const opt = document.createElement('option');
      opt.value = voice.name;
      opt.textContent = voice.name + (voice.localService ? '（ローカル）' : '') + (voice.default ? '（デフォルト）' : '');
      voiceSelect.appendChild(opt);
    });
    // Harukaをデフォルトに（日本語のみ）
    let defaultVoice = filtered[0] || null;
    if(currentLang === 'ja-JP') {
      const haruka = filtered.find(v => v.name.includes('Haruka'));
      if(haruka) defaultVoice = haruka;
    }
    if(defaultVoice) {
      currentVoice = defaultVoice;
      voiceSelect.value = defaultVoice.name;
    } else {
      currentVoice = null;
    }
  }

  // voice選択時にcurrentVoiceを更新
  voiceSelect.addEventListener('change', () => {
    const selected = voices.find(v => v.name === voiceSelect.value && v.lang === currentLang);
    if(selected) currentVoice = selected;
  });

  // 音声リスト初期化（非同期のため2回呼ぶ）
  if(typeof speechSynthesis !== 'undefined') {
    synth.onvoiceschanged = populateVoices;
    populateVoices();
  }


  // ステップ進行
  function runStep(idx) {
    if(idx >= guideSteps.length) {
      guideText.textContent = 'ガイド終了です。お疲れさまでした。';
      progress.textContent = '';
      isRunning = false;
      stopBgm();
      updateButtons();
      return;
    }
    currentStep = idx;
    guideText.textContent = guideSteps[idx].text;
    progress.textContent = `ステップ ${idx+1} / ${guideSteps.length}`;
    // BGM音量は常に一定（ユーザー設定）
    playBgm();
    speak(guideSteps[idx].text, () => {
      if(isPaused) return;
      playBgm();
      timer = setTimeout(() => {
        runStep(idx+1);
      }, guideSteps[idx].wait);
    });
  }

  // ボタン状態更新
  function updateButtons() {
    startBtn.disabled = isRunning;
    pauseBtn.disabled = !isRunning || isPaused;
    resumeBtn.disabled = !isPaused;
    resetBtn.disabled = !isRunning && !isPaused;
  }

  // ボタンイベント
  startBtn.onclick = () => {
    if(isRunning || isPaused) return;
    isRunning = true;
    isPaused = false;
    currentStep = 0;
    runStep(0);
    updateButtons();
  };
  pauseBtn.onclick = () => {
    if(!isRunning || isPaused) return;
    isPaused = true;
    if(timer) clearTimeout(timer);
    if(synth.speaking) synth.cancel();
    guideText.textContent += '\n（一時停止中）';
    progress.textContent = `ステップ ${currentStep+1} / ${guideSteps.length}`;
    updateButtons();
  };
  resumeBtn.onclick = () => {
    if(!isPaused) return;
    isPaused = false;
    runStep(currentStep);
    updateButtons();
  };
  resetBtn.onclick = () => {
    isRunning = false;
    isPaused = false;
    if(timer) clearTimeout(timer);
    if(synth.speaking) synth.cancel();
    stopBgm();
    currentStep = 0;
    guideText.textContent = guideSteps[0].text;
    progress.textContent = '';
    updateButtons();
  };

  // 言語切り替え
  langSelect.addEventListener('change', () => {
    if(isRunning || isPaused) return; // 実行中は切り替え不可
    currentLang = langSelect.value;
    guideSteps = (currentLang === 'ja-JP') ? guideStepsJa : guideStepsEn;
    guideText.textContent = guideSteps[0].text;
    progress.textContent = '';
    populateVoices();
  });

  // 初期化
  guideText.textContent = guideSteps[0].text;
  progress.textContent = '';
  updateButtons();
});
