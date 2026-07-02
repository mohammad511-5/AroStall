import { Shield, Lock, Eye } from 'lucide-react';

export function SecurityBadge() {
  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-blue-200 font-semibold text-sm mb-1">Secure Authentication</h4>
          <ul className="text-blue-300/80 text-xs space-y-1">
            <li className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Passwords are encrypted with industry-standard security
            </li>
            <li className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Your transaction history is private and secure
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
