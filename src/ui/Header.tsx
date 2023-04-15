import React from 'react';
import styles from './Header.css';
import { NavLink } from 'react-router-dom'

export default class Header extends React.Component {
  render() {
    return (
      <div className={styles.siteHeader}>
        <NavLink to="/" className={styles.headerLogoLink}>
          <img src="/assets/logo.png" alt="Logo" className={styles.headerLogoImage} />
        </NavLink>
        <ul className={styles.headerMenu}>
          <li>
            <NavLink
              className={styles.navLink}
              to="/equip"
              activeClassName={styles.active}
            >Play</NavLink>
          </li>
          <li>
            <NavLink
              className={styles.navLink}
              to="/champions"
              activeClassName={styles.active}
            >Hall Of Fame</NavLink>
          </li>
        </ul>
        <ul className={[styles.headerMenu, styles.socialMediaList].join(' ')}
          style={{ float: 'right' }}>
          <li>
            <a className={styles.navLink}
              href="http://www.twitter.com"
              target="_blank">Twitter</a>
          </li>
          <li>
            <a className={styles.navLink}
              href="https://discordapp.com"
              target="_blank">Discord</a>
          </li>
        </ul>
      </div>
    );
  }
}
