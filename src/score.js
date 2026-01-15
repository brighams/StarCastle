
const HIGH_SCORE_KEY = 'starkeeper_high_score'

let isNewHighScore = false

export const getHighScore = () => parseInt(localStorage.getItem(HIGH_SCORE_KEY)) || 0

export const getIsNewHighScore = () => isNewHighScore

export const clearNewHighScoreFlag = () => {
  isNewHighScore = false
}

export const checkAndUpdateHighScore = (rounds) => {
  const currentHigh = getHighScore()
  if (rounds > currentHigh) {
    localStorage.setItem(HIGH_SCORE_KEY, rounds.toString())
    isNewHighScore = true
    return true
  }
  return false
}

export const resetHighScore = () => {
  localStorage.removeItem(HIGH_SCORE_KEY)
}

// Set up the reset link handler
document.getElementById('resetHighScore')?.addEventListener('click', (e) => {
  e.preventDefault()
  resetHighScore()
})
