import React, { useEffect } from 'react';
import { CornerTicks } from './LoginForm';

interface TermsModalProps {
  isOpen: boolean;
  onAcceptAll: () => void;
  onClose: () => void;
}

export const TERMS_CONDITIONS_DATA = [
  {
    code: 'SEC.01',
    title: 'OPERATIONAL SCOPE & TARGET BOUNDARIES',
    content:
      'All security assessments, exploit execution, payload testing, and reverse engineering must be strictly confined to designated challenge instances, challenge targets, and endpoints. Any scanning, probing, exploitation, or denial-of-service against core BreachPoint infrastructure, authentication services, scoring databases, or fellow operatives is strictly forbidden and constitutes an immediate violation of operational conduct.',
  },
  {
    code: 'SEC.02',
    title: 'INTEGRITY OF INTEL & FLAG CONFINEMENT',
    content:
      'Flags (format: BreachPoint{...}), decryption tokens, and algorithmic breakthroughs acquired during the investigation are classified and tied exclusively to your registered operative profile and cell. Inter-team flag sharing, cross-cell collusion, public publication of solutions, or social engineering of event marshals before the official conclusion will lead to immediate disqualification.',
  },
  {
    code: 'SEC.03',
    title: 'RULES OF ENGAGEMENT & NO BRUTE-FORCE',
    content:
      'Automated credential stuffing, brute-forcing login gates or flag input fields, denial-of-service (DoS/DDoS) floods, and resource exhaustion against shared challenge sandboxes are unauthorized. Exploitation must be surgical, analytical, and respectful of shared event infrastructure.',
  },
  {
    code: 'SEC.04',
    title: 'ACTIVE TELEMETRY & SUBMISSION AUDITING',
    content:
      'All network transmissions, token exchanges, flag submissions, timestamps, and IP addresses are actively monitored and logged. Event marshals reserve the right to audit solution artifacts, request proof-of-concept scripts, or conduct technical interviews to verify authentic solves prior to leaderboard ratification.',
  },
  {
    code: 'SEC.05',
    title: 'ORGANISATION JURISDICTION & FINAL DISPOSITION',
    content:
      'The organizers retain absolute authority over challenge validity, dynamic scoring adjustments, hint pricing, skip quotas, penalty assessments, and operative sanctions. In all matters concerning event administration, arbitration, rules interpretation, and operative conduct: it is the organisation decision.',
  },
];

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onAcceptAll, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 bg-black/85 scan-faint"
      role="dialog"
      aria-modal="true"
      aria-label="Terms and Conditions"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl border border-[#2B354C] bg-[#0A0D15]/98 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <CornerTicks />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1E2536] pb-3">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.3em] text-[#5ED6E3]">
              INCIDENT DIRECTIVE // RULES OF ENGAGEMENT
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight text-[#F2F5FA]">
              Terms & Conditions
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] font-mono font-bold tracking-[0.2em] text-[#8B93A9] hover:text-[#E84D7E] transition-colors cursor-pointer"
          >
            [ CLOSE ✕ ]
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="mt-4 flex-1 overflow-y-auto pr-2 space-y-4 text-[#C6CCDA] text-[12.5px] leading-relaxed font-mono">
          <p className="text-[11.5px] text-[#8B93A9] border-l-2 border-[#5ED6E3] pl-3 py-0.5">
            Read all articles carefully before deploying into the BreachPoint environment. You must accept all terms to be provisioned as an operative.
          </p>

          {TERMS_CONDITIONS_DATA.map((t) => (
            <div key={t.code} className="border border-[#1E2536] bg-[#07090F] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-[0.2em] text-[#5ED6E3]">
                  {t.title}
                </span>
                <span className="text-[10px] tracking-[0.2em] text-[#5A6379] font-bold">
                  {t.code}
                </span>
              </div>
              <p className="mt-2 text-[12px] text-[#A6B2C8] leading-relaxed">
                {t.content}
              </p>
            </div>
          ))}

          {/* Final Organization Decision Highlight Box */}
          <div className="border border-[#5ED6E3]/40 bg-[#5ED6E3]/[0.06] p-4 text-[#F2F5FA]">
            <div className="text-[10.5px] font-bold tracking-[0.25em] text-[#5ED6E3] uppercase">
              GOVERNING DIRECTIVE // FINAL STIPULATION
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-[#D5DBE7]">
              Participation in BreachPoint is contingent upon strict adherence to these rules of engagement. All adjudications, dispute resolutions, and disciplinary measures remain exclusively under the discretion of the event leadership. In the end, <span className="text-[#5ED6E3] font-bold underline underline-offset-4">it is the organisation decision</span>.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 pt-4 border-t border-[#1E2536] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[10.5px] tracking-[0.15em] text-[#8B93A9]">
            MANDATORY ACCEPTANCE TO PROCEED
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-[#2B354C] text-[#8B93A9] hover:text-[#F2F5FA] hover:border-[#8B93A9] text-[11px] font-bold tracking-[0.2em] transition-colors cursor-pointer"
            >
              DECLINE
            </button>
            <button
              type="button"
              id="btn-accept-all-terms"
              onClick={onAcceptAll}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-[#5ED6E3] hover:bg-[#7CE3EE] text-[#06232A] text-[11.5px] font-bold tracking-[0.25em] transition-colors cursor-pointer shadow-[0_0_15px_rgba(94,214,227,0.25)] hover:shadow-[0_0_20px_rgba(94,214,227,0.4)]"
            >
              ACCEPT ALL & PROCEED →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
