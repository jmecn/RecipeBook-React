import { createBrowserRouter } from 'react-router-dom';
import { routerBasename } from '../shared/lib/site-base';
import { AppLayout } from './ui/AppLayout';

export const appRouter = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
    },
  ],
  { basename: routerBasename() },
);
