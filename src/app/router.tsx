import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './ui/AppLayout';

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
  },
]);
