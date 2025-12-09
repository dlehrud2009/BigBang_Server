import { useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function AuthConfirmation() {
  useEffect(() => {
    // Supabase가 제공하는 URL에서 세션을 추출해 저장할 수 있으면 시도합니다.
    // 실패해도 사용자에게 메시지를 보여주는 것에는 영향이 없습니다.
    (async () => {
      try {
        if (supabase && supabase.auth && typeof supabase.auth.getSessionFromUrl === 'function') {
          await supabase.auth.getSessionFromUrl({ storeSession: true });
        }
      } catch (err) {
        // 무시: 메시지는 여전히 보여줌
        console.warn('getSessionFromUrl failed', err);
      }
    })();
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0b1020',
      color: '#e6f7ff'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        padding: '28px',
        borderRadius: '12px',
        textAlign: 'center',
        maxWidth: '520px'
      }}>
        <h2 style={{ marginBottom: '12px' }}>✅ 인증이 완료되었습니다!</h2>
        <p style={{ marginBottom: '20px' }}>이 창은 닫으셔도 됩니다.</p>
        <p style={{ fontSize: '0.85em', color: '#9fb6c6' }}>브라우저가 자동으로 로그인되지 않는 경우, 앱으로 돌아가 수동으로 로그인해 주세요.</p>
      </div>
    </div>
  );
}
