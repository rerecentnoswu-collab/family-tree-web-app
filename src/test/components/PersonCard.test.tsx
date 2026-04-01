import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PersonCard } from '../../app/components/PersonCard';
import type { Person } from '../../services/personService';

// Mock the person service
vi.mock('../../services/personService', () => ({
  personService: {
    getPersonById: vi.fn(),
    updatePerson: vi.fn(),
    deletePerson: vi.fn(),
    getPersonRelationships: vi.fn(),
  },
}));

describe('PersonCard Component', () => {
  const mockPerson: Person = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    birthday: '1980-01-01',
    birthplace: 'New York, NY',
    gender: 'male',
  };

  const mockOnUpdate = vi.fn();
  const mockAllPersons: Person[] = [mockPerson];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders person information correctly', () => {
    render(
      <PersonCard
        person={mockPerson}
        allPersons={mockAllPersons}
        onUpdate={mockOnUpdate}
        highlighted={false}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
  });

  it('shows edit form when edit button is clicked', async () => {
    render(
      <PersonCard
        person={mockPerson}
        allPersons={mockAllPersons}
        onUpdate={mockOnUpdate}
        highlighted={false}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    });
  });

  it('calls onUpdate when person is updated', async () => {
    const { personService } = await import('../../services/personService');
    vi.mocked(personService.updatePerson).mockResolvedValue({
      data: { ...mockPerson, firstName: 'Jane' },
      success: true,
    });

    render(
      <PersonCard
        person={mockPerson}
        allPersons={mockAllPersons}
        onUpdate={mockOnUpdate}
        highlighted={false}
      />
    );

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    // Update first name
    await waitFor(() => {
      const firstNameInput = screen.getByDisplayValue('John');
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    });

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(personService.updatePerson).toHaveBeenCalledWith({
        id: '1',
        firstName: 'Jane',
        lastName: 'Doe',
      });
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('displays confirmation dialog when delete is clicked', async () => {
    render(
      <PersonCard
        person={mockPerson}
        allPersons={mockAllPersons}
        onUpdate={mockOnUpdate}
        highlighted={false}
      />
    );

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      expect(screen.getByText(/delete this person/i)).toBeInTheDocument();
    });
  });

  it('calls delete service when delete is confirmed', async () => {
    const { personService } = await import('../../services/personService');
    vi.mocked(personService.deletePerson).mockResolvedValue({
      data: undefined,
      success: true,
    });

    render(
      <PersonCard
        person={mockPerson}
        allPersons={mockAllPersons}
        onUpdate={mockOnUpdate}
        highlighted={false}
      />
    );

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Confirm deletion
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(personService.deletePerson).toHaveBeenCalledWith('1');
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('shows highlighted state when highlighted prop is true', () => {
    render(
      <PersonCard
        person={mockPerson}
        allPersons={mockAllPersons}
        onUpdate={mockOnUpdate}
        highlighted={true}
      />
    );

    const card = screen.getByTestId('person-card');
    expect(card).toHaveClass('ring-2', 'ring-blue-500');
  });

  it('displays relationships when available', async () => {
    const { personService } = await import('../../services/personService');
    vi.mocked(personService.getPersonRelationships).mockResolvedValue({
      data: [
        {
          id: 'rel1',
          type: 'parent' as const,
          relatedPersonId: '2',
          relatedPerson: {
            id: '2',
            firstName: 'Jane',
            lastName: 'Doe',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
          verified: true,
        },
      ],
      success: true,
    });

    render(
      <PersonCard
        person={mockPerson}
        allPersons={mockAllPersons}
        onUpdate={mockOnUpdate}
        highlighted={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const { personService } = await import('../../services/personService');
    vi.mocked(personService.updatePerson).mockRejectedValue(new Error('API Error'));

    render(
      <PersonCard
        person={mockPerson}
        allPersons={mockAllPersons}
        onUpdate={mockOnUpdate}
        highlighted={false}
      />
    );

    // Try to update
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/error updating person/i)).toBeInTheDocument();
    });
  });
});
