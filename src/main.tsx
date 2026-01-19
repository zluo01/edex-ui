import { QUERY_CLIENT } from '@/lib/queries';
import { TerminalProvider } from '@/lib/terminal';
import { ThemeProvider } from '@/lib/themes';
import { QueryClientProvider } from '@tanstack/solid-query';
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools';
import 'augmented-ui/augmented-ui.min.css';
import { render } from 'solid-js/web';

import App from './App';
import './index.css';

render(
  () => (
    <ThemeProvider>
      <TerminalProvider>
        <QueryClientProvider client={QUERY_CLIENT}>
          <App />
          <SolidQueryDevtools
            initialIsOpen={false}
            buttonPosition="top-right"
          />
        </QueryClientProvider>
      </TerminalProvider>
    </ThemeProvider>
  ),
  document.getElementById('root') as HTMLElement,
);
