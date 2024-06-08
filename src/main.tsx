import { TerminalProvider } from '@/lib/terminal';
import { ThemeProvider } from '@/lib/themes';
import 'augmented-ui/augmented-ui.min.css';
import { render } from 'solid-js/web';

import App from './App';
import './index.css';

render(
  () => (
    <ThemeProvider>
      <TerminalProvider>
        <App />
      </TerminalProvider>
    </ThemeProvider>
  ),
  document.getElementById('root') as HTMLElement,
);
