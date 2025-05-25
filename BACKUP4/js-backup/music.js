let player;
let isPlaying = localStorage.getItem('musicPlaying') === 'true';

// Tambahkan event listener untuk sebelum unload halaman
window.addEventListener('beforeunload', function() {
    if (player && player.pauseVideo) {
        player.pauseVideo();
    }
});

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '0',
        width: '0',
        videoId: 'vqEC-ciNqBc',
        playerVars: {
            'autoplay': isPlaying ? 1 : 0,
            'controls': 0,
            'disablekb': 1,
            'enablejsapi': 1,
            'loop': 1,
            'playlist': 'vqEC-ciNqBc'
        },
        events: {
            'onStateChange': onPlayerStateChange,
            'onReady': onPlayerReady
        }
    });
}

function onPlayerReady(event) {
    if (isPlaying) {
        event.target.playVideo();
        document.querySelectorAll('.music-btn').forEach(btn => btn.disabled = false);
        document.getElementById('music-status').textContent = 'On';
    } else {
        document.querySelectorAll('.music-btn').forEach(btn => btn.disabled = false);
        document.getElementById('music-status').textContent = 'Off';
    }
}

function toggleMusic() {
    if (!player) return; // Cegah error jika player belum siap
    if (!isPlaying) {
        player.playVideo();
        isPlaying = true;
        document.getElementById('music-status').textContent = 'On';
    } else {
        player.pauseVideo();
        isPlaying = false;
        document.getElementById('music-status').textContent = 'Off';
    }
    localStorage.setItem('musicPlaying', isPlaying);
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        player.playVideo();
    }
} 