import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      // Dispara a cada mudança de rota no React
      // O Google Analytics já captura a primeira página sozinho no index.html
      // Então só mandamos de novo se houver navegação subsequente.
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
}
