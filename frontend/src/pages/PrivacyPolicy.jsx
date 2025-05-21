import React from "react";

const Divider = () => (
  <div
    style={{
      borderTop: "1.5px solid #e3e8ee",
      margin: "32px 0 32px 0",
      width: "100%",
    }}
  />
);

const SectionTitle = ({ children }) => (
  <div
    style={{
      color: "#1976d2",
      fontWeight: 800,
      fontSize: 22,
      margin: "40px 0 14px 0",
      letterSpacing: "-0.5px",
    }}
  >
    {children}
  </div>
);

const PRIVACY_MANAGER_NAME = import.meta.env.VITE_PRIVACY_MANAGER_NAME;
const PRIVACY_MANAGER_EMAIL = import.meta.env.VITE_PRIVACY_MANAGER_EMAIL;
const PRIVACY_POLICY_UPDATED_AT = import.meta.env.VITE_PRIVACY_POLICY_UPDATED_AT;
const PRIVACY_POLICY_EFFECTIVE_AT = import.meta.env.VITE_PRIVACY_POLICY_EFFECTIVE_AT;

const PrivacyPolicy = () => (
  <div
    className="page-bg"
    style={{
      minHeight: "100vh",
      padding: "56px 0 0 0",
      background: "#fafdff",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "0 0 80px 0",
        background: "none",
        borderRadius: 0,
        boxShadow: "none",
        fontSize: 16,
        lineHeight: 1.8,
        color: "#222",
        flex: "1 0 auto",
      }}
    >
      <div
        style={{
          marginBottom: 18,
          color: "#1976d2",
          fontWeight: 900,
          fontSize: 36,
          letterSpacing: "-1px",
        }}
      >
        SuperPlato 개인정보 처리방침
      </div>
      <div style={{ color: "#888", fontSize: 15, marginBottom: 24 }}>
        최종 갱신일: {PRIVACY_POLICY_UPDATED_AT}
      </div>
      <div
        style={{
          marginBottom: 32,
          color: "#444",
          fontWeight: 500,
          fontSize: 17,
        }}
      >
        SuperPlato(이하 “당사” 또는 “서비스”)는 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 안전하게 보호하고 이와 관련된 고충을 신속하고 원활하게 처리하기 위해 다음과 같이 개인정보 처리방침을 수립·공개합니다.
      </div>
      <Divider />

      <SectionTitle>1. 총칙</SectionTitle>
      <div style={{ marginBottom: 12, fontWeight: 700, color: "#1976d2" }}>1.1 목적</div>
      <div style={{ marginBottom: 16 }}>
        본 개인정보 처리방침은 이용자의 개인정보를 보호하고, 관련 법령 및 정부 지침을 준수하기 위해 당사가 취하고 있는 조치와 절차를 안내하기 위한 것입니다.
      </div>
      <div style={{ marginBottom: 12, fontWeight: 700, color: "#1976d2" }}>1.2 적용 범위</div>
      <div style={{ marginBottom: 16 }}>
        본 방침은 SuperPlato 웹사이트, 모바일 애플리케이션 및 기타 SuperPlato에서 제공하는 모든 온라인 서비스(이하 통칭하여 “서비스”)를 이용하는 이용자에게 적용됩니다.
      </div>
      <div style={{ marginBottom: 12, fontWeight: 700, color: "#1976d2" }}>1.3 용어 정의</div>
      <ul style={{ marginLeft: 18, marginBottom: 16 }}>
        <li>
          <b>JWT(Json Web Token):</b> JSON 형식으로 정보를 전달하는 보안 토큰으로, 사용자 인증 정보를 안전하게 관리하기 위한 기술입니다.
        </li>
        <li>
          <b>암호화 저장:</b> 개인정보를 안전하게 보호하기 위해 복호화 키 없이 복구할 수 없도록 특수 처리된 형태로 저장하는 방식을 말합니다.
        </li>
        <li>
          그 외 용어의 정의는 관련 법령 및 당사의 이용약관에 따릅니다.
        </li>
      </ul>
      <Divider />

      <SectionTitle>2. 개인정보의 수집 항목 및 수집 방법</SectionTitle>
      <div style={{ marginBottom: 12, fontWeight: 700, color: "#1976d2" }}>2.1 수집 항목</div>
      <div style={{ marginBottom: 8 }}>당사는 다음과 같은 개인정보 항목을 수집·이용합니다.</div>
      <ul style={{ marginLeft: 18, marginBottom: 8 }}>
        <li><b>필수 항목</b></li>
        <ul style={{ marginLeft: 18 }}>
          <li>이름</li>
          <li>부산대학교 학번</li>
          <li>부산대학교 PLATO 로그인 비밀번호(암호화 저장)</li>
          <li>부산대학교 PLATO 로그인 쿠키(암호화 저장, PLATO 로그인 자동화 시 인증 세션 유지 목적)</li>
          <li>Firebase UID(외부 로그인 식별자)</li>
          <li>출석 정보(강의 ID, 출석 시각 등)</li>
          <li>수강 강의 정보</li>
        </ul>
      </ul>
      <div style={{ marginBottom: 12, fontWeight: 700, color: "#1976d2" }}>2.2 수집 방법</div>
      <ul style={{ marginLeft: 18, marginBottom: 8 }}>
        <li>회원가입 또는 서비스 이용 과정에서 이용자가 직접 입력</li>
        <li>자동화된 장치를 통해 서비스 이용 시 생성되는 정보를 수집(출석 이력, 접속 로그 등)</li>
      </ul>
      <div style={{ marginBottom: 12, fontWeight: 700, color: "#1976d2" }}>2.3 쿠키(Cookie)의 사용</div>
      <div style={{ marginBottom: 16 }}>
        SuperPlato는 사용자 인증 및 세션 관리를 위해 JWT 방식을 사용하며, 자체적으로는 브라우저 쿠키를 직접 저장하거나 활용하지 않습니다. 다만, Firebase Authentication 등 제3자 서비스를 이용하는 과정에서, 또는 이용자의 브라우저 설정에 따라 일부 쿠키가 자동으로 저장될 수 있습니다. 이는 로그인 유지 등 최소한의 기능적 목적을 위해 제한적으로 사용됩니다.
      </div>
      <Divider />

      <SectionTitle>3. 개인정보의 처리 목적</SectionTitle>
      <div style={{ marginBottom: 8 }}>
        당사는 수집한 개인정보를 다음의 목적으로 처리합니다.
      </div>
      <ul style={{ marginLeft: 18, marginBottom: 16 }}>
        <li>PLATO 로그인 자동화를 통한 출석 처리</li>
        <li>출석 이력 관리 및 열람 제공</li>
        <li>수강 강의 확인 및 자동 출석 설정 기능 제공</li>
        <li>관리자 권한 판단 및 기능 제어</li>
        <li>고급(Pro) 기능 제공 여부 확인</li>
      </ul>
      <Divider />

      <SectionTitle>4. 개인정보의 보유·이용 기간</SectionTitle>
      <div style={{ marginBottom: 12, fontWeight: 700, color: "#1976d2" }}>4.1 원칙적 보유 기간</div>
      <ul style={{ marginLeft: 18, marginBottom: 8 }}>
        <li>당사는 이용자의 개인정보를 회원 탈퇴 시 또는 개인정보 삭제 요청 시 지체 없이 파기합니다.</li>
      </ul>
      <div style={{ marginBottom: 12, fontWeight: 700, color: "#1976d2" }}>4.2 예외적 보유</div>
      <ul style={{ marginLeft: 18, marginBottom: 16 }}>
        <li>법령에서 별도로 보관 의무가 정해진 경우, 해당 법령에서 정한 기간 동안 보관합니다.</li>
        <li>서비스 로그(출석 기록)는 내부 운영 정책에 따라 최대 1년간 보관하며, 기간 경과 후 즉시 파기합니다.</li>
      </ul>
      <Divider />

      <SectionTitle>5. 개인정보의 제3자 제공</SectionTitle>
      <div style={{ marginBottom: 12, fontWeight: 700, color: "#1976d2" }}>5.1 제3자 제공 원칙</div>
      <ul style={{ marginLeft: 18, marginBottom: 8 }}>
        <li>당사는 사전에 명시된 범위를 초과하여 이용자의 개인정보를 제3자에게 제공하지 않습니다.</li>
        <li>법령에 따라 수사 목적으로 국가기관의 요구가 있을 경우 등, 법령에서 정한 절차와 방법에 따라 개인정보를 제공할 수 있습니다.</li>
      </ul>
      <div style={{ marginBottom: 12, fontWeight: 700, color: "#1976d2" }}>5.2 PLATO 시스템 로그인</div>
      <ul style={{ marginLeft: 18, marginBottom: 16 }}>
        <li>PLATO 시스템 로그인은 이용자가 명시적으로 자동 출석을 요청한 경우에만 수행됩니다.</li>
        <li>로그인에 필요한 암호화된 비밀번호 정보는 외부에 제공되거나 타인에게 전달되지 않습니다.</li>
      </ul>
      <Divider />

      <SectionTitle>6. 개인정보 처리의 위탁</SectionTitle>
      <ul style={{ marginLeft: 18, marginBottom: 16 }}>
        <li>현재 당사는 이용자의 개인정보를 외부 전문업체에 위탁하여 처리하지 않습니다.</li>
        <li>추후 위탁이 필요한 경우, 최소 7일 전 홈페이지 또는 서비스 내 공지사항을 통해 사전 고지하고, 위탁받는 자와 위탁업무 내용을 명확히 안내한 뒤 이용자 동의를 받겠습니다.</li>
      </ul>
      <Divider />

      <SectionTitle>7. 개인정보의 파기 절차 및 방법</SectionTitle>
      <ul style={{ marginLeft: 18, marginBottom: 16 }}>
        <li>파기 절차: 회원 탈퇴 또는 삭제 요청 시 지체 없이 해당 정보를 파기합니다.</li>
        <li>파기 방법: 전자 파일은 영구 삭제하고, 종이 출력물은 분쇄 또는 소각합니다.</li>
      </ul>
      <Divider />

      <SectionTitle>8. 이용자 권리·의무 및 행사 방법</SectionTitle>
      <ul style={{ marginLeft: 18, marginBottom: 16 }}>
        <li>이용자는 언제든지 자신의 개인정보에 대해 조회, 수정, 삭제를 요청할 수 있습니다.</li>
        <li>당사는 관련 요청을 접수한 후 5영업일 이내에 처리하고 그 결과를 안내합니다.</li>
      </ul>
      <Divider />

      <SectionTitle>9. 개인정보 보호책임자 및 담당부서</SectionTitle>
      <ul style={{ marginLeft: 18, marginBottom: 16 }}>
        <li>이름: {PRIVACY_MANAGER_NAME}</li>
        <li>이메일: <a href={`mailto:${PRIVACY_MANAGER_EMAIL}`} style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 700 }}>{PRIVACY_MANAGER_EMAIL}</a></li>
      </ul>
      <div style={{ marginBottom: 16 }}>
        개인정보 보호책임자는 이용자의 개인정보 관련 문의·요청을 성실히 답변합니다.
      </div>
      <Divider />

      <SectionTitle>10. 개인정보의 안전성 확보 조치</SectionTitle>
      <ul style={{ marginLeft: 18, marginBottom: 16 }}>
        <li>개인정보 암호화 저장 및 전송</li>
        <li>접근 권한 관리 및 제한</li>
        <li>정기 내부 점검 실시</li>
        <li>침입차단시스템(방화벽) 운영</li>
      </ul>
      <Divider />

      <SectionTitle>11. 개인정보 국외 이전</SectionTitle>
      <div style={{ marginBottom: 16 }}>
        당사는 서비스 제공 및 데이터 저장 목적으로 국외 서비스(Firebase 등)를 이용할 수 있으며, 이 과정에서 일부 개인정보가 국외로 이전될 수 있습니다. 이 경우 「개인정보 보호법」에 따라 필요한 조치를 취해 안전하게 보호합니다.
      </div>
      <Divider />

      <SectionTitle>12. 정보주체의 권익침해에 대한 구제방법</SectionTitle>
      <div style={{ marginBottom: 8 }}>
        개인정보 침해로 인해 상담이 필요하시거나 분쟁이 발생한 경우, 아래 기관에 도움을 요청하실 수 있습니다.
      </div>
      <ul style={{ marginLeft: 18, marginBottom: 16 }}>
        <li>개인정보분쟁조정위원회: <a href="https://www.kopico.go.kr" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>kopico.go.kr</a> / 1833-6972</li>
        <li>개인정보침해신고센터: <a href="https://privacy.kisa.or.kr" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>privacy.kisa.or.kr</a> / 국번 없이 118</li>
        <li>대검찰청 사이버수사과: <a href="https://www.spo.go.kr" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>spo.go.kr</a> / 국번 없이 1301</li>
        <li>경찰청 사이버안전국: <a href="https://cyberbureau.police.go.kr" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>cyberbureau.police.go.kr</a> / 국번 없이 182</li>
      </ul>
      <Divider />

      <SectionTitle>13. 고지의 의무</SectionTitle>
      <div style={{ marginBottom: 16 }}>
        본 개인정보 처리방침은 {PRIVACY_POLICY_EFFECTIVE_AT}부터 적용되며, 중요한 내용 변경이 있을 경우 최소 7일 전부터 공지합니다.
      </div>
      <Divider />

      <SectionTitle>부칙</SectionTitle>
      <ul style={{ marginLeft: 18, marginBottom: 16 }}>
        <li>본 방침에 명시되지 않은 사항은 관련 법령 및 내부 규정에 따릅니다.</li>
        <li>회원 탈퇴 시 즉시 삭제 정책을 엄격히 적용합니다.</li>
        <li>개인정보 보호와 보안성 강화를 위해 연 1회 이상 정기 점검을 실시합니다.</li>
      </ul>
      <div
        style={{
          marginTop: 36,
          padding: "18px 0 0 0",
          borderTop: "1.5px solid #e3e8ee",
          color: "#1976d2",
          fontWeight: 700,
          fontSize: 17,
          textAlign: "center",
        }}
      >
        본 개인정보 처리방침은 SuperPlato 서비스를 이용하시는 모든 이용자에게 적용되며,<br />
        당사는 개인정보 보호 및 안전한 서비스 제공을 위해 최선을 다하겠습니다.
        <div
          style={{
            marginTop: 18,
            fontWeight: 500,
            fontSize: 15,
            color: "#1976d2",
          }}
        >
          (끝)
        </div>
      </div>
    </div>
    <footer
      style={{
        width: "100%",
        maxWidth: 820,
        margin: "0 auto",
        padding: "32px 0 24px 0",
        color: "#aaa",
        fontSize: 14,
        textAlign: "center",
        flexShrink: 0,
      }}
    >
      © {new Date().getFullYear()} SuperPlato. All rights reserved.
    </footer>
  </div>
);

export default PrivacyPolicy;
