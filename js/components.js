// js/components.js
class ComponentLoader {
    static async loadComponent(elementId, componentPath) {
      try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const content = await response.text();
        document.getElementById(elementId).innerHTML = content;
        
        // Update active navigation link
        if (elementId === 'header') {
          const currentPage = window.location.pathname.split('/').pop();
          const navLinks = document.querySelectorAll('nav ul li a');
          navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
              link.style.color = 'red';
              link.style.fontWeight = 'bold';
            } else {
              link.style.color = 'black';
              link.style.fontWeight = 'normal';
            }
          });
        }
      } catch (error) {
        console.error('Error loading component:', error);
      }
    }
  
    static async loadAllComponents() {
      await Promise.all([
        this.loadComponent('header', '/components/header.html'),
        this.loadComponent('footer', '/components/footer.html'),
        this.loadComponent('fonts', '/components/fonts.html')
      ]);
    }
  }
  
  // Load all components when the DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    ComponentLoader.loadAllComponents();
  });