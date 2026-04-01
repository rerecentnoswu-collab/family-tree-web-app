import React, { useState, useCallback, useMemo } from 'react';
import { Users, Heart, AlertTriangle, CheckCircle, X, Plus, Edit2, Save, Clock } from 'lucide-react';

interface Person {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthday: string;
  birthplace: string;
  motherId?: string;
  fatherId?: string;
  gender?: 'male' | 'female' | 'other';
  spouseIds?: string[];
}

interface Relationship {
  id: string;
  type: 'parent' | 'child' | 'spouse' | 'sibling';
  personId: string;
  relatedPersonId: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

interface RelationshipEditorProps {
  person: Person;
  allPersons: Person[];
  onUpdate: (updatedPerson: Person) => void;
  onClose: () => void;
}

export function RelationshipEditor({ person, allPersons, onUpdate, onClose }: RelationshipEditorProps) {
  const [editingPerson, setEditingPerson] = useState<Person>({ ...person });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAddSpouse, setShowAddSpouse] = useState(false);

  // Calculate age for validation
  const calculateAge = useCallback((birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, []);

  // Validate parent-child relationships
  const validateParentChildRelationship = useCallback((parent: Person, child: Person) => {
    const parentAge = calculateAge(parent.birthday);
    const childAge = calculateAge(child.birthday);
    const ageDiff = parentAge - childAge;

    const errors: string[] = [];

    // Biological plausibility checks
    if (ageDiff < 12) {
      errors.push('Parent must be at least 12 years older than child');
    }
    if (ageDiff > 65) {
      errors.push('Parent age difference seems unrealistic (>65 years)');
    }

    // Gender compatibility for biological relationships
    if (parent.gender === 'male' && child.gender === 'male' && parent.fatherId === child.id) {
      errors.push('Cannot create circular male lineage');
    }
    if (parent.gender === 'female' && child.gender === 'female' && parent.motherId === child.id) {
      errors.push('Cannot create circular female lineage');
    }

    // Prevent self-reference
    if (parent.id === child.id) {
      errors.push('Person cannot be their own parent');
    }

    return errors;
  }, [calculateAge]);

  // Validate spouse relationships
  const validateSpouseRelationship = useCallback((person1: Person, person2: Person) => {
    const errors: string[] = [];

    // Prevent self-marriage
    if (person1.id === person2.id) {
      errors.push('Person cannot marry themselves');
    }

    // Check for existing spouse relationships
    if (person1.spouseIds?.includes(person2.id)) {
      errors.push('These persons are already spouses');
    }

    // Age reasonableness
    const age1 = calculateAge(person1.birthday);
    const age2 = calculateAge(person2.birthday);
    const ageDiff = Math.abs(age1 - age2);

    if (ageDiff > 50) {
      errors.push('Age difference between spouses seems unrealistic');
    }

    return errors;
  }, [calculateAge]);

  // Get potential parents based on age and gender
  const getPotentialParents = useCallback((child: Person) => {
    const childAge = calculateAge(child.birthday);
    
    return allPersons.filter(p => {
      if (p.id === child.id) return false;
      
      const parentAge = calculateAge(p.birthday);
      const ageDiff = parentAge - childAge;
      
      // Age criteria: 12-65 years older
      if (ageDiff < 12 || ageDiff > 65) return false;
      
      // Gender-specific parent roles
      if (p.gender === 'male') {
        return !child.fatherId || child.fatherId !== p.id;
      } else if (p.gender === 'female') {
        return !child.motherId || child.motherId !== p.id;
      }
      
      return true;
    });
  }, [allPersons, calculateAge]);

  // Get potential spouses
  const getPotentialSpouses = useCallback((currentPerson: Person) => {
    return allPersons.filter(p => {
      if (p.id === currentPerson.id) return false;
      if (currentPerson.spouseIds?.includes(p.id)) return false;
      
      // Age reasonableness
      const age1 = calculateAge(currentPerson.birthday);
      const age2 = calculateAge(p.birthday);
      const ageDiff = Math.abs(age1 - age2);
      
      return ageDiff <= 50;
    });
  }, [allPersons, calculateAge]);

  // Handle parent assignment
  const handleParentAssignment = useCallback((parentType: 'mother' | 'father', parentId: string) => {
    const parent = allPersons.find(p => p.id === parentId);
    if (!parent) return;

    const validationResults = validateParentChildRelationship(parent, editingPerson);
    
    if (validationResults.length > 0) {
      setValidationErrors({
        [parentType]: validationResults.join(', ')
      });
      return;
    }

    setEditingPerson(prev => ({
      ...prev,
      [parentType === 'mother' ? 'motherId' : 'fatherId']: parentId
    }));
    
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[parentType];
      return newErrors;
    });
  }, [allPersons, editingPerson, validateParentChildRelationship]);

  // Handle parent removal
  const handleParentRemoval = useCallback((parentType: 'mother' | 'father') => {
    setEditingPerson(prev => ({
      ...prev,
      [parentType === 'mother' ? 'motherId' : 'fatherId']: undefined
    }));
    
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[parentType];
      return newErrors;
    });
  }, []);

  // Handle spouse addition
  const handleSpouseAddition = useCallback((spouseId: string) => {
    const spouse = allPersons.find(p => p.id === spouseId);
    if (!spouse) return;

    const validationResults = validateSpouseRelationship(editingPerson, spouse);
    
    if (validationResults.length > 0) {
      setValidationErrors({
        spouse: validationResults.join(', ')
      });
      return;
    }

    setEditingPerson(prev => ({
      ...prev,
      spouseIds: [...(prev.spouseIds || []), spouseId]
    }));
    
    setShowAddSpouse(false);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.spouse;
      return newErrors;
    });
  }, [allPersons, editingPerson, validateSpouseRelationship]);

  // Handle spouse removal
  const handleSpouseRemoval = useCallback((spouseId: string) => {
    setEditingPerson(prev => ({
      ...prev,
      spouseIds: prev.spouseIds?.filter(id => id !== spouseId) || []
    }));
  }, []);

  // Save changes
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    
    try {
      // Final validation
      const errors: Record<string, string> = {};
      
      if (editingPerson.motherId) {
        const mother = allPersons.find(p => p.id === editingPerson.motherId);
        if (mother) {
          const motherValidation = validateParentChildRelationship(mother, editingPerson);
          if (motherValidation.length > 0) {
            errors.mother = motherValidation.join(', ');
          }
        }
      }
      
      if (editingPerson.fatherId) {
        const father = allPersons.find(p => p.id === editingPerson.fatherId);
        if (father) {
          const fatherValidation = validateParentChildRelationship(father, editingPerson);
          if (fatherValidation.length > 0) {
            errors.father = fatherValidation.join(', ');
          }
        }
      }
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
      
      // Update the person
      await onUpdate(editingPerson);
      onClose();
    } catch (error) {
      console.error('Failed to save relationships:', error);
      setValidationErrors({
        save: 'Failed to save relationships. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  }, [editingPerson, allPersons, onUpdate, onClose, validateParentChildRelationship]);

  // Get current parents
  const currentMother = useMemo(() => 
    editingPerson.motherId ? allPersons.find(p => p.id === editingPerson.motherId) : null,
    [editingPerson.motherId, allPersons]
  );

  const currentFather = useMemo(() => 
    editingPerson.fatherId ? allPersons.find(p => p.id === editingPerson.fatherId) : null,
    [editingPerson.fatherId, allPersons]
  );

  const currentSpouses = useMemo(() => 
    editingPerson.spouseIds?.map(id => allPersons.find(p => p.id === id)).filter(Boolean) as Person[] || [],
    [editingPerson.spouseIds, allPersons]
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Edit Relationships
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Person Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              {editingPerson.firstName} {editingPerson.lastName}
            </h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>Age: {calculateAge(editingPerson.birthday)} years</p>
              <p>Born: {new Date(editingPerson.birthday).toLocaleDateString()}</p>
              <p>Gender: {editingPerson.gender || 'Not specified'}</p>
            </div>
          </div>

          {/* Parent Relationships */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              Parent Relationships
            </h3>

            {/* Mother */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mother</label>
              {currentMother ? (
                <div className="flex items-center justify-between p-3 bg-pink-50 border border-pink-200 rounded-lg">
                  <div>
                    <p className="font-medium text-pink-900">
                      {currentMother.firstName} {currentMother.lastName}
                    </p>
                    <p className="text-sm text-pink-700">
                      Age: {calculateAge(currentMother.birthday)} years
                    </p>
                  </div>
                  <button
                    onClick={() => handleParentRemoval('mother')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <select
                    onChange={(e) => e.target.value && handleParentAssignment('mother', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue=""
                  >
                    <option value="">Select mother...</option>
                    {getPotentialParents(editingPerson)
                      .filter(p => p.gender === 'female')
                      .map(mother => (
                        <option key={mother.id} value={mother.id}>
                          {mother.firstName} {mother.lastName} (Age: {calculateAge(mother.birthday)})
                        </option>
                      ))}
                  </select>
                  {validationErrors.mother && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                      <p className="text-sm text-red-800">{validationErrors.mother}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Father */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Father</label>
              {currentFather ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">
                      {currentFather.firstName} {currentFather.lastName}
                    </p>
                    <p className="text-sm text-blue-700">
                      Age: {calculateAge(currentFather.birthday)} years
                    </p>
                  </div>
                  <button
                    onClick={() => handleParentRemoval('father')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <select
                    onChange={(e) => e.target.value && handleParentAssignment('father', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue=""
                  >
                    <option value="">Select father...</option>
                    {getPotentialParents(editingPerson)
                      .filter(p => p.gender === 'male')
                      .map(father => (
                        <option key={father.id} value={father.id}>
                          {father.firstName} {father.lastName} (Age: {calculateAge(father.birthday)})
                        </option>
                      ))}
                  </select>
                  {validationErrors.father && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                      <p className="text-sm text-red-800">{validationErrors.father}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Spouse Relationships */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-gray-600" />
              Spouse/Partner Relationships
            </h3>

            {/* Current Spouses */}
            {currentSpouses.length > 0 && (
              <div className="space-y-2 mb-4">
                {currentSpouses.map(spouse => (
                  <div key={spouse.id} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div>
                      <p className="font-medium text-purple-900">
                        {spouse.firstName} {spouse.lastName}
                      </p>
                      <p className="text-sm text-purple-700">
                        Age: {calculateAge(spouse.birthday)} years
                      </p>
                    </div>
                    <button
                      onClick={() => handleSpouseRemoval(spouse.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Spouse */}
            {!showAddSpouse ? (
              <button
                onClick={() => setShowAddSpouse(true)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-gray-700"
              >
                <Plus className="w-4 h-4" />
                Add Spouse/Partner
              </button>
            ) : (
              <div>
                <select
                  onChange={(e) => e.target.value && handleSpouseAddition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue=""
                >
                  <option value="">Select spouse/partner...</option>
                  {getPotentialSpouses(editingPerson).map(spouse => (
                    <option key={spouse.id} value={spouse.id}>
                      {spouse.firstName} {spouse.lastName} (Age: {calculateAge(spouse.birthday)})
                    </option>
                  ))}
                </select>
                {validationErrors.spouse && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">{validationErrors.spouse}</p>
                  </div>
                )}
                <button
                  onClick={() => setShowAddSpouse(false)}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Validation Guidelines */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Genealogy Guidelines
            </h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Parents should be 12-65 years older than children</li>
              <li>• Age differences between spouses should be reasonable</li>
              <li>• Avoid circular relationships (e.g., person being their own grandparent)</li>
              <li>• Verify biological plausibility when assigning relationships</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Relationships
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>

          {validationErrors.save && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">{validationErrors.save}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
