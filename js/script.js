document.addEventListener("DOMContentLoaded"), function () {
    const navbar = document.getElementById("navbar");
    const mobileMenu = document.getElementById('mobile-menu');
    const mainNav = document.querySelector('.main-nav');
    const logo = document.getElementById('logo');

    // ... (código existente da navbar, menu hambúrguer, rolagem da logo) ...

    // Função para mostrar/esconder a navbar ao rolar (opcional se a navbar é sticky)
    let navbarRevelada = false;
    window.addEventListener("scroll", function () {
        if (!navbarRevelada && window.scrollY > 50) {
            navbar.classList.add("visible");
            navbarRevelada = true;
        } else if (navbarRevelada && window.scrollY <= 50) {
            // Opcional: remover a classe se rolar de volta para o topo
            // navbar.classList.remove("visible");
            // navbarRevelada = false;
        }
    });

    // Toggle para o menu hambúrguer
    mobileMenu.addEventListener('click', function () {
        mobileMenu.classList.toggle('active');
        mainNav.classList.toggle('active');
    });

    // Fechar o menu ao clicar em um link (para melhor UX em mobile)
    mainNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (mainNav.classList.contains('active')) { // Verifica se o menu está aberto
                mobileMenu.classList.remove('active');
                mainNav.classList.remove('active');
            }
        });
    });

    // Rolar para o topo ao clicar na logo
    logo.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

const carrossel = document.querySelector('.carrossel .lista');

let isDown = false;
let startX;
let scrollLeft;

carrossel.addEventListener('mousedown', (e) => {
  isDown = true;
  carrossel.classList.add('active');
  startX = e.pageX - carrossel.offsetLeft;
  scrollLeft = carrossel.scrollLeft;
});

carrossel.addEventListener('mouseleave', () => {
  isDown = false;
  carrossel.classList.remove('active');
});

carrossel.addEventListener('mouseup', () => {
  isDown = false;
  carrossel.classList.remove('active');
});

carrossel.addEventListener('mousemove', (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - carrossel.offsetLeft;
  const walk = (x - startX) * 2;
  carrossel.scrollLeft = scrollLeft - walk;
})};
