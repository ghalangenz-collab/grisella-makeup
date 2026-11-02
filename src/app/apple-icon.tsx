import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 84,
          background: 'linear-gradient(135deg, #FAEDF0 0%, #F5DAE0 50%, #E8B4B8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8C4247',
          fontFamily: 'serif',
          fontWeight: 700,
          borderRadius: 36,
          border: '4px solid #C97A7E',
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
