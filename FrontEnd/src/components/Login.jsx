import { useState } from "react";
import axios from "axios";
import "./Login.css";

export default function Login({ onLogin, onGuestContinue }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // 클라이언트 측 유효성 검사
    if (isSignUp) {
      if (!username.trim()) {
        setError("ID를 입력하세요");
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
        // 회원가입
        const res = await axios.post("http://localhost:4000/api/auth/signup", {
          username: username.trim(),
          password: password.trim(),
        });
        
        if (res.data && res.data.success) {
          onLogin(res.data.userid, res.data.username);
        } else {
          setError(res.data?.message || "회원가입 실패");
          setLoading(false);
        }
      } else {
        // 로그인
        const res = await axios.post("http://localhost:4000/api/auth/login", {
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
      console.error("오류 상세:", err.response);
      
      let errorMessage = "오류가 발생했습니다";
      
      if (err.response) {
        // 서버 응답이 있는 경우
        errorMessage = err.response.data?.message || `서버 오류 (${err.response.status})`;
      } else if (err.request) {
        // 요청은 보냈지만 응답이 없는 경우
        errorMessage = "서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.";
      } else {
        // 요청 설정 중 오류
        errorMessage = err.message || "요청 설정 중 오류가 발생했습니다";
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
          
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type={isSignUp ? "text" : "password"}
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
              setConfirmPassword("");
            }}
          >
            {isSignUp ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
          </button>
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

