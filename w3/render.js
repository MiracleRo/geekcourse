
const images = require('images');
function render(viewport, element) {
  if (element.style) {
    let img = images(element.style.width, element.style.height)
    if (element.style["background-color"]) {
      let color = element.style["background-color"] || "rgb(0,0,0)"
      color.match(/rgb\((\d+),(\d+),(\d+)\)/)
      img.fill(Number(RegExg.$1), Number(RegExg.$2), Number(RegExg.$3))
      viewport.draw(img, element.style.left || 0, element.style.top)
    }
  }
  if (element.children) {
    for (let child of element.children) {
      render(viewport, child)
    }
  }
}


module.exports = render