
/* =========================
   ФУНКЦИЯ БУРГЕР-МЕНЮ
   ========================= */

function mobileMenu() {

    // ищем первый элемент <navbar> на странице
    var navbar = document.getElementsByTagName("navbar")[0];

    // если navbar не найден — останавливаем функцию
    if (!navbar) {
        return;
    }

    // добавляет или убирает класс "mobile"
    // toggle = переключатель (если есть → убирает, если нет → добавляет)
    navbar.classList.toggle("mobile");
}


/* =========================
   КОГДА СТРАНИЦА ЗАГРУЗИЛАСЬ
   ========================= */

document.addEventListener("DOMContentLoaded", function () {

    // снова ищем navbar после загрузки страницы
    var navbar = document.getElementsByTagName("navbar")[0];
    initAudioWidget();

    // если меню не найдено — ничего не делаем
    if (!navbar) {
        return;
    }

    // получаем все ссылки внутри меню
    var links = navbar.getElementsByTagName("a");

    // проходим по всем ссылкам
    for (var i = 0; i < links.length; i++) {

        // добавляем событие "клик" на каждую ссылку
        links[i].addEventListener("click", function () {

            // если экран маленький (телефон)
            if (window.innerWidth <= 800) {

                // закрываем мобильное меню после клика
                navbar.classList.remove("mobile");
            }
        });
    }

    /* =========================
       ОБНОВЛЕНИЕ ПРИ ИЗМЕНЕНИИ РАЗМЕРА ЭКРАНА
       ========================= */

    window.addEventListener("resize", function () {

        // если экран стал больше телефона
        if (window.innerWidth > 800) {

            // убираем мобильное меню
            navbar.classList.remove("mobile");
        }
    });
});


/* =========================
   МУЗЫКАЛЬНЫЙ ПЛЕЕР
   ========================= */

var audioContext = null;
var masterGain = null;
var melodyTimer = null;
var melodyStep = 0;
var musicPlaying = false;
var musicMuted = false;
var musicVolume = 0.3;

var jazzMelody = [
    { freq: 261.63, duration: 0.22 },
    { freq: 329.63, duration: 0.22 },
    { freq: 392.0, duration: 0.32 },
    { freq: 466.16, duration: 0.2 },
    { freq: 523.25, duration: 0.38 },
    { freq: 392.0, duration: 0.22 },
    { freq: 311.13, duration: 0.22 },
    { freq: 349.23, duration: 0.32 },
    { freq: 440.0, duration: 0.26 },
    { freq: 523.25, duration: 0.42 },
    { freq: 587.33, duration: 0.24 },
    { freq: 493.88, duration: 0.34 }
];

function initAudioWidget() {
    if (document.getElementById("audio-widget")) {
        return;
    }

    var savedVolume = localStorage.getItem("balti-volume");
    var savedMuted = localStorage.getItem("balti-muted");

    if (savedVolume !== null) {
        musicVolume = Math.min(Math.max(parseFloat(savedVolume), 0), 1);
    }

    if (savedMuted === "true") {
        musicMuted = true;
    }

    var widget = document.createElement("div");
    widget.id = "audio-widget";
    widget.className = "audio-widget";
    widget.innerHTML =
        '<div class="audio-widget-header">' +
            '<div class="audio-widget-title">Jazz FM</div>' +
            '<button id="music-hide" type="button" class="audio-hide-btn" aria-label="Скрыть плеер">Скрыть</button>' +
        '</div>' +
        '<div class="audio-widget-controls">' +
            '<button id="music-toggle" type="button" class="audio-btn">Включить</button>' +
            '<button id="music-mute" type="button" class="audio-btn audio-btn-secondary">Без звука</button>' +
        '</div>' +
        '<label class="audio-volume-label" for="music-volume">Громкость</label>' +
        '<input id="music-volume" class="audio-volume" type="range" min="0" max="100" value="' + Math.round(musicVolume * 100) + '">' +
        '<div id="music-status" class="audio-status">Музыка выключена</div>' +
        '<button id="music-show" type="button" class="audio-widget-reopen" aria-label="Показать плеер">Jazz</button>';

    document.body.appendChild(widget);

    document.getElementById("music-toggle").addEventListener("click", toggleMusicPlayback);
    document.getElementById("music-mute").addEventListener("click", toggleMusicMute);
    document.getElementById("music-volume").addEventListener("input", changeMusicVolume);
    document.getElementById("music-hide").addEventListener("click", hideAudioWidget);
    document.getElementById("music-show").addEventListener("click", showAudioWidget);

    updateAudioWidgetState();
}

function ensureAudioContext() {
    if (audioContext) {
        return;
    }

    var AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        return;
    }

    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    applyVolume();
}

function toggleMusicPlayback() {
    if (musicPlaying) {
        stopMelody();
    } else {
        startMelody();
    }
}

function toggleMusicMute() {
    musicMuted = !musicMuted;
    localStorage.setItem("balti-muted", musicMuted);
    applyVolume();
    updateAudioWidgetState();
}

function changeMusicVolume(event) {
    musicVolume = Number(event.target.value) / 100;
    localStorage.setItem("balti-volume", musicVolume);
    applyVolume();
    updateAudioWidgetState();
}

function applyVolume() {
    if (!masterGain || !audioContext) {
        return;
    }

    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setValueAtTime(musicMuted ? 0 : musicVolume, audioContext.currentTime);
}

function startMelody() {
    ensureAudioContext();

    if (!audioContext) {
        return;
    }

    audioContext.resume();
    musicPlaying = true;
    playMelodyStep();
    updateAudioWidgetState();
}

function stopMelody() {
    musicPlaying = false;

    if (melodyTimer) {
        clearTimeout(melodyTimer);
        melodyTimer = null;
    }

    updateAudioWidgetState();
}

function playMelodyStep() {
    if (!musicPlaying || !audioContext || !masterGain) {
        return;
    }

    var note = jazzMelody[melodyStep];
    melodyStep = (melodyStep + 1) % jazzMelody.length;

    if (note && note.freq) {
        playJazzTone(note.freq, note.duration);
    }

    melodyTimer = setTimeout(playMelodyStep, ((note.duration || 0.28) + 0.09) * 1000);
}

function playJazzTone(frequency, duration) {
    var oscillator = audioContext.createOscillator();
    var noteGain = audioContext.createGain();
    var startTime = audioContext.currentTime;
    var endTime = startTime + duration;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, startTime);

    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(0.22, startTime + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(noteGain);
    noteGain.connect(masterGain);

    oscillator.start(startTime);
    oscillator.stop(endTime + 0.02);
}

function updateAudioWidgetState() {
    var toggleButton = document.getElementById("music-toggle");
    var muteButton = document.getElementById("music-mute");
    var status = document.getElementById("music-status");

    if (!toggleButton || !muteButton || !status) {
        return;
    }

    toggleButton.textContent = musicPlaying ? "Выключить" : "Включить";
    muteButton.textContent = musicMuted ? "Со звуком" : "Без звука";

    if (!musicPlaying) {
        status.textContent = "Джаз выключен";
        return;
    }

    if (musicMuted || musicVolume === 0) {
        status.textContent = "Джаз играет без звука";
        return;
    }

    status.textContent = "Джаз играет";
}

function hideAudioWidget() {
    var widget = document.getElementById("audio-widget");

    if (!widget) {
        return;
    }

    widget.classList.add("audio-widget-hidden");
}

function showAudioWidget() {
    var widget = document.getElementById("audio-widget");

    if (!widget) {
        return;
    }

    widget.classList.remove("audio-widget-hidden");
}
