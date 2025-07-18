import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const loadingMessages = [
  'Initializing WordPress Playground...',
  'Setting up database...',
  'Loading WordPress core files...',
  'Configuring authentication system...',
  'Preparing your workspace...',
  'Almost ready...'
];

export function WordPressLoading() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev < loadingMessages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) {
          return prev + Math.random() * 15;
        }
        return prev;
      });
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center space-y-6">
          <LoadingSpinner className="mb-4" />
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">
              Getting things ready
            </h2>
            <p className="text-gray-600 animate-pulse">
              {loadingMessages[currentMessageIndex]}
            </p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <p className="text-sm text-gray-500 text-center">
            This may take a few moments on first load as we set up your WordPress environment.
          </p>
        </div>
      </Card>
    </div>
  );
}