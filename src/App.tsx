import React from 'react';
import Routes from './routes';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GlobalProvider from './contexts/GlobalProvider';
import AuthGate from './components/AuthGate';
import SetupGate from './components/SetupGate';
import StartupErrorGate from './components/StartupErrorGate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <StartupErrorGate>
            <GlobalProvider>
              <AuthGate>
                <SetupGate>
                  <Routes />
                </SetupGate>
              </AuthGate>
            </GlobalProvider>
          </StartupErrorGate>
          <ToastContainer />
        </QueryClientProvider>
      </BrowserRouter>
    </>
  );
};

export default App;
