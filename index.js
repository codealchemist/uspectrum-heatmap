const colorScale = require('./color-scale')

window.colors = {}

module.exports = class USpectrumWave {
  constructor ({ context, buffer, source, canvas } = {}) {
    if (typeof canvas === 'string') canvas = document.getElementById(canvas)
    if (!canvas) {
      canvas = document.createElement('canvas')
      document.body.appendChild(canvas)
    }
    this.$canvas = canvas
    this.canvasContext = this.$canvas.getContext('2d')
    this.fftSize = 512 // 2048
    this.minDb = -90
    this.maxDb = -10
    this.smoothing = 0.82
    this.maxValue = 0

    // 1 = use full width, whic is really costly if you go fullscreen!
    // Higher ratio will render a smaller sample, which optimizes performance.
    this.renderRatio = 16

    this.pointWidth = 1
    this.pointHeight = 1
    this.audioMatrix = []

    this.resizeThrottle = 400 // ms.
    this.setResizer()
    this.setSize()

    if (context && buffer && source) this.init({ context, buffer, source })
  }

  setSize () {
    this.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    this.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    this.$canvas.width = this.width
    this.$canvas.height = this.height

    this.renderWidth = this.width / this.renderRatio
    for (var i = 0; i < this.renderWidth; i++) {
      this.audioMatrix[i] = new Uint8Array(this.fftSize)
    }

    const xScale = this.width / this.renderWidth
    const yScale = (this.height / this.fftSize) * 2
    this.canvasContext.scale(xScale, yScale)
  }

  setResizer () {
    let resizing = false

    window.addEventListener('resize', () => {
      if (resizing) return
      resizing = true

      setTimeout(() => {
        this.setSize()
        resizing = false
      }, this.resizeThrottle)
    })
  }

  init ({ context, buffer, source }) {
    this.analyser = context.createAnalyser()
    this.analyser.fftSize = this.fftSize
    this.analyser.minDecibels = this.minDb
    this.analyser.maxDecibels = this.maxDb
    this.analyser.smoothingTimeConstant = this.smoothing
    this.analyser.buffer = buffer
    source.connect(this.analyser)

    this.bufferLength = this.analyser.frequencyBinCount
    this.maxFreq = this.bufferLength

    return this
  }

  setFftSize (size) {
    this.fftSize = size
    return this
  }

  setMinDb (db) {
    this.minDb = db
    return this
  }

  setMaxDb (db) {
    this.maxDb = db
    return this
  }

  setSmoothing (smoothing) {
    this.smoothing = smoothing
  }

  render () {
    const buffer = this.audioMatrix.shift()
    this.analyser.getByteFrequencyData(buffer)
    this.audioMatrix.push(buffer)

    for (let x = 0; x < this.renderWidth; x++) {
      for (let y = 0; y < this.maxFreq; y++) {
        const dataPoint = this.audioMatrix[x][this.maxFreq - y]
        if (dataPoint > this.maxValue) this.maxValue = dataPoint
        const color = colorScale[dataPoint]
        this.canvasContext.fillStyle = color
        window.colors[dataPoint] = color
        this.canvasContext.fillRect(x, y, this.pointWidth, this.pointHeight)
      }
    }

    window.requestAnimationFrame(() => this.render())
  }
}
