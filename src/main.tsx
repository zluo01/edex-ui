import { ThemeProvider } from '@/themes';
import 'augmented-ui/augmented.css';
import { render } from 'solid-js/web';

import App from './App';
import './index.css';

render(
  () => (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  ),
  document.getElementById('root') as HTMLElement,
);
