import { ImageResponse } from 'next/og';

export const size = {
  width: 192,
  height: 192,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 96,
          background: 'linear-gradient(135deg, #FAEDF0 0%, #F5DAE0 50%, #E8B4B8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8C4247',
          fontFamily: 'serif',
          fontWeight: 700,
          borderRadius: 40,
          border: '6px solid #C97A7E',
        }}
      >
        G
      </div>
    ),
    {
      ...size,
    }
  );
}
