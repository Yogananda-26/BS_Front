import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaBuilding, FaTwitter, FaLinkedin, FaGithub } from "react-icons/fa";

/* ── Brand tokens aligned to index.css steel-blue palette ── */
const BRAND = {
  primary:     "#1B4F72",
  primaryMid:  "#2E86C1",
  primaryDark: "#154360",
  accent:      "#E67E22",
  dark:        "#0E2233",        /* deeper than index.css --primary-darker for footer depth */
  border:      "rgba(255,255,255,0.10)",
  mutedText:   "rgba(255,255,255,0.55)",
};

const Footer = () => (
  <>
    <style>{`
      .bs-footer {
        background: linear-gradient(180deg, ${BRAND.dark} 0%, #07131E 100%);
        color: ${BRAND.mutedText};
        padding: 72px 0 28px;
      }
      .bs-footer-wordmark {
        font-weight: 800;
        letter-spacing: -0.04em;
        color: #fff;
        font-size: 1.25rem;
      }
      .bs-footer-brand-icon {
        width: 34px; height: 34px;
        background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryMid});
        border-radius: 9px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        flex-shrink: 0;
      }
      .bs-footer-body {
        color: ${BRAND.mutedText};
        font-size: 0.92rem;
        line-height: 1.65;
        max-width: 300px;
      }
      .bs-footer-heading {
        color: #fff;
        font-weight: 700;
        font-size: 0.8rem;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        margin-bottom: 1.1rem;
      }
      .bs-footer-link {
        display: block;
        color: ${BRAND.mutedText};
        text-decoration: none;
        padding: 0.32rem 0;
        font-size: 0.92rem;
        transition: color 0.2s ease, padding-left 0.2s ease;
      }
      .bs-footer-link:hover {
        color: #fff;
        padding-left: 4px;
      }
      .bs-footer-social {
        width: 36px; height: 36px;
        border-radius: 50%;
        background: rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.7);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        transition: all 0.2s ease;
        border: 1px solid rgba(255,255,255,0.1);
      }
      .bs-footer-social:hover {
        background: ${BRAND.primary};
        color: #fff;
        border-color: ${BRAND.primary};
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(27,79,114,0.45);
      }
      .bs-footer-divider {
        border-top: 1px solid rgba(255,255,255,0.08);
        margin-top: 48px;
        padding-top: 24px;
        font-size: 0.82rem;
        color: rgba(255,255,255,0.38);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .bs-footer-divider a {
        color: rgba(255,255,255,0.42);
        text-decoration: none;
        transition: color 0.2s ease;
      }
      .bs-footer-divider a:hover { color: #fff; }

      /* Accent line at very top of footer */
      .bs-footer-accent-bar {
        height: 3px;
        background: linear-gradient(90deg, ${BRAND.primary}, ${BRAND.primaryMid}, ${BRAND.accent});
      }

      @media (max-width: 767.98px) {
        .bs-footer { padding: 56px 0 24px; }
        .bs-footer-body { max-width: 100%; }
      }
    `}</style>

    <footer className="bs-footer">
      <div className="bs-footer-accent-bar" />
      <Container style={{ paddingTop: "2.5rem" }}>
        <Row className="g-4 g-md-5">

          {/* Brand col */}
          <Col xs={12} md={4} lg={4}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="bs-footer-brand-icon"><FaBuilding size={15} /></span>
              <span className="bs-footer-wordmark">BuildSmart</span>
            </div>
            <p className="bs-footer-body">
              The operating system for modern construction. Plan, build, and monitor every project from one platform.
            </p>
            <div className="d-flex gap-2 mt-4">
              <a href="#" className="bs-footer-social" aria-label="Twitter"><FaTwitter size={14} /></a>
              <a href="#" className="bs-footer-social" aria-label="LinkedIn"><FaLinkedin size={14} /></a>
              <a href="#" className="bs-footer-social" aria-label="GitHub"><FaGithub size={14} /></a>
            </div>
          </Col>

          {/* Platform */}
          <Col xs={6} md={2} lg={2}>
            <div className="bs-footer-heading">Platform</div>
            <a href="#services" className="bs-footer-link">Site Operations</a>
            <a href="#services" className="bs-footer-link">Finance</a>
            <a href="#services" className="bs-footer-link">Safety</a>
            <a href="#services" className="bs-footer-link">Reports</a>
          </Col>

          {/* Resources */}
          <Col xs={6} md={2} lg={2}>
            <div className="bs-footer-heading">Resources</div>
            <a href="#" className="bs-footer-link">Documentation</a>
            <a href="#faq" className="bs-footer-link">Help Center</a>
            <a href="#" className="bs-footer-link">Status</a>
            <a href="#" className="bs-footer-link">API</a>
          </Col>

          {/* Legal */}
          <Col xs={6} md={2} lg={2}>
            <div className="bs-footer-heading">Legal</div>
            <a href="#" className="bs-footer-link">Privacy</a>
            <a href="#" className="bs-footer-link">Terms</a>
            <a href="#" className="bs-footer-link">Cookies</a>
            <a href="#" className="bs-footer-link">Security</a>
          </Col>
        </Row>

        {/* Bottom bar */}
        <div className="bs-footer-divider">
          <span>© {new Date().getFullYear()} BuildSmart. All rights reserved.</span>
          <span className="d-flex gap-3 flex-wrap">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </span>
        </div>
      </Container>
    </footer>
  </>
);

export default Footer;
export { Footer };
