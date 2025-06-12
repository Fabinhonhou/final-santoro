// Main JavaScript file for Santoro's Restaurant
console.log("🍝 Santoro's Restaurant - Main JS loaded")

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM loaded, initializing main.js")

  // Initialize mobile menu
  initializeMobileMenu()

  // Initialize smooth scrolling
  initializeSmoothScrolling()

  // Initialize form validations
  initializeFormValidations()

  // Initialize animations
  initializeAnimations()

  // Check authentication status
  updateNavigationBasedOnAuth()
})

// Mobile Menu Functionality
function initializeMobileMenu() {
  const mobileMenuBtn = document.getElementById("menu-btn")
  const mobileMenu = document.getElementById("mobile-menu")
  const hamburger = document.querySelector(".hamburger")
  const navMenu = document.querySelector(".nav-menu")

  // Handle mobile menu button (if exists)
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", function () {
      mobileMenu.classList.toggle("hidden")
      this.classList.toggle("active")
    })
  }

  // Handle hamburger menu (if exists)
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active")
      navMenu.classList.toggle("active")
    })

    // Close menu when clicking on a link
    const navLinks = navMenu.querySelectorAll("a")
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active")
        navMenu.classList.remove("active")
      })
    })
  }

  // Close mobile menu when clicking outside
  document.addEventListener("click", (e) => {
    if (mobileMenu && !mobileMenuBtn?.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.add("hidden")
      mobileMenuBtn?.classList.remove("active")
    }

    if (navMenu && !hamburger?.contains(e.target) && !navMenu.contains(e.target)) {
      hamburger?.classList.remove("active")
      navMenu?.classList.remove("active")
    }
  })
}

// Smooth Scrolling for anchor links
function initializeSmoothScrolling() {
  const links = document.querySelectorAll('a[href^="#"]')

  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href")

      // Skip if it's just "#"
      if (href === "#") return

      const target = document.querySelector(href)

      if (target) {
        e.preventDefault()

        const headerHeight = document.querySelector("header")?.offsetHeight || 80
        const targetPosition = target.offsetTop - headerHeight

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        })
      }
    })
  })
}

// Form Validations
function initializeFormValidations() {
  const forms = document.querySelectorAll("form")

  forms.forEach((form) => {
    // Add real-time validation
    const inputs = form.querySelectorAll("input, textarea, select")

    inputs.forEach((input) => {
      // Validate on blur
      input.addEventListener("blur", function () {
        validateField(this)
      })

      // Clear validation on focus
      input.addEventListener("focus", function () {
        clearFieldValidation(this)
      })
    })

    // Enhanced form submission
    form.addEventListener("submit", function (e) {
      if (!validateForm(this)) {
        e.preventDefault()
      }
    })
  })
}

// Field validation
function validateField(field) {
  const value = field.value.trim()
  const type = field.type
  const required = field.hasAttribute("required")

  // Clear previous validation
  clearFieldValidation(field)

  // Check if required field is empty
  if (required && !value) {
    showFieldError(field, "Este campo é obrigatório")
    return false
  }

  // Email validation
  if (type === "email" && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      showFieldError(field, "Por favor, insira um email válido")
      return false
    }
  }

  // Phone validation (basic)
  if (type === "tel" && value) {
    const phoneRegex = /^[\d\s\-$$$$+]{10,}$/
    if (!phoneRegex.test(value)) {
      showFieldError(field, "Por favor, insira um telefone válido")
      return false
    }
  }

  // Password validation
  if (type === "password" && value && value.length < 8) {
    showFieldError(field, "A senha deve ter pelo menos 8 caracteres")
    return false
  }

  return true
}

// Show field error
function showFieldError(field, message) {
  field.classList.add("error")

  // Remove existing error message
  const existingError = field.parentNode.querySelector(".field-error")
  if (existingError) {
    existingError.remove()
  }

  // Add error message
  const errorDiv = document.createElement("div")
  errorDiv.className = "field-error"
  errorDiv.textContent = message
  errorDiv.style.color = "#640E0E"
  errorDiv.style.fontSize = "0.875rem"
  errorDiv.style.marginTop = "0.25rem"

  field.parentNode.appendChild(errorDiv)
}

// Clear field validation
function clearFieldValidation(field) {
  field.classList.remove("error")

  const errorDiv = field.parentNode.querySelector(".field-error")
  if (errorDiv) {
    errorDiv.remove()
  }
}

// Validate entire form
function validateForm(form) {
  const fields = form.querySelectorAll("input, textarea, select")
  let isValid = true

  fields.forEach((field) => {
    if (!validateField(field)) {
      isValid = false
    }
  })

  return isValid
}

// Initialize animations and scroll effects
function initializeAnimations() {
  // Fade in animation for elements
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0)"
      }
    })
  }, observerOptions)

  // Observe elements with fade-in class
  const fadeElements = document.querySelectorAll(".fade-in, .dish-card, .testimonial-card")
  fadeElements.forEach((el) => {
    el.style.opacity = "0"
    el.style.transform = "translateY(20px)"
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease"
    observer.observe(el)
  })
}

// Update navigation based on authentication status
function updateNavigationBasedOnAuth() {
  // Esta função agora apenas verifica se auth.js está carregado
  // A lógica principal está no auth.js para evitar duplicação

  if (window.auth && typeof window.auth.updateNavigation === "function") {
    // Se auth.js está carregado, usar sua função
    return
  }

  // Fallback básico se auth.js não estiver carregado
  const session = localStorage.getItem("userSession")
  const isLoggedIn = session !== null

  const loginLinks = document.querySelectorAll('a[href*="login"]')
  const registerLinks = document.querySelectorAll('a[href*="registro"]')

  if (isLoggedIn) {
    loginLinks.forEach((link) => (link.style.display = "none"))
    registerLinks.forEach((link) => (link.style.display = "none"))
  } else {
    loginLinks.forEach((link) => (link.style.display = ""))
    registerLinks.forEach((link) => (link.style.display = ""))
  }
}

// Global logout function
function logout() {
  localStorage.removeItem("userSession")
  alert("Logout realizado com sucesso!")
  window.location.href = "index.html"
}

// Utility functions
function showMessage(elementId, message, type = "info") {
  const element = document.getElementById(elementId)
  if (element) {
    element.textContent = message
    element.className = `message ${type}`
    element.style.display = "block"

    // Auto-hide after 5 seconds
    setTimeout(() => {
      element.style.display = "none"
    }, 5000)
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR")
}

function formatTime(timeString) {
  return timeString
}

function formatPhone(phone) {
  // Basic phone formatting for Brazilian phones
  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }

  return phone
}

// Export functions for global use
window.logout = logout
window.showMessage = showMessage
window.formatDate = formatDate
window.formatTime = formatTime
window.formatPhone = formatPhone

console.log("✅ Main.js initialized successfully")
