import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

// Mock test - would need proper testing setup
describe('Button Component', () => {
  it('should render with correct text', () => {
    const buttonText = 'Test Button';
    render(<Button>{buttonText}</Button>);
    
    const button = screen.getByRole('button', { name: buttonText });
    expect(button).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Loading Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});