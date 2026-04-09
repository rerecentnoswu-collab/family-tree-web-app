interface LoadingStateProps {
  message?: string;
}

export const AppLoadingState = ({ message = "Loading..." }: LoadingStateProps) => {
  const viewportBgImg = '/family-viewport-bg.png';
  
  return (
    <div className="min-h-screen relative">
      <div 
        className="fixed inset-0 -z-5 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${viewportBgImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50/50 to-purple-50/50" />
      
      <div className="relative flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
};

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  title?: string;
}

export const AppErrorState = ({ error, onRetry, title = "Connection Error" }: ErrorStateProps) => {
  const viewportBgImg = '/family-viewport-bg.png';
  
  return (
    <div className="min-h-screen relative">
      <div 
        className="fixed inset-0 -z-5 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${viewportBgImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50/50 to-purple-50/50" />
      
      <div className="relative flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface SetupStateProps {
  onRetry?: () => void;
}

export const AppSetupState = ({ onRetry }: SetupStateProps) => {
  const viewportBgImg = '/family-viewport-bg.png';
  
  return (
    <div className="min-h-screen relative">
      <div 
        className="fixed inset-0 -z-5 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${viewportBgImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50/50 to-purple-50/50" />
      
      <div className="relative flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Database Setup Required</h2>
          <p className="text-gray-600 mb-6">
            Your family tree database needs to be initialized. Please run the SQL setup script in your Supabase dashboard.
          </p>
          <button
            onClick={onRetry || (() => window.location.reload())}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            I've Run the SQL - Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
};
