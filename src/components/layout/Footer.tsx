import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const footerLinks = {
    games: {
      title: 'Games',
      links: [
        { name: 'Casino Games', href: '/games/casino' },
        { name: 'Sports Betting', href: '/games/sports' },
        { name: 'Live Games', href: '/games/live' },
        { name: 'New Releases', href: '/games/new' },
      ]
    },
    support: {
      title: 'Support',
      links: [
        { name: 'Help Center', href: '/support' },
        { name: 'Contact Us', href: '/contact' },
        { name: 'FAQ', href: '/faq' },
        { name: 'Live Chat', href: '/chat' },
      ]
    },
    company: {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Careers', href: '/careers' },
        { name: 'Press', href: '/press' },
        { name: 'Blog', href: '/blog' },
      ]
    },
    legal: {
      title: 'Legal',
      links: [
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Responsible Gaming', href: '/responsible-gaming' },
        { name: 'Licenses', href: '/licenses' },
      ]
    }
  };

  const socialLinks = [
    { name: 'Twitter', href: '#', icon: 'twitter' },
    { name: 'Facebook', href: '#', icon: 'facebook' },
    { name: 'Instagram', href: '#', icon: 'instagram' },
    { name: 'Discord', href: '#', icon: 'discord' },
  ];

  return (
    <footer className="bg-gaming-darker border-t border-gaming-accent/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-gaming-accent transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gaming-accent/20 pt-8 mb-8">
          <div className="max-w-md">
            <h3 className="text-white font-semibold mb-2">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">
              Get the latest news about new games and promotions.
            </p>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 bg-gaming-dark border border-gaming-accent/30 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gaming-accent/50 focus:border-gaming-accent"
              />
              <button className="px-4 py-2 bg-gaming-accent hover:bg-gaming-accent/90 text-white rounded-lg transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gaming-accent/20 pt-8 flex flex-col md:flex-row justify-between items-center">
          {/* Logo and Copyright */}
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-gaming-accent to-gaming-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="text-white font-gaming font-bold text-xl">
                GamePortal
              </span>
            </div>
            <span className="text-gray-400 text-sm">
              © 2024 GamePortal. All rights reserved.
            </span>
          </div>

          {/* Social Links */}
          <div className="flex space-x-4">
            {socialLinks.map((social) => (
              <Link
                key={social.name}
                href={social.href}
                className="text-gray-400 hover:text-gaming-accent transition-colors"
                aria-label={social.name}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {/* Simple icon placeholders - replace with actual icons */}
                  <div className="w-5 h-5 bg-current rounded opacity-60"></div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Responsible Gaming Notice */}
        <div className="mt-8 pt-4 border-t border-gaming-accent/20">
          <p className="text-gray-500 text-xs text-center">
            Please play responsibly. Gambling can be addictive. If you need help, visit{' '}
            <Link href="/responsible-gaming" className="text-gaming-accent hover:underline">
              our responsible gaming page
            </Link>{' '}
            or contact support.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;