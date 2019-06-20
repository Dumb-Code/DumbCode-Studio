var currentSlide = 0;
const maxSlides = 4;
var timer = setInterval(setBackground, 4000);
var numSlides = document.getElementsByClassName('slide').size;
const element = document.getElementById("projectnublar")

function setImage() {
    switch (currentSlide) {
        case 0:
            if (document.documentElement.clientWidth > 960) {
                element.style.background = "url('images/pn/trex.jpg')";
            } else {
                element.style.background = "url('images/pn/trexm.jpg')";
            }
            break;
        case 1:
            if (document.documentElement.clientWidth > 960) {
                element.style.background = "url('images/dl/code.png')";
            } else {
                element.style.background = "url('images/dl/code.png')";
            }
            break;
        case 2:
            if (document.documentElement.clientWidth > 960) {
                element.style.background = "url('images/pn/trex.jpg')";
            } else {
                element.style.background = "url('images/pn/trexm.jpg')";
            }
            break;
        case 3:
            if (document.documentElement.clientWidth > 960) {
                element.style.background = "url('images/dl/code.png')";
            } else {
                element.style.background = "url('images/dl/code.png')";
            }
            break;
    }
    element.style.backgroundSize = "cover";
    element.classList.toggle("transparent");
    currentSlide++;
    currentSlide = (currentSlide === maxSlides) ? 0 : currentSlide;
}

function unsetImage() {
    element.classList.toggle("transparent");
}

function swapImage() {
    unsetImage();
    setTimeout(setImage, 200);
}

function setBackground() {
    element.style.transition = "all .8s";
    swapImage();
}
