import { render } from '@testing-library/react-native';

import { Body, Label } from '@/components/ui';

describe('shared accessible text primitives', () => {
  test('render their content', () => {
    const screen = render(<><Label>Official source</Label><Body>Verified date</Body></>);
    expect(screen.getByText('Official source')).toBeTruthy();
    expect(screen.getByText('Verified date')).toBeTruthy();
  });
});

