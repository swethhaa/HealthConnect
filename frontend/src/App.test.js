import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the HealthConnect sign-in page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'HealthConnect' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
});
