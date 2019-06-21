var currentSlide = 0;
const maxSlides = 2;
var timer = setInterval(updateCarousels, 4000);
const element = document.getElementById("projectnublar")

function startCarousel() {
  setBackground();
  setIndicators();
}

function updateCarousels() {
  setBackground();
  updateIndicators();
}

function setBackground() {
    element.style.transition = "all .8s";
    swapImage();
}

function setIndicators() {
  var bubbles = "";
  var currentBubble = "";
  for (var i = 0; i < maxSlides; i++) {
    currentBubble = (i === currentSlide) ? "⬤" : "⭘";
    bubbles = bubbles + currentBubble;
  }
  var bubbleTextElement = document.createElement("div");
  bubbleTextElement.setAttribute('id', "bubbles");
  bubbleTextElement.appendChild(document.createTextNode(bubbles));
  element.appendChild(bubbleTextElement);
}

function swapImage() {
    unsetImage();
    setTimeout(setImage, 200);
}

function updateIndicators() {
  element.removeChild(document.getElementById("bubbles"));
  setIndicators();
}

function unsetImage() {
    element.classList.toggle("transparent");
}

function setImage() {
    switch (currentSlide) {
        case 0:
        //The trex image isnt great for all devices so above this width we swap it with an edited version
            if (document.documentElement.clientWidth > 960) {
                element.style.background = "url('images/pn/trex.jpg')";
            } else {
                element.style.background = "url('images/pn/trexm.jpg')";
            }
            break;
        case 1:
        //The dilo image isnt great for all devices so above this width we swap it with an edited version
            if (document.documentElement.clientWidth > 960) {
                element.style.background = "url('images/pn/dilo.png')";
            } else {
                element.style.background = "url('images/pn/dilom.png')";
            }
            break;
    }
    element.style.backgroundSize = "cover";
    element.classList.toggle("transparent");
    currentSlide++;
    currentSlide = (currentSlide === maxSlides) ? 0 : currentSlide;
}
