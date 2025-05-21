import React from 'react';
import { Link } from 'react-router-dom';

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL;

const Footer = () => (
  <footer style={{
    width: "100%",
    background: "#f5f7fa",
    color: "#888",
    fontSize: 15,
    padding: "24px 0 12px 0",
    textAlign: "center",
    borderTop: "1px solid #e3e8ee",
    marginTop: 40
  }}>
    <div style={{ marginBottom: 8 }}>
      &copy; {new Date().getFullYear()} SuperPlato. All rights reserved.
    </div>
    <div>
      <a
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#1976d2", textDecoration: "underline", marginRight: 12 }}
      >
        이용약관
      </a>
      <Link to="/bug-report" style={{ color: "#1976d2", textDecoration: "underline", marginRight: 12 }}>
        버그 신고
      </Link>
      <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#1976d2", textDecoration: "underline" }}>
        문의: {CONTACT_EMAIL}
      </a>
    </div>
  </footer>
);

export default Footer;