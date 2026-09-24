import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api, AdminChallenge, AdminTeamInfo } from '../../services/api';
import { AdminNav } from './AdminNav';
import { CornerTicks } from '../LoginForm';

export const AdminDashboard: React.FC = () => {
  const { navigateTo } = useGame();
  const [challenges, setChallenges] = useState<AdminChallenge[]>([]);
  const [teams, setTeams] = useState<AdminTeamInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([
        api.adminListChallenges().catch(() => []),
        api.adminListTeams().catch(() => []),
      ]);
      setChallenges(c);
      setTeams(t);
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-6 py-8 scan-faint">
        {loading ? (
          <div className="text-[11px] tracking-[0.3em] text-[#5A6379]">ESTABLISHING COMMAND TELEMETRY…</div>
        ) : (
          <>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="text-[9px] tracking-[0.3em] text-[#E0A83E]">■ COMMAND ARCHIVE OVERVIEW</div>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-wide text-[#F2F5FA]">
                  CTF Admin Dashboard
                </h1>
                <p className="mt-2 text-[12px] text-[#8B93A9] max-w-2xl leading-relaxed">
                  Manage challenges, view teams, and monitor live activity.
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="TOTAL CELLS"
                value={String(teams.length)}
                color="#F2F5FA"
                sub="Registered teams"
              />
              <StatCard
                label="CHALLENGES"
                value={String(challenges.length)}
                color="#D5DBE7"
                sub="Total challenges"
              />
            </div>

            <div className="mt-8">
              <div className="text-[9px] tracking-[0.3em] text-[#E0A83E] mb-3">■ COMMAND SECTIONS</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <NavCard
                  title="LIVE LEADERBOARD"
                  detail="Real-time rankings & scores"
                  sub="Live cell standings, solve stats, and freeze controls"
                  onClick={() => navigateTo('ADMIN_LEADERBOARD')}
                  btnLabel="OPEN LEADERBOARD →"
                />
                <NavCard
                  title="CHALLENGES"
                  detail={`${challenges.length} challenges configured`}
                  sub="Add, edit flags, delete, and manage hints"
                  onClick={() => navigateTo('ADMIN_CHALLENGES')}
                  btnLabel="OPEN CHALLENGES →"
                />
                <NavCard
                  title="CELLS & ROSTER"
                  detail={`${teams.length} teams registered`}
                  sub="View operatives, rosters, and ban/unban cells"
                  onClick={() => navigateTo('ADMIN_TEAMS')}
                  btnLabel="OPEN TEAMS →"
                />
                <NavCard
                  title="LIVE TELEMETRY"
                  detail="Real-time submissions"
                  sub="Real-time submission audit and flag validation"
                  onClick={() => navigateTo('ADMIN_ACTIVITY')}
                  btnLabel="OPEN TELEMETRY →"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

const StatCard: React.FC<{ label: string; value: string; color: string; sub?: string }> = ({
  label,
  value,
  color,
  sub,
}) => (
  <div className="relative border border-[#1E2536] bg-[#0B0E16]/70 px-4 py-3.5 transition-colors hover:border-[#5ED6E3]/40 hover:bg-[#0E131F]">
    <CornerTicks />
    <div className="text-[9px] tracking-[0.25em] text-[#5A6379]">{label}</div>
    <div className="mt-1 text-[17px] font-bold tracking-[0.08em]" style={{ color }}>
      {value}
    </div>
    {sub && <div className="mt-1 text-[10px] text-[#5A6379] truncate">{sub}</div>}
  </div>
);

const NavCard: React.FC<{
  title: string;
  detail: string;
  sub: string;
  onClick: () => void;
  btnLabel: string;
}> = ({ title, detail, sub, onClick, btnLabel }) => (
  <div className="relative border border-[#1E2536] bg-[#0B0E16]/70 p-5 flex flex-col justify-between transition-all hover:border-[#E0A83E]/40 hover:-translate-y-0.5">
    <CornerTicks color="#E0A83E" />
    <div>
      <div className="text-[12px] font-bold tracking-[0.15em] text-[#F2F5FA] font-display">{title}</div>
      <div className="mt-1 text-[11px] text-[#5ED6E3]">{detail}</div>
      <div className="mt-2 text-[11px] text-[#8B93A9] leading-relaxed">{sub}</div>
    </div>
    <button
      onClick={onClick}
      className="mt-5 w-full border border-[#1E2536] py-2 text-[10px] tracking-[0.18em] text-[#5ED6E3] hover:border-[#5ED6E3] hover:bg-[#5ED6E3]/[0.06] cursor-pointer text-center hover:shadow-[0_0_15px_rgba(94,214,227,0.15)]"
    >
      {btnLabel}
    </button>
  </div>
);
