import React from 'react';
import ThemeSwitch from '../theme-switch';

const Footer = () => {
  return (
    <footer className='bg-card text-foreground text-sm'>
      <div className='p-5 max-w-7xl mx-auto flex  justify-between items-center'>
        <p>
          &copy; 2025 NextAuth Starter. Built by{' '}
          <a href='https://bendadaabdelmajid.netlify.app/'>Abdelmajid Bendada.</a>
        </p>
        <ThemeSwitch className='ml-auto' />
      </div>
    </footer>
  );
};

export default Footer;
