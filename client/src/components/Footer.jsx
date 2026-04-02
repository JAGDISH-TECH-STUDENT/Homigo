import { Link } from 'react-router-dom';

const COLUMNS = [
  {
    title: 'Support',
    links: ['Help Centre', 'AirCover', 'Anti-discrimination', 'Disability support', 'Cancellation options', 'Report neighbourhood concern'],
  },
  {
    title: 'Hosting',
    links: ['Homigo your home', 'AirCover for Hosts', 'Hosting resources', 'Community forum', 'Hosting responsibly', 'Join a free Hosting class'],
  },
  {
    title: 'Company',
    links: ['Newsroom', 'New features', 'Careers', 'Investors', 'Gift cards', 'Homigo.org emergency stays'],
  },
  {
    title: 'Community',
    links: ['Diversity & Belonging', 'Accessibility', 'Homigo Associates', 'Frontline Stays', 'Guest Referrals', 'Homigo.org'],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-columns">
          {COLUMNS.map(col => (
            <div key={col.title} className="footer-column">
              <h4>{col.title}</h4>
              <ul>
                {col.links.map(link => (
                  <li key={link}><Link to="/">{link}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <hr />
        <div className="footer-bottom">
          <span className="footer-brand">Homigo</span>
          <span>&copy; {new Date().getFullYear()} Homigo, Inc. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
