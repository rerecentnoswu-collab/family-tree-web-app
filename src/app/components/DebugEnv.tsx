// Debug component to check environment variables
export function DebugEnv() {
  const allEnvVars = import.meta.env;
  const supabaseVars = Object.entries(allEnvVars).filter(([key]) => 
    key.includes('SUPABASE')
  );

  return (
    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
      <div className="mb-2 text-yellow-400">🔍 Environment Variables Debug:</div>
      
      <div className="space-y-1 mb-3">
        <div>Mode: {allEnvVars.MODE}</div>
        <div>DEV: {String(allEnvVars.DEV)}</div>
      </div>

      {supabaseVars.length > 0 ? (
        <div className="space-y-1">
          <div className="text-yellow-400">Supabase variables found:</div>
          {supabaseVars.map(([key, value]) => (
            <div key={key}>
              {key}: {String(value).substring(0, 30)}...
            </div>
          ))}
        </div>
      ) : (
        <div className="text-red-400">
          ⚠️ No SUPABASE_* environment variables found
        </div>
      )}

      <div className="mt-3 text-gray-400">
        All variables: {Object.keys(allEnvVars).join(', ')}
      </div>
    </div>
  );
}
