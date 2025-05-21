import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const googleLogin = async () => {
  try {
    // 기존 세션이 꼬였거나 만료된 경우를 대비해, 로그인 전에 강제 로그아웃을 시도
    try {
      await logout();
    } catch (e) {
      // 이미 로그아웃 상태여도 무시
    }
    // 팝업 방식으로 로그인
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const token = await user.getIdToken(true);

    // JWT 저장 전, 기존 모든 jwt/토큰/세션을 확실히 삭제
    localStorage.removeItem("jwt");
    sessionStorage.removeItem("jwt");
    Object.keys(localStorage).forEach(key => {
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage).forEach(key => {
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
        sessionStorage.removeItem(key);
      }
    });

    const res = await fetch("/api/auth/login_firebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const resultData = await res.json();
    if (resultData.status === "success") {
      localStorage.setItem("jwt", resultData.token);
      console.log("[googleLogin] JWT 저장 완료:", resultData.token);
      window.location.reload();
      return resultData;
    } else {
      localStorage.removeItem("jwt");
      sessionStorage.removeItem("jwt");
      // 안내 메시지 개선: 팝업 차단 안내 추가
      let msg = resultData.message || "유효하지 않은 Firebase 토큰입니다. 다시 로그인 해주세요.\n\n" +
        "팝업 차단이 되어 있거나, 서버와 클라이언트의 Firebase 프로젝트가 다를 수 있습니다.\n" +
        "팝업 차단 해제 및 관리자에게 문의하세요.";
      if (msg && msg.includes("팝업 차단")) {
        msg += "\n\n※ 구글 로그인 팝업이 차단된 경우, 브라우저의 팝업 차단 해제 후 다시 시도해 주세요.\n" +
          "주소창 오른쪽에 팝업 차단 알림이 표시될 수 있습니다.";
      }
      alert("[구글 로그인 실패]\n" + msg);
      console.error("[googleLogin] 서버에서 JWT 발급 실패:", resultData.message);
      throw new Error(resultData.message || "Login failed");
    }
  } catch (error) {
    // 팝업 차단 에러 직접 안내
    if (error.code === "auth/popup-blocked") {
      alert(
        "[구글 로그인 실패]\n구글 로그인 팝업이 차단되었습니다. 브라우저의 팝업 차단 기능을 해제하고 다시 시도해 주세요.\n" +
        "주소창 오른쪽에 팝업 차단 알림이 표시될 수 있습니다."
      );
      console.error("Login error: popup blocked", error);
      throw error;
    }
    try { await logout(); } catch {}
    // 안내 메시지 개선: 팝업 차단 안내 추가
    let msg = error.message || "유효하지 않은 Firebase 토큰입니다. 다시 로그인 해주세요.\n\n" +
      "팝업 차단이 되어 있거나, 서버와 클라이언트의 Firebase 프로젝트가 다를 수 있습니다.\n" +
      "팝업 차단 해제 및 관리자에게 문의하세요.";
    if (msg && msg.includes("팝업 차단")) {
      msg += "\n\n※ 구글 로그인 팝업이 차단된 경우, 브라우저의 팝업 차단 해제 후 다시 시도해 주세요.\n" +
        "주소창 오른쪽에 팝업 차단 알림이 표시될 수 있습니다.";
    }
    alert("[구글 로그인 실패]\n" + msg);
    console.error("Login error:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    // Firebase v9+ 인증 로그아웃
    await signOut(auth);
    // firebase compat 인증 로그아웃 (혹시 모를 세션 잔존 방지)
    // 수정: compat app이 이미 초기화된 경우에만 compat 로그아웃 시도
    if (firebase.apps && firebase.apps.length > 0 && firebase.auth && firebase.auth().currentUser) {
      await firebase.auth().signOut();
    }
    // 모든 토큰/세션 삭제
    localStorage.removeItem("jwt");
    sessionStorage.removeItem("jwt");
    Object.keys(localStorage).forEach(key => {
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage).forEach(key => {
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// 회원탈퇴(계정삭제) 함수 예시
export const deleteAccount = async () => {
  try {
    // 서버에 회원탈퇴 요청
    const response = await fetch("/api/account/delete", { method: "POST" });
    // 로그아웃 처리 (토큰/세션 완전 삭제)
    await logout();
    return await response.json();
  } catch (error) {
    // 예외 발생 시에도 토큰/세션 삭제 시도
    await logout();
    throw error;
  }
};

export const secureFetch = async (url, options = {}) => {
  const token = localStorage.getItem("jwt");
  // 디버깅: 토큰 값과 Authorization 헤더 로그 출력
  // console.log("[secureFetch] JWT in localStorage:", token); // 제거
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  // if (headers.Authorization) {
  //   console.log("[secureFetch] Authorization header:", headers.Authorization);
  // } else {
  //   console.warn("[secureFetch] No Authorization header set for", url);
  // }

  // JWT가 없으면 인증이 필요한 API 호출을 하지 않도록 early return
  if (!token) {
    // console.warn("[secureFetch] JWT가 없으므로 인증 요청을 중단합니다:", url);
    return null;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    // credentials: "include", // 쿠키 인증이 아니라면 주석 처리
  });

  if (res.status === 401 || res.status === 403) {
    // console.warn("Unauthorized request:", url);
    return null;
  }

  return res;
};

export const secureFetchJson = async (url, options = {}) => {
  const res = await secureFetch(url, options);
  if (!res) return null;

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    console.warn(`Not a JSON response: ${contentType}`);
    return null;
  }

  return await res.json();
};

export const onAuthStateChangedListener = (callback) => {
  onAuthStateChanged(auth, callback);
};