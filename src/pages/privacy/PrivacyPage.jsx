import { useEffect } from 'react';
import './PrivacyPage.css';

const TITLE = 'Privacy Policy | S-Club';
const DESCRIPTION = 'Read the S-Club Privacy Policy to understand how we access, use, protect, and manage personal information and Google user data.';
const CANONICAL = 'https://sclub.io.vn/privacy';

export default function PrivacyPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = TITLE;
    const updates = [
      ['meta[name="description"]', 'meta', 'name', 'description', 'content', DESCRIPTION],
      ['link[rel="canonical"]', 'link', 'rel', 'canonical', 'href', CANONICAL],
    ].map(([selector, tag, key, value, attribute, content]) => {
      const existing = document.head.querySelector(selector);
      const element = existing || document.createElement(tag);
      const previous = element.getAttribute(attribute);
      if (!existing) { element.setAttribute(key, value); document.head.appendChild(element); }
      element.setAttribute(attribute, content);
      return () => {
        if (element.getAttribute(attribute) !== content) return;
        if (!existing) element.remove();
        else if (previous === null) element.removeAttribute(attribute);
        else element.setAttribute(attribute, previous);
      };
    });
    return () => {
      if (document.title === TITLE) document.title = previousTitle;
      updates.forEach(restore => restore());
    };
  }, []);

  return (
    <main className="privacy-policy-page">
      <article className="privacy-policy-article" aria-labelledby="privacy-policy-title">
        <header className="privacy-policy-header">
          <span className="privacy-policy-brand">S-Club</span>
          <h1 id="privacy-policy-title">Privacy Policy</h1>
          <p className="privacy-policy-updated">Last updated: <time dateTime="2026-10-27">October 27, 2026</time></p>
          <p>S-Club respects your privacy and is committed to protecting your personal information.</p>
        </header>

        <section aria-labelledby="privacy-information">
          <h2 id="privacy-information">Information We Access</h2>
          <p>When you connect your Google account to S-Club, the application may access the following information, depending on the features you choose to use:</p>
          <ul>
            <li>Your Google account email address</li>
            <li>Basic Google profile information</li>
            <li>Google Calendar data required to create, view, update, delete, and synchronize events</li>
            <li>Google Docs data required to create, view, and update documents used through S-Club</li>
            <li>Google Drive files that are created by S-Club or explicitly selected for use with S-Club</li>
          </ul>
        </section>

        <section aria-labelledby="privacy-use">
          <h2 id="privacy-use">How We Use Your Information</h2>
          <p>S-Club uses Google user data only to provide application functionality, including:</p>
          <ul>
            <li>Authenticating users</li>
            <li>Creating and managing S-Club user accounts</li>
            <li>Synchronizing club events with Google Calendar</li>
            <li>Creating and managing Google Docs related to S-Club activities</li>
            <li>Accessing Google Drive files required for S-Club features</li>
          </ul>
          <p>S-Club does not use Google user data for advertising, profiling, or unrelated purposes.</p>
        </section>

        <section aria-labelledby="privacy-retention">
          <h2 id="privacy-retention">Data Storage and Retention</h2>
          <p>S-Club may store information necessary to maintain user accounts and support application functionality.</p>
          <p>Google user data is retained only for as long as necessary to provide S-Club services or fulfill legitimate operational requirements.</p>
        </section>

        <section aria-labelledby="privacy-sharing">
          <h2 id="privacy-sharing">Data Sharing</h2>
          <p>S-Club does not sell, rent, or trade users' personal information.</p>
          <p>Google user data is not shared with third parties except when necessary to provide S-Club functionality or when required by law.</p>
        </section>

        <section aria-labelledby="privacy-security">
          <h2 id="privacy-security">Data Security</h2>
          <p>S-Club applies reasonable technical and organizational measures to protect user data against unauthorized access, disclosure, alteration, or destruction.</p>
        </section>

        <section aria-labelledby="privacy-google">
          <h2 id="privacy-google">Google API Services</h2>
          <p>S-Club's use and transfer of information received from Google APIs will comply with the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
        </section>

        <section aria-labelledby="privacy-control">
          <h2 id="privacy-control">User Control and Data Deletion</h2>
          <p>Users may disconnect their Google account from S-Club at any time.</p>
          <p>Users may also request deletion of their S-Club account and associated personal data by contacting us.</p>
        </section>

        <section aria-labelledby="privacy-contact">
          <h2 id="privacy-contact">Contact</h2>
          <p>If you have any questions about this Privacy Policy or wish to request access to or deletion of your data, please contact:</p>
          <p><strong>Email:</strong> <a href="mailto:sclub.management.platform@gmail.com">sclub.management.platform@gmail.com</a></p>
        </section>
      </article>
    </main>
  );
}
