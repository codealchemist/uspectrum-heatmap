const chroma = require('chroma-js')

function genColorScale () {
  const customChroma = chroma.scale(['#000000', '#0B16B5', '#FFF782', '#EB1250']).domain([0, 120, 204, 255])

  const colors = []
  for (let i = 0; i <= 300; i++) {
    colors.push(customChroma(i).hex())
  }

  return colors
}

const colorScale = genColorScale()
module.exports = colorScale
