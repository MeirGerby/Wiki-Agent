import { useState } from 'react';
import objectThumb from '../../assets/object-thumb.png';

export function ObjectThumbnail({ src }: { src: string }) {
  const [hasFailed, setHasFailed] = useState(false);

  return (
    <img
      src={!src || hasFailed ? objectThumb : src}
      alt=""
      width={64}
      height={48}
      onError={() => setHasFailed(true)}
      className="h-12 w-16 shrink-0 rounded-[4px] object-cover"
    />
  );
}
