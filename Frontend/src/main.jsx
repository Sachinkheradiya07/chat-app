import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Performance API polyfill for performance.clearMarks
if (!window.performance) {
  window.performance = {}
}
if (!window.performance.clearMarks) {
  window.performance.clearMarks = () => {}
}
if (!window.performance.mark) {
  window.performance.mark = () => {}
}
if (!window.performance.measure) {
  window.performance.measure = () => {}
}
if (!window.performance.clearMeasures) {
  window.performance.clearMeasures = () => {}
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
