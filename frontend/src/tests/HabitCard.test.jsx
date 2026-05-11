import { render, screen, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';
import HabitCard from '../components/habits/HabitCard';

const mockToggleComplete = vi.fn().mockResolvedValue(undefined);
const mockDeleteHabit = vi.fn().mockResolvedValue(undefined);

vi.mock('../store/habitStore', () => ({
  useHabits: () => ({
    toggleCompleteOptimistic: mockToggleComplete,
    deleteHabit: mockDeleteHabit,
    isOptimistic: () => false,
    state: { error: null },
  }),
}));

describe('HabitCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and daily badge', () => {
    render(() => <HabitCard habit={{ id: 1, title: 'Read', frequency: 'daily' }} />);
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('Diário')).toBeInTheDocument();
  });

  it('renders weekly badge', () => {
    render(() => <HabitCard habit={{ id: 2, title: 'Gym', frequency: 'weekly' }} />);
    expect(screen.getByText('Semanal')).toBeInTheDocument();
  });

  it('calls toggleCompleteOptimistic with habit id on checkbox change', () => {
    render(() => <HabitCard habit={{ id: 1, title: 'Read', frequency: 'daily' }} />);
    fireEvent.change(screen.getByRole('checkbox'));
    expect(mockToggleComplete).toHaveBeenCalledWith(1);
  });

  it('calls deleteHabit on delete button click', () => {
    render(() => <HabitCard habit={{ id: 1, title: 'Read', frequency: 'daily' }} />);
    fireEvent.click(screen.getByLabelText('Excluir hábito'));
    expect(mockDeleteHabit).toHaveBeenCalledWith(1);
  });
});
