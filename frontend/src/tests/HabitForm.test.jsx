import { render, screen, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';
import HabitForm from '../components/habits/HabitForm';

const mockCreateHabit = vi.fn().mockResolvedValue(undefined);

vi.mock('../store/habitStore', () => ({
  useHabits: () => ({
    createHabit: mockCreateHabit,
    state: { error: null },
  }),
}));

describe('HabitForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form elements', () => {
    render(() => <HabitForm />);
    expect(screen.getByText('Novo hábito')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByLabelText('Frequência')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar hábito' })).toBeInTheDocument();
  });

  it('submits habit with title and daily frequency', () => {
    render(() => <HabitForm />);
    fireEvent.input(screen.getByLabelText('Título'), { target: { value: 'Meditate' } });
    fireEvent.change(screen.getByLabelText('Frequência'), { target: { value: 'daily' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar hábito' }));
    expect(mockCreateHabit).toHaveBeenCalledWith({ title: 'Meditate', frequency: 'daily' });
  });

  it('submits with weekly frequency', () => {
    render(() => <HabitForm />);
    fireEvent.input(screen.getByLabelText('Título'), { target: { value: 'Gym' } });
    fireEvent.change(screen.getByLabelText('Frequência'), { target: { value: 'weekly' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar hábito' }));
    expect(mockCreateHabit).toHaveBeenCalledWith({ title: 'Gym', frequency: 'weekly' });
  });

  it('does not submit with empty title', () => {
    render(() => <HabitForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar hábito' }));
    expect(mockCreateHabit).not.toHaveBeenCalled();
  });

  it('trims whitespace from title', () => {
    render(() => <HabitForm />);
    fireEvent.input(screen.getByLabelText('Título'), { target: { value: '  Run  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar hábito' }));
    expect(mockCreateHabit).toHaveBeenCalledWith({ title: 'Run', frequency: 'daily' });
  });

  it('button shows Criando… and is disabled while submitting', () => {
    mockCreateHabit.mockImplementation(() => new Promise(() => {}));
    render(() => <HabitForm />);
    fireEvent.input(screen.getByLabelText('Título'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar hábito' }));
    const btn = screen.getByRole('button', { name: 'Criando…' });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });

  it('clears title after successful submit', async () => {
    mockCreateHabit.mockResolvedValue(undefined);
    render(() => <HabitForm />);
    const input = screen.getByLabelText('Título');
    fireEvent.input(input, { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar hábito' }));
    await vi.waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});
