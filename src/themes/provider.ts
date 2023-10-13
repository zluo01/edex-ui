import THEME_LIST from '@/themes/styles';
import { createContext } from 'react';

const ThemeContext = createContext(THEME_LIST[0]);

export default ThemeContext;
