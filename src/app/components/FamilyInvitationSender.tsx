import { useState } from 'react';
import { UserPlus, Mail, Users, Heart, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { createFamilyInvitation } from '../../../utils/supabase/client';
import { Person } from '../types/Person';

interface FamilyInvitationSenderProps {
  persons: Person[];
  onInvitationSent?: () => void;
}

export const FamilyInvitationSender = ({ persons, onInvitationSent }: FamilyInvitationSenderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [email, setEmail] = useState('');
  const [relationshipType, setRelationshipType] = useState<'parent' | 'child' | 'spouse' | 'sibling'>('child');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendInvitation = async () => {
    if (!selectedPerson || !email) return;

    setIsSending(true);
    setMessage(null);

    try {
      await createFamilyInvitation(email, relationshipType, selectedPerson.id);
      
      setMessage({
        type: 'success',
        text: `Invitation sent successfully to ${email}! They will see it when they sign up.`
      });
      
      // Reset form
      setEmail('');
      setSelectedPerson(null);
      setRelationshipType('child');
      
      // Notify parent
      if (onInvitationSent) {
        onInvitationSent();
      }
      
      // Close modal after delay
      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
      }, 3000);
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send invitation'
      });
    } finally {
      setIsSending(false);
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
      case 'parent': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'child': return 'text-green-600 bg-green-50 border-green-200';
      case 'spouse': return 'text-pink-600 bg-pink-50 border-pink-200';
      case 'sibling': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Invite Family Members</h3>
              <p className="text-gray-600">Send invitations to connect with family members and grow your family tree</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Invitation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Send Family Invitation</h3>
            <p className="text-gray-600">Invite a family member to join your family tree</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ×
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Select Family Member */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Family Member to Invite
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {persons.map((person) => (
              <div
                key={person.id}
                onClick={() => setSelectedPerson(person)}
                className={`p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all ${
                  selectedPerson?.id === person.id
                    ? 'border-blue-500 bg-blue-50'
                    : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <div className="text-white font-medium">
                      {person.firstName?.charAt(0)}.{person.lastName?.charAt(0)}
                    </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    person.gender === 'female' 
                      ? 'bg-gradient-to-br from-pink-500 to-rose-600' 
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                    {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {person.firstName} {person.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {person.occupation || 'Family Member'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Relationship Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relationship Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['parent', 'child', 'spouse', 'sibling'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setRelationshipType(type)}
                className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  relationshipType === type
                    ? getRelationshipColor(type)
                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
                }`}
              >
                {getRelationshipIcon(type)}
                <span className="capitalize">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="family.member@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            The person will receive an invitation when they sign up with this email
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSendInvitation}
            disabled={!selectedPerson || !email || isSending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Invitation
              </>
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Information Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
    </div>

    {/* Information Box */}
    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">How it works:</p>
          <ul className="space-y-1 text-blue-700">
            <li>1. The invitation will be sent to the email address</li>
            <li>2. When they sign up, they'll see the invitation</li>
            <li>3. After accepting, they'll get your family tree data</li>
            <li>4. Each person gets their own copy for privacy</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);
