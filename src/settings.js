window.addEventListener('load', () => {
  const audio = new Audio('./public/sound/orbit-d0d-main-version-29627-02-39.mp3')
  audio.loop = true
  audio.volume = 0.5

  const startAudio = () => {
    audio.play().catch(() => {
    })
    document.removeEventListener('click', startAudio)
    document.removeEventListener('keydown', startAudio)
  }

  document.addEventListener('click', startAudio)
  document.addEventListener('keydown', startAudio)

  const settingsToggle = document.getElementById('settingsToggleIcon')
  const settingsPanel = document.getElementById('settingsPanel')
  const musicSlider = document.getElementById('musicSlider')
  const musicFill = document.getElementById('musicFill')
  const musicThumb = document.getElementById('musicThumb')
  const musicLabel = document.getElementById('musicLabel')
  const musicIcon = document.getElementById('musicIcon')

  let lastVolume = 0.5

  settingsToggle.addEventListener('click', (e) => {
    e.stopPropagation()
    settingsPanel.classList.toggle('visible')
  })

  document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
      settingsPanel.classList.remove('visible')
    }
  })

  function updateMusicVolume(value) {
    const percent = value
    audio.volume = value / 100
    musicFill.style.width = percent + '%'
    musicThumb.style.left = `calc(${percent}% - 7px)`
    musicLabel.textContent = Math.round(percent) + '%'

    if (value === 0) {
      musicIcon.classList.add('muted')
    } else {
      musicIcon.classList.remove('muted')
    }
  }

  // Music slider input handler
  musicSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value)
    updateMusicVolume(value)
    if (value > 0) lastVolume = value / 100
  })

  musicIcon.addEventListener('click', () => {
    if (audio.volume > 0) {
      lastVolume = audio.volume
      musicSlider.value = 0
      updateMusicVolume(0)
    } else {
      const restored = Math.round(lastVolume * 100)
      musicSlider.value = restored
      updateMusicVolume(restored)
    }
  })
})

//================ Prevent Spacebar and arrow keys from scrolling the page
window.addEventListener('keydown', (e) => {
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault()
  }
})
