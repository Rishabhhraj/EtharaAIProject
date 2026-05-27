import './Logo.css';

export default function Logo({ size = 'md', showText = true, className = '' }) {
  return (
    <span className={`logo-wrap logo-${size} ${className}`.trim()}>
      <picture>
        <source srcSet="/logo.webp" type="image/webp" />
        <img
        src="/logo.png"
        alt="Team Task Manager logo"
        className="logo-img"
        width={size === 'lg' ? 72 : size === 'md' ? 40 : 32}
        height={size === 'lg' ? 72 : size === 'md' ? 40 : 32}
        loading="lazy"
        decoding="async"
      />
      </picture>
      {showText && <span className="logo-text">Team Task Manager</span>}
    </span>
  );
}
