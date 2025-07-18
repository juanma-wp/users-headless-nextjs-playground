import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface WordPressErrorProps {
  error: Error;
  onRetry?: () => void;
}

export function WordPressError({ error, onRetry }: WordPressErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">
              Failed to Initialize
            </h2>
            <p className="text-gray-600">
              We couldn't set up WordPress Playground. This might be a temporary issue.
            </p>
          </div>

          <div className="w-full p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-700 font-mono">
              {error.message || 'Unknown error occurred'}
            </p>
          </div>

          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              Try Again
            </Button>
          )}

          <p className="text-sm text-gray-500 text-center">
            If this problem persists, please check your browser console for more details.
          </p>
        </div>
      </Card>
    </div>
  );
}