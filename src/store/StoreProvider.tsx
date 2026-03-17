// Next.js App Router layouts are Server Components, but Redux requires Client Components. 
// To bridge this, we create a small wrapper component to provide the store to the app.

'use client';

import { Provider } from 'react-redux';
import { store } from './store';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>
        {children}
    </Provider>;
}
