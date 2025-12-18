import React from 'react'
import ThemeSwitch from '../theme-switch'



const Footer = () => {
  return (
    <footer className=" mt-20 mb-10 text-zinc-600 dark:text-zinc-400 text-sm flex flex-col sm:flex-row gap-4 sm:items-center  justify-between">
    <p>
      &copy; 2025 NextAuth Starter. Built by <a href="https://bendadaabdelmajid.netlify.app/">Abdelmajid Bendada.</a>
    </p>
    <ThemeSwitch className="ml-auto" />
  </footer>
  )
}

export default Footer