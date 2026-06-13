import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import CreateGrooming from '../CreateGrooming';
import { useGrooming } from '../../context/GroomingContext';

jest.mock('../../context/GroomingContext', () => ({
  useGrooming: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('CreateGrooming Component', () => {
  const createGroomingMock = jest.fn();
  const navigateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(navigateMock);
    useGrooming.mockReturnValue({
      createGrooming: createGroomingMock,
      loading: false,
      error: null,
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <CreateGrooming />
      </MemoryRouter>
    );
  };

  it('renders default state', () => {
    renderComponent();
    expect(screen.getByText('Espresso Grooming Poker v4')).toBeInTheDocument();
    expect(screen.getByLabelText('Grooming Name')).toBeInTheDocument();
  });

  it('submits with FIBONACCI template', async () => {
    createGroomingMock.mockResolvedValueOnce('room-123');
    renderComponent();

    fireEvent.change(screen.getByLabelText('Grooming Name'), { target: { value: 'Sprint 42' } });
    fireEvent.click(screen.getByRole('button', { name: /Start Grooming/i }));

    await waitFor(() => {
      expect(createGroomingMock).toHaveBeenCalledWith('Sprint 42', ['0', '0.5', '1', '2', '3', '5', '8', '13', 'Skip']);
      expect(navigateMock).toHaveBeenCalledWith('/grooming/room-123');
    });
  });

  it('submits with CUSTOM template and valid ranges', async () => {
    createGroomingMock.mockResolvedValueOnce('room-custom');
    renderComponent();

    fireEvent.change(screen.getByLabelText('Grooming Name'), { target: { value: 'Custom Sprint' } });
    
    // Switch to Custom Range
    const customRadio = screen.getByDisplayValue('CUSTOM');
    fireEvent.click(customRadio);

    // Default inputs are 0, 100, 10. Let's change them to 1, 5, 2
    // The inputs don't have aria-labels, but we added htmlFor in the component
    const startInput = screen.getByLabelText('Start');
    const maxInput = screen.getByLabelText('Max');
    const stepInput = screen.getByLabelText('Step');

    fireEvent.change(startInput, { target: { value: '1' } });
    fireEvent.change(maxInput, { target: { value: '5' } });
    fireEvent.change(stepInput, { target: { value: '2' } });

    // Ensure preview is shown
    expect(screen.getByText('1-3')).toBeInTheDocument();
    expect(screen.getByText('3-5')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Start Grooming/i }));

    await waitFor(() => {
      expect(createGroomingMock).toHaveBeenCalledWith('Custom Sprint', ['1-3', '3-5', 'Skip']);
    });
  });

  it('submits with CUSTOM template where next > max', async () => {
    createGroomingMock.mockResolvedValueOnce('room-custom2');
    renderComponent();

    fireEvent.change(screen.getByLabelText('Grooming Name'), { target: { value: 'Custom Sprint 2' } });
    
    // Switch to Custom Range
    const customRadio = screen.getByDisplayValue('CUSTOM');
    fireEvent.click(customRadio);

    // Make step exceed max so next > max happens
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Max'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Step'), { target: { value: '5' } });

    // Preview should show 1-4
    expect(screen.getByText('1-4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Start Grooming/i }));

    await waitFor(() => {
      expect(createGroomingMock).toHaveBeenCalledWith('Custom Sprint 2', ['1-4', 'Skip']);
    });
  });

  it('shows preview truncation when items > 10', () => {
    renderComponent();
    
    // Switch to Custom Range
    const customRadio = screen.getByDisplayValue('CUSTOM');
    fireEvent.click(customRadio);

    // Make many items
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Max'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Step'), { target: { value: '1' } });

    // Ensure preview truncation happens
    expect(screen.getByText('... (19 total)')).toBeInTheDocument();
  });

  it('falls back to FIBONACCI if CUSTOM range is invalid', async () => {
    createGroomingMock.mockResolvedValueOnce('room-invalid');
    renderComponent();

    fireEvent.change(screen.getByLabelText('Grooming Name'), { target: { value: 'Invalid Custom' } });
    
    const customRadio = screen.getByDisplayValue('CUSTOM');
    fireEvent.click(customRadio);

    const startInput = screen.getByLabelText('Start');
    const maxInput = screen.getByLabelText('Max');

    // Invalid range: start > max
    fireEvent.change(startInput, { target: { value: '10' } });
    fireEvent.change(maxInput, { target: { value: '5' } });

    expect(screen.getByText('Invalid range')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Start Grooming/i }));

    await waitFor(() => {
      expect(createGroomingMock).toHaveBeenCalledWith('Invalid Custom', ['0', '0.5', '1', '2', '3', '5', '8', '13', 'Skip']);
    });
  });

  it('renders loading state', () => {
    useGrooming.mockReturnValue({
      createGrooming: createGroomingMock,
      loading: true,
      error: null,
    });
    renderComponent();
    expect(screen.getByText('Brewing grooming...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    useGrooming.mockReturnValue({
      createGrooming: createGroomingMock,
      loading: false,
      error: 'Failed to create room',
    });
    renderComponent();
    expect(screen.getByText('Failed to create room')).toBeInTheDocument();
  });

  it('does not navigate if groomingId is null', async () => {
    createGroomingMock.mockResolvedValueOnce(null);
    renderComponent();

    fireEvent.change(screen.getByLabelText('Grooming Name'), { target: { value: 'Failed Sprint' } });
    fireEvent.click(screen.getByRole('button', { name: /Start Grooming/i }));

    await waitFor(() => {
      expect(createGroomingMock).toHaveBeenCalled();
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });
  
  it('does not submit if grooming name is empty', () => {
    renderComponent();
    const btn = screen.getByRole('button', { name: /Start Grooming/i });
    expect(btn).toBeDisabled();
    
    fireEvent.change(screen.getByLabelText('Grooming Name'), { target: { value: '   ' } });
    expect(btn).toBeDisabled();
    
    fireEvent.submit(screen.getByRole('button').closest('form'));
    expect(createGroomingMock).not.toHaveBeenCalled();
  });

  it('can switch template back to FIBONACCI', () => {
    renderComponent();
    const customRadio = screen.getByDisplayValue('CUSTOM');
    const fibRadio = screen.getByDisplayValue('FIBONACCI');
    
    // Switch to CUSTOM
    fireEvent.click(customRadio);
    expect(customRadio).toBeChecked();
    
    // Switch back to FIBONACCI
    fireEvent.click(fibRadio);
    expect(fibRadio).toBeChecked();
  });
});
