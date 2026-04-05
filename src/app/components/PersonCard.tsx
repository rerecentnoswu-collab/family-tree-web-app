import { useState } from 'react';
import { Users, Sparkles, Edit2 } from 'lucide-react';
import { updatePerson, findPotentialParents, type Person as DBPerson } from '../../../utils/supabase/client';
import { Person } from '../types/Person';
import { RelationshipEditor } from './RelationshipEditor';

interface ParentMatch {
  personId: string;
  score: number;
  reasons: string[];
}

interface PersonCardProps {
  person: Person;
  allPersons: Person[];
  onUpdate: () => void;
  highlighted?: boolean;
}

export function PersonCard({ person, allPersons, onUpdate, highlighted = false }: PersonCardProps) {
  const mother = allPersons.find(p => p.id === person.motherId);
  const father = allPersons.find(p => p.id === person.fatherId);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [potentialMothers, setPotentialMothers] = useState<ParentMatch[]>([]);
  const [potentialFathers, setPotentialFathers] = useState<ParentMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRelationshipEditor, setShowRelationshipEditor] = useState(false);

  const findParents = async () => {
    setLoading(true);
    try {
      // Convert app Person to DB Person format
      const dbPerson: DBPerson = {
        id: person.id,
        first_name: person.firstName,
        middle_name: person.middleName,
        last_name: person.lastName,
        birthday: person.birthday,
        birthplace: person.birthplace,
        mother_id: person.motherId,
        father_id: person.fatherId,
        gender: person.gender
      };

      const result = await findPotentialParents(dbPerson);
      
      // Convert results to ParentMatch format
      const mothers: ParentMatch[] = result.allMatches
        .filter(p => p.gender === 'female')
        .map(p => ({
          personId: p.id,
          score: 70, // Placeholder score
          reasons: ['Matching last name', 'Similar birthplace', 'Appropriate age gap']
        }));

      const fathers: ParentMatch[] = result.allMatches
        .filter(p => p.gender === 'male')
        .map(p => ({
          personId: p.id,
          score: 70, // Placeholder score
          reasons: ['Matching last name', 'Similar birthplace', 'Appropriate age gap']
        }));

      setPotentialMothers(mothers);
      setPotentialFathers(fathers);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error finding parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignParent = async (parentId: string, parentType: 'mother' | 'father') => {
    try {
      await updatePerson(person.id, {
        [parentType === 'mother' ? 'mother_id' : 'father_id']: parentId
      });
      setShowSuggestions(false);
      onUpdate();
    } catch (error) {
      console.error('Error assigning parent:', error);
    }
  };

  const autoAssign = async () => {
    setLoading(true);
    try {
      // Convert app Person to DB Person format
      const dbPerson: DBPerson = {
        id: person.id,
        first_name: person.firstName,
        middle_name: person.middleName,
        last_name: person.lastName,
        birthday: person.birthday,
        birthplace: person.birthplace,
        mother_id: person.motherId,
        father_id: person.fatherId,
        gender: person.gender
      };

      const result = await findPotentialParents(dbPerson);
      
      const updates: any = {};
      if (!person.motherId && result.suggestedMother) {
        updates.mother_id = result.suggestedMother.id;
      }
      if (!person.fatherId && result.suggestedFather) {
        updates.father_id = result.suggestedFather.id;
      }

      if (Object.keys(updates).length > 0) {
        await updatePerson(person.id, updates);
        onUpdate();
      }
    } catch (error) {
      console.error('Error auto-assigning parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const age = person.birthday ? new Date().getFullYear() - new Date(person.birthday).getFullYear() : null;

  return (
    <div
      id={`person-${person.id}`}
      className={`bg-white rounded-lg shadow-md p-6 border transition-all ${
        highlighted ? 'border-blue-500 ring-4 ring-blue-200 shadow-xl' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {person.firstName} {person.middleName && `${person.middleName} `}{person.lastName}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {person.birthday ? (
              <>Born {new Date(person.birthday).toLocaleDateString()} {age && `(${age} years old)`}</>
            ) : (
              'Birth date not specified'
            )}
          </p>
          <p className="text-sm text-gray-500">{person.birthplace}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRelationshipEditor(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Edit Relationships
          </button>
          <button
            onClick={findParents}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Find Parents
          </button>
          {(!mother || !father) && (
            <button
              onClick={autoAssign}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              Auto-Assign
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Mother:</span>
          {mother ? (
            <span className="font-medium text-gray-900">
              {mother.firstName} {mother.lastName}
            </span>
          ) : (
            <span className="text-gray-400 italic">Not assigned</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Father:</span>
          {father ? (
            <span className="font-medium text-gray-900">
              {father.firstName} {father.lastName}
            </span>
          ) : (
            <span className="text-gray-400 italic">Not assigned</span>
          )}
        </div>
      </div>

      {showSuggestions && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="font-semibold text-gray-900 mb-3">AI Suggestions</h4>

          {!mother && potentialMothers.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Potential Mothers:</p>
              <div className="space-y-2">
                {potentialMothers.slice(0, 3).map((match) => {
                  const candidate = allPersons.find(p => p.id === match.personId);
                  if (!candidate) return null;
                  return (
                    <div
                      key={match.personId}
                      className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {candidate.firstName} {candidate.lastName}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Score: {match.score} - {match.reasons[0]}
                        </p>
                      </div>
                      <button
                        onClick={() => assignParent(match.personId, 'mother')}
                        className="px-3 py-1 text-sm bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors"
                      >
                        Assign
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!father && potentialFathers.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Potential Fathers:</p>
              <div className="space-y-2">
                {potentialFathers.slice(0, 3).map((match) => {
                  const candidate = allPersons.find(p => p.id === match.personId);
                  if (!candidate) return null;
                  return (
                    <div
                      key={match.personId}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {candidate.firstName} {candidate.lastName}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Score: {match.score} - {match.reasons[0]}
                        </p>
                      </div>
                      <button
                        onClick={() => assignParent(match.personId, 'father')}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Assign
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {potentialMothers.length === 0 && potentialFathers.length === 0 && (
            <p className="text-sm text-gray-500 italic">No suitable parents found</p>
          )}
        </div>
      )}

      {/* Relationship Editor Modal */}
      {showRelationshipEditor && (
        <RelationshipEditor
          person={person}
          allPersons={allPersons}
          onUpdate={async (updatedPerson) => {
            // Convert to DB format and update
            const dbPerson: DBPerson = {
              id: updatedPerson.id,
              first_name: updatedPerson.firstName,
              middle_name: updatedPerson.middleName,
              last_name: updatedPerson.lastName,
              birthday: updatedPerson.birthday,
              birthplace: updatedPerson.birthplace,
              mother_id: updatedPerson.motherId,
              father_id: updatedPerson.fatherId,
              gender: updatedPerson.gender
            };
            
            await updatePerson(updatedPerson.id, dbPerson);
            setShowRelationshipEditor(false);
            onUpdate();
          }}
          onClose={() => setShowRelationshipEditor(false)}
        />
      )}
    </div>
  );
}