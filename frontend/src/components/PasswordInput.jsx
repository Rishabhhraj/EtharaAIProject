import { useState } from 'react';
import './PasswordInput.css';

export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak' };
  if (score <= 3) return { score: 2, label: 'Fair' };
  return { score: 3, label: 'Strong' };
}

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  required,
  minLength = 6,
  showStrength = false,
  autoComplete,
}) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength ? getPasswordStrength(value) : null;

  return (
    <div className="password-input-wrap">
      <div className="password-input-row">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {showStrength && value && (
        <div className="password-strength" aria-live="polite">
          <div className="password-strength-bar">
            <span className={`strength-fill strength-${strength.score}`} />
          </div>
          <span className="strength-label">{strength.label} — use 10+ chars with mixed case & numbers</span>
        </div>
      )}
    </div>
  );
}
