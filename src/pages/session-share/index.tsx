import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { drawSessionCard, type ShareData } from '@shared/lib/sessionCardUtils';
import './session-share.css';

function decodeShareData(encoded: string): ShareData {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(bytes)) as ShareData;
}

const SessionSharePage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const { imageUrl, error } = useMemo(() => {
    const encoded = searchParams.get('d');
    if (!encoded) return { imageUrl: null, error: true };
    try {
      const data = decodeShareData(encoded);
      return { imageUrl: drawSessionCard(data), error: false };
    } catch {
      return { imageUrl: null, error: true };
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="session-share-page session-share-error">
        <p>잘못된 링크입니다.</p>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="session-share-page session-share-loading">
        <div className="session-share-spinner" />
      </div>
    );
  }

  return (
    <div className="session-share-page">
      <img
        src={imageUrl}
        alt="연습 세션 결과"
        className="session-share-image"
      />
      <p className="session-share-hint">꾹 눌러서 이미지를 저장하세요</p>
    </div>
  );
};

export default SessionSharePage;
