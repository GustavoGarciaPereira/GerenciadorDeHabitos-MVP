import { render, screen, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';
import HabitCard from '../components/habits/HabitCard';

const mockCompleteHabit = vi.fn().mockResolvedValue(undefined);
const mockDeleteHabit = vi.fn().mockResolvedValue(undefined);

vi.mock('../store/habitStore', () => ({
  useHabits: () => ({
    completeHabit: mockCompleteHabit,
    deleteHabit: mockDeleteHabit,
    state: { error: null },
  }),
}));

function todayLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return '' + yyyy + '-' + mm + '-' + dd;
}

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

  it('calls completeHabit with today local date on checkbox change', () => {
    render(() => <HabitCard habit={{ id: 1, title: 'Read', frequency: 'daily' }} />);
    fireEvent.change(screen.getByRole('checkbox'));
    expect(mockCompleteHabit).toHaveBeenCalledWith(1, todayLocal());
  });

  it('disables checkbox while completing', () => {
    mockCompleteHabit.mockImplementation(() => new Promise(() => {}));
    render(() => <HabitCard habit={{ id: 1, title: 'Read', frequency: 'daily' }} />);
    const cb = screen.getByRole('checkbox');
    fireEvent.change(cb);
    expect(cb).toBeDisabled();
  });

  it('calls deleteHabit on delete button click', () => {
    render(() => <HabitCard habit={{ id: 1, title: 'Read', frequency: 'daily' }} />);
    fireEvent.click(screen.getByLabelText('Excluir hábito'));
    expect(mockDeleteHabit).toHaveBeenCalledWith(1);
  });
});
