const HIGH_SCORE_KEY = 'starkeeper_high_score'

export const getHighScore = () => parseInt(localStorage.getItem(HIGH_SCORE_KEY)) || 0

export const checkAndUpdateHighScore = (score) => {
  const currentHigh = getHighScore()
  if (score > currentHigh) {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString())
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

// ==== FOR LATER

// export const setNewHighScore = (value) => {
//   isNewHighScore = value
// }
//
// export const checkForNewHighScore = (round) => {
//   if (checkAndUpdateHighScore(round)) {
//     isNewHighScore = true
//   }
// }

// let isNewHighScore = false
// export const getIsNewHighScore = () => isNewHighScore
//
// export const clearNewHighScoreFlag = () => {
//   isNewHighScore = false
// }
//
