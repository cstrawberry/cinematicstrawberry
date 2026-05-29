// js/components.js
class ComponentLoader {
    static getComponentBaseUrl() {
      const script = Array.from(document.scripts).find((item) => {
        return item.src && /\/js\/components(?:\.min)?\.js(?:$|\?)/.test(item.src);
      });

      return script ? new URL('./', script.src) : new URL('js/', document.baseURI);
    }

    static async loadComponent(elementId, componentPath) {
      const target = document.getElementById(elementId);
      if (!target) return;

      try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const content = await response.text();
        target.innerHTML = content;
      } catch (error) {
        console.error('Error loading component:', error);
      }
    }
  
    static async loadAllComponents() {
      const componentBaseUrl = this.getComponentBaseUrl();

      await Promise.all([
        this.loadComponent('header', new URL('../components/header.html?v=1.3', componentBaseUrl).href),
        this.loadComponent('footer', new URL('../components/footer.html?v=1.5', componentBaseUrl).href)
      ]);
      document.dispatchEvent(new CustomEvent("site-components-loaded"));
    }
  }
  
  // Load all components when the DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    ComponentLoader.loadAllComponents();
  });
