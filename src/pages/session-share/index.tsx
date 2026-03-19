import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import './session-share.css';

interface ShareAttempt {
  c: string; // courseTitle
  r: number; // reactionTime
  p: number; // percentile
  ok: boolean; // isSuccess
}

interface ShareData {
  d: string; // practiceAt
  t: number; // totalAttempts
  s: number; // successCount
  a: ShareAttempt[];
}

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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSessionCard(data: ShareData): string {
  const dpr = 2;
  const W = 390;
  const pagePad = 16;
  const rowH = 70;
  const brandH = 52;
  const titleH = 50;
  const sepH = 1;
  const infoH = 56;
  const tableHeaderH = 44;
  const footerH = 44;
  const cardPad = 0;

  const totalH =
    pagePad * 2 +
    brandH +
    titleH +
    sepH +
    infoH +
    tableHeaderH +
    data.a.length * rowH +
    footerH +
    cardPad;

  const canvas = document.createElement('canvas');
  canvas.width = W * dpr;
  canvas.height = totalH * dpr;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  // Page background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, W, totalH);

  // White card
  const cardX = pagePad;
  const cardY = pagePad;
  const cardW = W - pagePad * 2;
  const cardH = totalH - pagePad * 2;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.fill();

  // Card drop shadow (via inner glow trick - just a subtle border)
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  roundRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.stroke();

  // Brand: SNUCLEAR
  let cursor = cardY;
  ctx.fillStyle = '#2491c9';
  ctx.font = `bold 20px -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('SNUCLEAR', cardX + 20, cursor + 34);
  cursor += brandH;

  // Title
  ctx.fillStyle = '#111827';
  ctx.font = `600 22px -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
  ctx.fillText('연습 세션 상세 조회', cardX + 20, cursor + 30);
  cursor += titleH;

  // Separator
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(cardX + 20, cursor, cardW - 40, 1);
  cursor += sepH;

  // Info bar
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(cardX, cursor, cardW, infoH);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX, cursor);
  ctx.lineTo(cardX + cardW, cursor);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cardX, cursor + infoH);
  ctx.lineTo(cardX + cardW, cursor + infoH);
  ctx.stroke();

  const dateStr = new Date(data.d).toLocaleDateString('ko-KR');
  ctx.fillStyle = '#374151';
  ctx.font = `13px -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
  const infoText = `${dateStr} 연습   총 시도: ${data.t}회   성공: ${data.s}회   실패: ${data.t - data.s}회`;
  ctx.fillText(infoText, cardX + 20, cursor + 32);
  cursor += infoH;

  // Table header
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(cardX, cursor, cardW, tableHeaderH);
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX, cursor + tableHeaderH);
  ctx.lineTo(cardX + cardW, cursor + tableHeaderH);
  ctx.stroke();

  ctx.fillStyle = '#6b7280';
  ctx.font = `600 13px -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('과목이름', cardX + 20, cursor + 27);
  ctx.textAlign = 'right';
  ctx.fillText('반응속도', cardX + cardW - 90, cursor + 27);
  ctx.fillText('상위%', cardX + cardW - 20, cursor + 27);
  cursor += tableHeaderH;

  // Rows
  data.a.forEach((attempt, index) => {
    const rowY = cursor + index * rowH;

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX, rowY + rowH);
    ctx.lineTo(cardX + cardW, rowY + rowH);
    ctx.stroke();

    // Course title (truncate if needed)
    const maxTitleW = cardW * 0.48;
    ctx.font = `14px -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111827';
    let title = attempt.c;
    while (ctx.measureText(title).width > maxTitleW && title.length > 1) {
      title = title.slice(0, -1);
    }
    if (title !== attempt.c) title += '…';
    ctx.fillText(title, cardX + 20, rowY + 26);

    // Badge
    const badgeText = attempt.ok ? '성공' : '실패';
    const badgeBg = attempt.ok ? '#dcfce7' : '#fee2e2';
    const badgeTextColor = attempt.ok ? '#16a34a' : '#dc2626';
    ctx.font = `bold 11px -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
    const badgeW = ctx.measureText(badgeText).width + 14;
    const badgeX = cardX + 20;
    const badgeY = rowY + 36;
    ctx.fillStyle = badgeBg;
    roundRect(ctx, badgeX, badgeY, badgeW, 20, 10);
    ctx.fill();
    ctx.fillStyle = badgeTextColor;
    ctx.fillText(badgeText, badgeX + 7, badgeY + 14);

    // Reaction time
    ctx.textAlign = 'right';
    ctx.fillStyle = '#374151';
    ctx.font = `14px -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
    ctx.fillText(`${attempt.r}ms`, cardX + cardW - 90, rowY + 38);

    // Percentile
    const pctText = attempt.p ? `${(attempt.p * 100).toFixed(1)}%` : '-';
    ctx.fillText(pctText, cardX + cardW - 20, rowY + 38);
    ctx.textAlign = 'left';
  });

  cursor += data.a.length * rowH;

  // Footer
  ctx.fillStyle = '#9ca3af';
  ctx.font = `12px -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('snuclear.wafflestudio.com', W / 2, cursor + 26);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png');
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
