import { Link } from 'react-router-dom';
import { Mail, ArrowUpRight } from 'lucide-react';
import MarketingCTA from './MarketingCTA';
import './PublicMarketing.css';

const FOOTER_LINKS = [
  { title: 'Product', links: [['Home','/'],['Features','/features'],['Get Started','/register']] },
  { title: 'Account', links: [['Login','/login'],['Sign Up','/register']] },
  { title: 'Legal', links: [['Privacy Policy','/privacy'],['Terms of Service','/terms']] },
];
export default function Footer() {
  return <footer className="marketing-footer">
    <MarketingCTA/>
    <div className="marketing-footer-main"><div className="marketing-footer-grid">
      <div className="marketing-footer-brand"><Link className="public-brand" to="/" aria-label="S-Club Home"><img src="/logo.png" alt="" width="36" height="36"/><span>S-Club</span></Link><p>S-Club helps student clubs organize members, events, tasks, and daily operations in one place.</p><span className="marketing-footer-tag">Built around your club.</span></div>
      {FOOTER_LINKS.map(group=><section key={group.title} aria-label={group.title}><h2>{group.title}</h2>{group.links.map(([label,to])=><Link key={label} to={to}>{label}</Link>)}</section>)}
      <section className="marketing-footer-contact" aria-label="Contact"><h2>Contact</h2><span>Let’s keep in touch.</span><a href="mailto:sclub.management.platform@gmail.com"><Mail size={16} aria-hidden="true"/><span>sclub.management.platform@gmail.com</span><ArrowUpRight size={13} aria-hidden="true"/></a></section>
    </div><div className="marketing-footer-bottom"><span>© {new Date().getFullYear()} S-Club. All rights reserved.</span><span>More connected. Better organized.</span></div></div>
  </footer>;
}
