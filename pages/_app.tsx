import '../app/globals.css'
import type { AppProps } from 'next/app'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { WordPressLoading } from '@/components/wordpress-loading'
import { WordPressError } from '@/components/wordpress-error'

// Create context for the WordPress handler status
interface WordPressHandlerContextType {
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
}

const WordPressHandlerContext = createContext<WordPressHandlerContextType>({
  isReady: false,
  isLoading: true,
  error: null
});

// Custom hook to use the WordPress handler status
export const useWordPressHandler = () => {
  const context = useContext(WordPressHandlerContext);
  if (!context) {
    throw new Error('useWordPressHandler must be used within WordPressHandlerProvider');
  }
  return context;
};

// Provider component that checks WordPress handler status via API
function WordPressHandlerProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkHandlerStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🚀 Checking WordPress handler status...');
      const response = await fetch('/api/wp-status');
      const data = await response.json();
      
      if (data.status === 'ready') {
        console.log('✅ WordPress handler is ready');
        setIsReady(true);
      } else {
        throw new Error(data.error || 'Handler not ready');
      }
    } catch (err) {
      console.error('❌ Failed to check WordPress handler:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHandlerStatus();
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const value = {
    isReady,
    isLoading,
    error
  };

  return (
    <WordPressHandlerContext.Provider value={value}>
      {isLoading ? (
        <WordPressLoading />
      ) : error ? (
        <WordPressError error={error} onRetry={handleRetry} />
      ) : (
        children
      )}
    </WordPressHandlerContext.Provider>
  );
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WordPressHandlerProvider>
      <Component {...pageProps} />
    </WordPressHandlerProvider>
  );
} 