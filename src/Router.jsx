import { useEffect } from 'react';
import App from './App';
import Documentacao from './pages/Documentacao';
import MapaPortoAlegre from './pages/MapaPortoAlegre';

function Router() {
  const path = window.location.pathname;
  const title =
    path === '/mapa-porto-alegre'
      ? 'Como POA votou?'
      : path === '/documentacao'
        ? 'Como fui feito?'
        : 'Como o RS votou?';

  useEffect(() => {
    document.title = title;
  }, [title]);

  if (path === '/mapa-porto-alegre') {
    return <MapaPortoAlegre />;
  }

  if (path === '/documentacao') {
  return <Documentacao />;
}

  return <App />;
}

export default Router;