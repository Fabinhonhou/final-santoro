// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');

    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileNav.style.display = mobileNav.style.display === 'block' ? 'none' : 'block';
            
            // Animate hamburger menu
            const spans = mobileMenuToggle.querySelectorAll('span');
            spans.forEach(span => span.classList.toggle('active'));
        });

        // Close mobile menu when clicking on a link
        const mobileNavLinks = mobileNav.querySelectorAll('a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileNav.style.display = 'none';
                const spans = mobileMenuToggle.querySelectorAll('span');
                spans.forEach(span => span.classList.remove('active'));
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenuToggle.contains(event.target) && !mobileNav.contains(event.target)) {
                mobileNav.style.display = 'none';
                const spans = mobileMenuToggle.querySelectorAll('span');
                spans.forEach(span => span.classList.remove('active'));
            }
        });
    }
});

// Smooth Scrolling for Navigation Links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Form Validation and Submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('#contato form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#e74c3c';
                } else {
                    field.style.borderColor = '#640E0E';
                }
            });
            
            if (isValid) {
                // Simulate form submission
                const button = form.querySelector('button');
                const originalText = button.textContent;
                
                button.textContent = 'Enviando...';
                button.disabled = true;
                
                setTimeout(() => {
                    alert('Reserva enviada com sucesso! Entraremos em contato em breve.');
                    form.reset();
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            } else {
                alert('Por favor, preencha todos os campos obrigatórios.');
            }
        });
    }
});

// Intersection Observer for Animations
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1, // O item será considerado visível quando 10% dele estiver na tela
        rootMargin: '0px 0px -30px 0px' // Dispara 50px antes do elemento chegar ao fim da viewport
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Quando o elemento entra na viewport, aplicamos a animação
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                // Remove a transição e a opacidade/transform base para evitar interferências futuras e otimizar
                entry.target.style.transition = '';
                entry.target.style.opacity = '';
                entry.target.style.transform = '';

                // Para performance: Pare de observar o elemento depois que ele animou
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach((item, index) => {
        // Definir o estado inicial para a animação (antes de aparecer na tela)
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';

        // Definir a transição apenas para os itens observados
        // Reduzindo ou removendo o delay incremental:
        // Opção 1: Sem delay incremental (aparecem quase ao mesmo tempo)
        // item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

        // Opção 2: Com um delay incremental muito menor (se você ainda quer um efeito de cascata sutil)
        item.style.transition = `opacity 0.6s ease ${index * 0.05}s, transform 0.6s ease ${index * 0.05}s`;
        // Ou ainda menor:
        // item.style.transition = `opacity 0.2s ease ${index * 0.03}s, transform 0.2s ease ${index * 0.03}s`;

        observer.observe(item);
    });
});
// Add scroll effect to header
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            header.style.backgroundColor = 'rgba(255, 245, 240, 0.95)';
        } else {
            header.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            header.style.backgroundColor = '#fff5f0';
        }
    });
});

// Date input minimum date (today)
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('data');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
});

// Menu item click handlers for future modal implementation
document.addEventListener('DOMContentLoaded', function() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const itemName = this.querySelector('h3').textContent;
            console.log(`Clicked on: ${itemName}`);
            // Future: Open modal with detailed information
        });
    });
});
document.getElementById('logo').addEventListener('click', function () {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // Faz a rolagem suave
  });
});