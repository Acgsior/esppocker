import React from 'react';
import { render } from '@testing-library/react';
import CoffeeIcon from '../CoffeeIcon';

describe('CoffeeIcon Component', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<CoffeeIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-6', 'h-6'); // defaults
  });

  it('renders correctly with custom className', () => {
    const { container } = render(<CoffeeIcon className="custom-class" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('custom-class');
  });
});
