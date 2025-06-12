// Menu mobile toggle
const btn = document.getElementById("menu-btn")
const mobileMenu = document.getElementById("mobile-menu")

btn.addEventListener("click", () => {
  mobileMenu.classList.toggle("hidden")

  // Animar o botão do menu
  const spans = btn.querySelectorAll("span")
  if (!mobileMenu.classList.contains("hidden")) {
    // Transformar em X quando o menu está aberto
    spans[0].style.transform = "rotate(45deg) translate(5px, 5px)"
    spans[1].style.opacity = "0"
    spans[2].style.transform = "rotate(-45deg) translate(5px, -5px)"
  } else {
    // Voltar ao normal quando o menu está fechado
    spans[0].style.transform = "none"
    spans[1].style.opacity = "1"
    spans[2].style.transform = "none"
  }
})

// Fechar o menu mobile ao clicar em um link
const mobileLinks = mobileMenu.querySelectorAll("a")
mobileLinks.forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.add("hidden")

    // Resetar o botão do menu
    const spans = btn.querySelectorAll("span")
    spans[0].style.transform = "none"
    spans[1].style.opacity = "1"
    spans[2].style.transform = "none"
  })
})

// Scroll suave ao clicar no logo
document.getElementById("logo").addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  })
})

// Ajustar layout em dispositivos móveis
function checkScreenSize() {
  const formContainer = document.querySelector(".form-container")
  if (window.innerWidth <= 767) {
    formContainer.style.marginTop = "20px"
  } else if (window.innerWidth <= 1023) {
    formContainer.style.marginTop = "-100px"
  } else {
    formContainer.style.marginTop = "-145px"
  }
}

// Verificar o tamanho da tela ao carregar e redimensionar
window.addEventListener("load", checkScreenSize)
window.addEventListener("resize", checkScreenSize)
