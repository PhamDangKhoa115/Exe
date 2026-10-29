import { Link, NavLink } from 'react-router-dom';
import './PublicMarketing.css';

export default function PublicNavbar() {
  return <nav className="public-nav landing-nav" aria-label="Public navigation">
    <Link className="public-brand" to="/" aria-label="S-Club Home"><img src="/logo.png" alt="" width="36" height="36"/><span>S-Club</span></Link>
    <div className="public-nav-links"><NavLink to="/" end>Home</NavLink><NavLink to="/features">Features</NavLink></div>
    <div className="public-nav-account"><Link to="/login">Login</Link><Link to="/register" className="public-signup">Sign Up</Link></div>
  </nav>;
}
