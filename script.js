const heroImages = document.querySelectorAll(".hero-product-image");
const indicators = document.querySelectorAll(".hero-indicators span");
const heroCategory = document.getElementById("hero-category");

const categories = [
  "Smartphones",
  "Laptops",
  "Televisions",
  "Audio",
  "Cameras",
  "Wearables"
];

let currentImage = 0;

setInterval(function () {

  heroImages[currentImage].classList.remove("active");
  indicators[currentImage].classList.remove("active");

  currentImage++;

  if (currentImage >= heroImages.length) {
    currentImage = 0;
  }

  heroImages[currentImage].classList.add("active");
  indicators[currentImage].classList.add("active");

  heroCategory.textContent = categories[currentImage];

}, 3000);


function addToCart(productName) {
  alert(productName + " added to cart");
}


function showMessage(message) {
  alert(message);
}