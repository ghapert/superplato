import React from 'react';

const TERMS = [
  {
    title: "제1조 (목적)",
    content: `이 약관은 운영기관이 제공하는 SuperPlato 서비스와 관련하여, 운영기관과 이용자 간의 권리·의무 및 기타 필요한 사항을 정함을 목적으로 합니다.`
  },
  {
    title: "제2조 (정의)",
    content: (
      <ul style={{ marginLeft: 18 }}>
        <li>1. <b>서비스</b>: 운영기관이 제공하는 시간표 기반 자동 출석 처리, 출석 기록 조회, ProKey 인증 기능 등을 포함한 통합 출석 자동화 플랫폼을 의미합니다.</li>
        <li>2. <b>이용자</b>: 이 약관에 동의하고 운영기관이 제공하는 서비스를 이용하는 개인 또는 법인을 말합니다.</li>
        <li>3. <b>ProKey</b>: 운영기관이 인증한 이용자를 대상으로 제공되는 유료 또는 제한된 기능 활성화 수단을 의미합니다.</li>
        <li>4. <b>Pro 이용자</b>: ProKey를 등록하여 Pro 기능을 활성화한 이용자를 의미합니다.</li>
      </ul>
    )
  },
  {
    title: "제3조 (약관의 효력 및 변경)",
    content: (
      <ul style={{ marginLeft: 18 }}>
        <li>1. 이 약관은 서비스 화면에 게시하거나 기타 적절한 방법을 통해 공지함으로써 그 효력이 발생합니다.</li>
        <li>2. 운영기관은 관련 법령의 개정, 서비스 정책의 개선 등 합리적인 사유가 있는 경우에 이 약관을 변경할 수 있습니다. 변경된 약관은 제1항과 같은 방법으로 공지함으로써 효력을 갖습니다.</li>
        <li>3. 이용자가 변경된 약관에 동의하지 않을 경우, 이용계약을 해지할 수 있으며 계속해서 서비스를 이용할 경우 변경된 약관에 동의한 것으로 간주됩니다.</li>
      </ul>
    )
  },
  {
    title: "제4조 (서비스의 제공 및 변경)",
    content: (
      <>
        <div>1. 운영기관은 다음 각 호의 서비스를 제공합니다.</div>
        <ul style={{ marginLeft: 18 }}>
          <li>1. 강의 시간표 기반 자동 출석 처리 기능</li>
          <li>2. 출석 성공 로그 및 통계 기능</li>
          <li>3. ProKey 인증을 통한 확장 기능 제공</li>
          <li>4. 출석 자동화 관련 기술 지원</li>
        </ul>
        <div>2. 운영기관은 서비스 운영상 또는 기술적인 필요에 따라 서비스의 내용을 변경하거나 종료할 수 있으며, 이 경우 사전 공지를 통해 안내합니다.</div>
      </>
    )
  },
  {
    title: "제5조 (서비스 이용자의 의무)",
    content: (
      <>
        <div>이용자는 다음 각 호의 행위를 하여서는 안 됩니다.</div>
        <ul style={{ marginLeft: 18 }}>
          <li>1. 서비스 이용 신청 또는 변경 시 허위 정보를 등록하는 행위</li>
          <li>2. 타인의 정보를 무단으로 도용하거나 ProKey를 무단으로 사용하는 행위</li>
          <li>3. 운영기관 또는 제3자의 지식재산권, 명예, 프라이버시 등을 침해하는 행위</li>
          <li>4. 서비스 운영을 고의로 방해하거나 서버에 과도한 부하를 유발하는 행위</li>
          <li>5. 기타 불법적이거나 부당한 목적으로 서비스를 이용하는 행위</li>
        </ul>
      </>
    )
  },
  {
    title: "제6조 (ProKey 등록 및 관리)",
    content: (
      <ul style={{ marginLeft: 18 }}>
        <li>1. ProKey는 운영기관이 지정한 방법에 따라 등록되며, 서비스의 고급 기능을 활성화하는 인증 수단입니다.</li>
        <li>2. ProKey는 이용자 1인당 1개로 제한하며, 양도·판매·대여·공유는 엄격히 금지합니다.</li>
        <li>3. ProKey가 등록되는 시점부터 해당 이용자는 Pro 이용자로 간주되며, Pro 기능을 사용할 수 있습니다.</li>
        <li>4. ProKey 분실, 유출, 무단 사용 등으로 인한 모든 책임은 이용자 본인에게 있으며, 운영기관은 이에 대해 책임을 지지 않습니다.</li>
      </ul>
    )
  },
  {
    title: "제7조 (지적재산권)",
    content: (
      <ul style={{ marginLeft: 18 }}>
        <li>1. 서비스와 관련하여 운영기관이 제공·개발하는 모든 소프트웨어, 디자인, 텍스트, 이미지, 로고 등 일체의 자료에 대한 저작권 및 지식재산권은 운영기관에게 귀속됩니다.</li>
        <li>2. 이용자는 운영기관의 사전 서면 동의 없이 서비스를 역설계, 무단 복제, 배포, 전송, 가공 또는 기타 방법으로 이용할 수 없습니다.</li>
      </ul>
    )
  },
  {
    title: "제8조 (서비스 이용의 제한 및 해지)",
    content: (
      <>
        <div>1. 운영기관은 이용자가 이 약관을 위반하거나 다음 각 호의 사유가 발생하는 경우, 사전 통지 없이 서비스 이용을 제한하거나 이용계약을 해지할 수 있습니다.</div>
        <ul style={{ marginLeft: 18 }}>
          <li>1. ProKey를 무단 공유 또는 유출한 경우</li>
          <li>2. 비정상적인 트래픽을 유발하는 행위</li>
          <li>3. 서버 또는 데이터의 무결성을 훼손하는 행위</li>
        </ul>
        <div>2. 이용계약이 해지된 경우, 이용자의 정보는 운영기관의 내부 정책에 따라 일정 기간 보관된 후 삭제됩니다.</div>
      </>
    )
  },
  {
    title: "제9조 (면책조항)",
    content: (
      <ul style={{ marginLeft: 18 }}>
        <li>1. 운영기관은 천재지변, 통신 장애, 서버 장애 등 불가항력적인 사유로 인해 발생한 서비스 이용 중단에 대해 책임을 지지 않습니다.</li>
        <li>2. 운영기관은 이용자가 서비스를 통해 기대하는 특정 목적, 효과, 정확성, 신뢰성 등에 대해 보증하지 않으며, 출결 실패로 인해 발생하는 학사적 불이익에 대해서도 책임지지 않습니다.</li>
      </ul>
    )
  },
  {
    title: "제10조 (준거법 및 관할)",
    content: (
      <ul style={{ marginLeft: 18 }}>
        <li>1. 이 약관은 대한민국 법률에 따라 해석 및 적용됩니다.</li>
        <li>2. 서비스 이용과 관련하여 분쟁이 발생할 경우, 운영기관의 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.</li>
      </ul>
    )
  }
];

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

const TERMS_UPDATED_AT = import.meta.env.VITE_TERMS_UPDATED_AT;
const TERMS_EFFECTIVE_AT = import.meta.env.VITE_TERMS_EFFECTIVE_AT;

const Terms = () => (
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
        SuperPlato 이용약관
      </div>
      <div style={{ color: "#888", fontSize: 15, marginBottom: 24 }}>
        최종 갱신일: {TERMS_UPDATED_AT}
      </div>
      <div style={{ marginBottom: 32, color: "#444", fontWeight: 500, fontSize: 17 }}>
        본 이용약관(이하 “약관”)은 SuperPlato(이하 “운영기관”이라 합니다)가 제공하는 웹기반 출결 자동화 서비스(이하 “서비스”)의 이용과 관련하여, 운영기관과 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
        <br />
        <span style={{ color: "#888", fontSize: 15 }}>
          적용일: {TERMS_EFFECTIVE_AT}
        </span>
      </div>
      <Divider />
      {TERMS.map((item, idx) => (
        <section key={idx} style={{ marginBottom: 36 }}>
          <SectionTitle>{item.title}</SectionTitle>
          <div style={{ fontSize: 16, color: "#222" }}>
            {item.content}
          </div>
        </section>
      ))}
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
        📌 본 약관에 동의함으로써, 이용자는 SuperPlato 서비스를 정당하게 사용할 권리를 부여받습니다.
        <div style={{ marginTop: 18, fontWeight: 500, fontSize: 15, color: "#1976d2" }}>
          SuperPlato는 이용자의 개인정보를 안전하게 보호하며,<br />
          자세한 사항은&nbsp;
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 700 }}
          >
            개인정보 처리방침
          </a>
          &nbsp;을 통해 확인하실 수 있습니다.
        </div>
      </div>
    </div>
    {/* 기존 푸터 완전 제거 */}
    {/* PrivacyPolicy와 동일한 푸터만 남김 */}
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

export default Terms;
