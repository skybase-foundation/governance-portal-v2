/*

SPDX-FileCopyrightText: © 2023 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { useCallback, useState, ReactChild, CSSProperties } from 'react';
import Jazzicon from './Jazzicon';
import { useEnsName } from 'wagmi';

export interface AvatarProps {
  size: number;
  address: string;
  defaultComponent?: ReactChild | ReactChild[];
  style?: CSSProperties;
}

export function Avatar({ size, address, defaultComponent, style }: AvatarProps): JSX.Element {
  const { data: ensName } = useEnsName({ address: address as `0x${string}` });
  // Served through our own route so the browser never contacts the host in the avatar record
  const avatarUri = ensName ? `/api/avatar/${encodeURIComponent(ensName)}` : undefined;

  const [loaded, setLoaded] = useState(false);

  const onLoad = useCallback(() => {
    setLoaded(true);
  }, [address, avatarUri]);
  let avatarImg: any | null = null;

  const cssStyle = {
    display: loaded ? undefined : 'none',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: `${size}px`,
    ...(style || {})
  };

  if (avatarUri) {
    avatarImg = <img alt="avatar" style={cssStyle} src={avatarUri} onLoad={onLoad} />;
  }

  const defaultAvatar =
    (!avatarUri || !loaded) && address && (defaultComponent || <Jazzicon address={address} size={size} />);

  return (
    <>
      {defaultAvatar}
      {avatarImg}
    </>
  );
}
