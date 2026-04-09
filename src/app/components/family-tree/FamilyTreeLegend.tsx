import { Heart } from 'lucide-react';

export const FamilyTreeLegend = () => {
  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Heart className="w-4 h-4" />
        Relationship Types
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-orange-500" style={{ borderTop: '2px solid #F59E0B' }}></div>
          <span className="text-gray-700">Married</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-pink-500" style={{ borderTop: '2px dashed #EC4899' }}></div>
          <span className="text-gray-700">Engaged</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gray-500" style={{ borderTop: '2px dotted #6B7280' }}></div>
          <span className="text-gray-700">Partnered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-purple-500" style={{ borderTop: '2px solid #8B5CF6' }}></div>
          <span className="text-gray-700">Divorced</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gray-400" style={{ borderTop: '2px solid #9CA3AF' }}></div>
          <span className="text-gray-700">Widowed</span>
        </div>
      </div>
    </div>
  );
};
