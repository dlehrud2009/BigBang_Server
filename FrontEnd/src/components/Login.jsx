import { useState } from "react";
import axios from "axios";
import { supabase } from "./supabaseClient";
import "./Login.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

export default function Login({ onLogin, onGuestContinue }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 비밀번호 검증 함수
  const validatePassword = (pwd) => {
    const errors = [];
    
    if (pwd.length < 8) {
      errors.push("비밀번호는 8자 이상이어야 합니다");
    }
    
    if (!/[A-Z]/.test(pwd)) {
      errors.push("비밀번호에 대문자가 포함되어야 합니다");
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      errors.push("비밀번호에 특수문자가 포함되어야 합니다");
    }
    
    return errors;
  };

  // 비밀번호 재설정
  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError("이메일을 입력해주세요");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // 프로덕션과 개발 환경 모두 지원
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : window.location.origin;
        
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        emailRedirectTo: redirectUrl
      });

      if (error) throw error;

      setMessage("✅ 비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요.");
      setLoading(false);
    } catch (err) {
      setError("비밀번호 재설정 실패: " + err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    // 클라이언트 측 유효성 검사
    if (isSignUp) {
      if (!username.trim()) {
        setError("ID를 입력하세요");
        return;
      }
      if (!email.trim()) {
        setError("이메일을 입력하세요");
        return;
      }
      if (!password.trim()) {
        setError("비밀번호를 입력하세요");
        return;
      }
      
      // 비밀번호 강도 검증
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        setError(passwordErrors.join(", "));
        return;
      }
      
      if (password !== confirmPassword) {
        setError("비밀번호가 일치하지 않습니다");
        return;
      }
    } else {
      if (!username.trim()) {
        setError("사용자 이름을 입력하세요");
        return;
      }
      if (!password.trim()) {
        setError("비밀번호를 입력하세요");
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Supabase 이메일 회원가입
        const signupRedirect = `${window.location.origin}/auth-confirmation`;

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              username: username.trim()
            },
            emailRedirectTo: signupRedirect
          }
        });

        if (authError) throw authError;

        // 백엔드에도 저장
        const res = await axios.post(`${API_BASE}/api/auth/signup`, {
          username: username.trim(),
          password: password.trim(),
          email: email.trim(),
          supabase_id: authData.user?.id
        });
        
        if (res.data && res.data.success) {
          setMessage("✅ 회원가입 성공! 이메일을 확인하여 인증을 완료해주세요.");
          setLoading(false);
          // 이메일 확인 후 로그인하도록 안내
        } else {
          setError(res.data?.message || "회원가입 실패");
          setLoading(false);
        }
      } else {
        // Supabase 이메일 로그인
        // 먼저 기존 방식으로 시도
        const res = await axios.post(`${API_BASE}/api/auth/login`, {
          username: username.trim(),
          password: password.trim(),
        });
        
        if (res.data && res.data.success) {
          onLogin(res.data.userid, res.data.username);
        } else {
          setError(res.data?.message || "로그인 실패");
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("로그인/회원가입 오류:", err);
      
      let errorMessage = "오류가 발생했습니다";
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response) {
        errorMessage = err.response.data?.message || `서버 오류 (${err.response.status})`;
      } else if (err.request) {
        errorMessage = "서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.";
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">🌌 우주 시뮬레이션</h1>
        <h2 className="login-subtitle">{isSignUp ? "회원가입" : "로그인"}</h2>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">{isSignUp ? "ID" : "사용자 이름"}</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder={isSignUp ? "ID를 입력하세요" : "사용자 이름을 입력하세요"}
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@gmail.com"
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={isSignUp ? "비밀번호를 입력하세요 (8자 이상, 대문자, 특수문자 포함)" : "비밀번호를 입력하세요"}
              minLength={isSignUp ? 8 : 4}
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="비밀번호를 다시 입력하세요"
                minLength={8}
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {message && (
            <div style={{
              background: 'rgba(79, 208, 231, 0.2)',
              border: '1px solid rgba(79, 208, 231, 0.5)',
              color: '#4fd0e7',
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '0.9em'
            }}>
              {message}
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
          </button>
        </form>

        <div className="login-switch">
          <button
            type="button"
            className="switch-button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setMessage("");
              setEmail("");
              setConfirmPassword("");
            }}
          >
            {isSignUp ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
          </button>

          {/* 비밀번호 재설정 버튼 추가 */}
          {!isSignUp && (
            <button
              type="button"
              className="switch-button"
              onClick={() => {
                const userEmail = prompt("비밀번호를 재설정할 이메일 주소를 입력하세요:");
                if (userEmail) {
                  setEmail(userEmail);
                  handleResetPassword();
                }
              }}
              style={{ marginTop: '10px' }}
            >
              비밀번호를 잊으셨나요?
            </button>
          )}
        </div>

        {onGuestContinue && (
          <div className="guest-continue">
            <button
              type="button"
              className="guest-button"
              onClick={onGuestContinue}
            >
              게스트로 계속하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}