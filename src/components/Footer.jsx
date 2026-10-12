import {
  FaFacebook,
  FaGithub,
  FaGlobe,
  FaInstagram,
  FaEnvelope,
  FaAt,
  FaPhone,
  FaCode,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="landing-footer">
      <section className="footer-cta">
        <h2>Ready to take your club to the next level?</h2>

        <p>
          Join over 500 clubs that are operating more effectively
          <br />
          every day with S-Club.
        </p>

        <button>Start now</button>
      </section>

      <section className="footer-main">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/logo.png" alt="SClub" />

              <h3>S-Club</h3>
            </div>

            <p>
              A next-generation student club
              <br />
              management platform.
            </p>

            <div className="footer-social">
              <a href="#">
                <FaGlobe />
              </a>

              <a href="#">
                <FaFacebook />
              </a>

              <a href="#">
                <FaInstagram />
              </a>

              <a href="#">
                <FaGithub />
              </a>
            </div>
          </div>

          <div>
            <h4>PRODUCT</h4>

            <a href="./landing">Landing Page</a>

            <a href="./pricing">Pricing</a>

            <a href="#">Global Feed</a>
          </div>

          <div>
            <h4>ABOUT US</h4>

            <a href="#">Blog</a>

            <a href="#">Recruitment</a>

            <a href="./terms">Terms</a>
          </div>

          <div>
            <h4>CONTACT</h4>

            <a href="#">
              <FaEnvelope />
              sclub.management.platform@gmail.com
            </a>

            <a href="#">
              <FaPhone />
              0764577656
            </a>
          </div>
        </div>
        <div className="footer-top">
          <span>© 2026 S-Club. All rights reserved.</span>

          <div className="footer-policy">
            <a href="./privacy">Privacy Policy</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </section>
    </footer>
  );
}
