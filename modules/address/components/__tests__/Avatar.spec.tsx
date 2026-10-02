/*

SPDX-FileCopyrightText: © 2026 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useEnsName } from 'wagmi';
import { Avatar } from '../Avatar';

vi.mock('wagmi', () => ({ useEnsName: vi.fn() }));
vi.mock('../Jazzicon', () => ({ default: () => <div data-testid="jazzicon" /> }));

const ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('Avatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the avatar from our own route and swaps out the Jazzicon once loaded', () => {
    (useEnsName as Mock).mockReturnValue({ data: 'vitalik.eth' });

    render(<Avatar size={40} address={ADDRESS} />);

    const img = screen.getByAltText('avatar');
    expect(img).toHaveAttribute('src', '/api/avatar/vitalik.eth');
    expect(img).toHaveStyle({ display: 'none' });
    expect(screen.getByTestId('jazzicon')).toBeInTheDocument();

    fireEvent.load(img);

    expect(img).not.toHaveStyle({ display: 'none' });
    expect(screen.queryByTestId('jazzicon')).not.toBeInTheDocument();
  });

  it('keeps the Jazzicon when the avatar fails to load', () => {
    (useEnsName as Mock).mockReturnValue({ data: 'nobody.eth' });

    render(<Avatar size={40} address={ADDRESS} />);
    fireEvent.error(screen.getByAltText('avatar'));

    expect(screen.getByTestId('jazzicon')).toBeInTheDocument();
  });

  it('encodes the ENS name in the URL', () => {
    (useEnsName as Mock).mockReturnValue({ data: 'a/b?.eth' });

    render(<Avatar size={40} address={ADDRESS} />);

    expect(screen.getByAltText('avatar')).toHaveAttribute('src', '/api/avatar/a%2Fb%3F.eth');
  });

  it('renders only the Jazzicon when the address has no ENS name', () => {
    (useEnsName as Mock).mockReturnValue({ data: null });

    render(<Avatar size={40} address={ADDRESS} />);

    expect(screen.queryByAltText('avatar')).not.toBeInTheDocument();
    expect(screen.getByTestId('jazzicon')).toBeInTheDocument();
  });
});
