import App from './App';

function initCreditsPage() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    
    rootElement.innerHTML = App();
  }
}

// Boot up the layoout XD
document.addEventListener('DOMContentLoaded', initCreditsPage);
