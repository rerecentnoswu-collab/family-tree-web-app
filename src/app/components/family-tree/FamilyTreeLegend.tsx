import { Heart, Users, User, Sparkles } from 'lucide-react';

export const FamilyTreeLegend = () => {
  return (
    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-5 border border-gray-100 max-w-xs">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
        <Heart className="w-5 h-5 text-rose-500" />
        Family Connections
      </h3>
      
      {/* Relationship Types */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
          <Users className="w-4 h-4" />
          Relationship Status
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-rose-50 hover:bg-rose-100 transition-colors">
            <div className="flex items-center gap-1">
              <span className="text-lg">❤️</span>
              <div className="w-6 h-1 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"></div>
            </div>
            <span className="text-gray-700 font-medium">Married</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors">
            <div className="flex items-center gap-1">
              <span className="text-lg">💍</span>
              <div className="w-6 h-1 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full" style={{ borderStyle: 'dashed', borderWidth: '2px' }}></div>
            </div>
            <span className="text-gray-700 font-medium">Engaged</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
            <div className="flex items-center gap-1">
              <span className="text-lg">💜</span>
              <div className="w-6 h-1 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full" style={{ borderStyle: 'dotted', borderWidth: '2px' }}></div>
            </div>
            <span className="text-gray-700 font-medium">Partnered</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-1">
              <span className="text-lg">💔</span>
              <div className="w-6 h-1 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full opacity-50"></div>
            </div>
            <span className="text-gray-600 font-medium">Divorced</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-1">
              <span className="text-lg">⚫</span>
              <div className="w-6 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full opacity-50"></div>
            </div>
            <span className="text-gray-600 font-medium">Widowed</span>
          </div>
        </div>
      </div>
      
      {/* Gender Indicators */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
          <User className="w-4 h-4" />
          Gender Colors
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 ring-2 ring-blue-200"></div>
            <span className="text-gray-700 font-medium">Male</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 ring-2 ring-pink-200"></div>
            <span className="text-gray-700 font-medium">Female</span>
          </div>
        </div>
      </div>
      
      {/* Connection Lines */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Connection Types
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
            <div className="flex flex-col items-center gap-1">
              <div className="w-1 h-4 bg-gradient-to-b from-blue-400 to-blue-300 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
            </div>
            <span className="text-gray-700 font-medium">Parent-Child</span>
          </div>
        </div>
      </div>
    </div>
  );
};
