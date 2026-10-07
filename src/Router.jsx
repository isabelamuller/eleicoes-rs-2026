import App from './App';
import Documentacao from './pages/Documentacao';
import MapaPortoAlegre from './pages/MapaPortoAlegre';

function Router() {
  const path = window.location.pathname;

  if (path === '/mapa-porto-alegre') {
    return <MapaPortoAlegre />;
  }

  if (path === '/documentacao') {
  return <Documentacao />;
}

  return <App />;
}

export default Router;