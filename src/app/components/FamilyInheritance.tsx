import { useState } from 'react';
import { Users, Heart, UserPlus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface FamilyInheritanceProps {
  familyInheritance: {
    hasInvitations: boolean;
    invitations: any[];
    familyMatches: any[];
    error?: string;
  } | null;
  onAcceptInvitation: (invitationId: string) => Promise<void>;
  loading: boolean;
}

export const FamilyInheritance = ({ 
  familyInheritance, 
  onAcceptInvitation, 
  loading 
}: FamilyInheritanceProps) => {
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  if (!familyInheritance) return null;

  const handleAcceptInvitation = async (invitationId: string) => {
    setAcceptingId(invitationId);
    try {
      await onAcceptInvitation(invitationId);
    } finally {
      setAcceptingId(null);
    }
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'parent': return <Users className="w-4 h-4" />;
      case 'child': return <UserPlus className="w-4 h-4" />;
      case 'spouse': return <Heart className="w-4 h-4" />;
      case 'sibling': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'parent': return 'text-blue-600 bg-blue-50';
      case 'child': return 'text-green-600 bg-green-50';
      case 'spouse': return 'text-pink-600 bg-pink-50';
      case 'sibling': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (familyInheritance.error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-yellow-800">Family Connection Check</h3>
            <p className="text-yellow-700 text-sm mt-1">
              We couldn't check for family connections automatically. You can manually add family members or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (familyInheritance.hasInvitations && familyInheritance.invitations.length > 0) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Family Tree Invitations</h2>
            <p className="text-gray-600">You've been invited to join a family tree!</p>
          </div>
        </div>

        <div className="space-y-3">
          {familyInheritance.invitations.map((invitation) => (
            <div key={invitation.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getRelationshipColor(invitation.relationship_type)}`}>
                    {getRelationshipIcon(invitation.relationship_type)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {invitation.relationship_type.charAt(0).toUpperCase() + invitation.relationship_type.slice(1)} Invitation
                    </p>
                    <p className="text-sm text-gray-600">
                      Invited by: {invitation.inviter_user_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptInvitation(invitation.id)}
                    disabled={loading || acceptingId === invitation.id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {acceptingId === invitation.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </>
                    )}
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Accepting will add family members to your tree while maintaining your privacy and data separation.
          </p>
        </div>
      </div>
    );
  }

  if (familyInheritance.familyMatches.length > 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Potential Family Connections</h2>
            <p className="text-gray-600">We found some possible family members!</p>
          </div>
        </div>

        <div className="space-y-3">
          {familyInheritance.familyMatches.slice(0, 3).map((match, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getRelationshipColor(match.relationshipType)}`}>
                  {getRelationshipIcon(match.relationshipType)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {match.person.first_name} {match.person.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {match.relationshipType.charAt(0).toUpperCase() + match.relationshipType.slice(1)} relationship
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      match.confidence === 'high' ? 'bg-green-100 text-green-800' :
                      match.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {match.confidence} confidence
                    </span>
                    {match.person.birthday && (
                      <span className="text-xs text-gray-500">
                        Age: {new Date().getFullYear() - new Date(match.person.birthday).getFullYear()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-green-100 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Next steps:</strong> You can manually add these family members or ask your family to send you an invitation for automatic connection.
          </p>
        </div>
      </div>
    );
  }

  return null;
};
