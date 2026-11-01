import { StoreProvider } from './state/store';
import { LangProvider } from './i18n';
import { useRoute } from './router';
import Desk from './pages/Desk';
import NewCase from './pages/NewCase';
import Check from './pages/Check';
import CaseFlow from './pages/CaseFlow';
import Sealed from './pages/Sealed';
import Reopen from './pages/Reopen';
import Ledger from './pages/Ledger';
import GateLedger from './pages/GateLedger';
import Me from './pages/Me';
import About from './pages/About';

function Root() {
  const route = useRoute();
  switch (route.name) {
    case 'desk': return <Desk />;
    case 'new': return <NewCase />;
    case 'check': return <Check />;
    case 'case': return <CaseFlow id={route.id} />;
    case 'sealed': return <Sealed key={route.id} id={route.id} />;
    case 'reopen': return <Reopen key={route.id} id={route.id} />;
    case 'ledger': return <Ledger />;
    case 'gate': return <GateLedger gate={route.gate} />;
    case 'me': return <Me key={route.tab ?? 'predictions'} initialTab={route.tab} />;
    case 'about': return <About />;
    default: return <Desk />;
  }
}

export default function App() {
  return (
    <LangProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </LangProvider>
  );
}
