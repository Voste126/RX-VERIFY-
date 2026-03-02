import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface Rule {
  label: string;
  test: (password: string) => boolean;
}

const RULES: Rule[] = [
  { label: 'At least 8 characters',  test: (p) => p.length >= 8 },
  { label: 'At least 1 uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'At least 1 number',      test: (p) => /[0-9]/.test(p) },
  { label: 'At least 1 special character (!@#$…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

/** Returns true only when all 4 password rules are satisfied */
export const passwordMeetsAllRules = (password: string): boolean =>
  RULES.every((rule) => rule.test(password));

interface Props {
  password: string;
}

const PasswordStrengthIndicator: React.FC<Props> = ({ password }) => {
  if (password.length === 0) return null;

  return (
    <ul className="mt-2 flex flex-col gap-1">
      {RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <li key={rule.label} className="flex items-center gap-2">
            {passed ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            )}
            <span className={`text-xs ${passed ? 'text-green-400' : 'text-gray-400'}`}>
              {rule.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default PasswordStrengthIndicator;
