import { render, screen } from '@testing-library/react';
import App from './App';
import FeaturedCard from './components/FeaturedCard';
import StandardCard from './components/StandardCard';
import CompactCard from './components/CompactCard';

const NOW = new Date().toISOString();

const sampleFeatured = {
  location: 'Test City',
  temperature: 20,
  condition: 'Clear',
  humidity: 55,
  windSpeed: 10,
  status: 'active',
  priority: 'high',
  updatedAt: NOW,
  description: 'Clear skies expected.',
};

const sampleStandard = {
  location: 'Somewhere',
  temperature: 15,
  condition: 'Cloudy',
  high: 18,
  low: 10,
  status: 'active',
  priority: 'medium',
  updatedAt: NOW,
};

const sampleCompact = {
  location: 'Smalltown',
  temperature: 8,
  condition: 'Rain',
  status: 'warning',
  priority: 'low',
  updatedAt: NOW,
};

// FeaturedCard
test('FeaturedCard renders location and temperature', () => {
  render(<FeaturedCard data={sampleFeatured} />);
  expect(screen.getByText('Test City')).toBeInTheDocument();
  expect(screen.getByText('20°')).toBeInTheDocument();
  expect(screen.getByText('active')).toBeInTheDocument();
  expect(screen.getByText('high')).toBeInTheDocument();
});

test('FeaturedCard renders loading skeleton', () => {
  const { container } = render(<FeaturedCard loading />);
  expect(container.querySelector('.featured-card--loading')).toBeTruthy();
  expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
});

test('FeaturedCard renders empty state', () => {
  render(<FeaturedCard empty />);
  expect(screen.getByText('No featured data available.')).toBeInTheDocument();
});

test('FeaturedCard renders disabled state', () => {
  const { container } = render(<FeaturedCard data={sampleFeatured} disabled />);
  expect(container.querySelector('.featured-card--disabled')).toBeTruthy();
});

// StandardCard
test('StandardCard renders location and temperature', () => {
  render(<StandardCard data={sampleStandard} />);
  expect(screen.getByText('Somewhere')).toBeInTheDocument();
  expect(screen.getByText('15°')).toBeInTheDocument();
});

test('StandardCard renders loading state', () => {
  const { container } = render(<StandardCard loading />);
  expect(container.querySelector('.standard-card--loading')).toBeTruthy();
});

test('StandardCard renders empty state', () => {
  const { container } = render(<StandardCard empty />);
  expect(container.querySelector('.standard-card--empty')).toBeTruthy();
});

test('StandardCard renders disabled state', () => {
  const { container } = render(<StandardCard data={sampleStandard} disabled />);
  expect(container.querySelector('.standard-card--disabled')).toBeTruthy();
});

// CompactCard
test('CompactCard renders location and temperature', () => {
  render(<CompactCard data={sampleCompact} />);
  expect(screen.getByText('Smalltown')).toBeInTheDocument();
  expect(screen.getByText('8°')).toBeInTheDocument();
});

test('CompactCard renders loading state', () => {
  const { container } = render(<CompactCard loading />);
  expect(container.querySelector('.compact-card--loading')).toBeTruthy();
});

test('CompactCard renders empty state', () => {
  render(<CompactCard empty />);
  expect(screen.getByText('No data')).toBeInTheDocument();
});

test('CompactCard renders disabled state', () => {
  const { container } = render(<CompactCard data={sampleCompact} disabled />);
  expect(container.querySelector('.compact-card--disabled')).toBeTruthy();
});

// App smoke test
test('App renders the dashboard header', () => {
  render(<App />);
  expect(screen.getByText('Weather Dashboard')).toBeInTheDocument();
});
