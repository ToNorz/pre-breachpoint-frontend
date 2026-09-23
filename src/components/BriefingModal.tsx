import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { getCharacterForSpeaker } from '../data/charactersData';
import { PATH_SKINS } from '../data/pathsData';
import { toSlides } from '../data/storyData';
import { soundFx } from '../utils/audio';

/**
 * Pre-transmission briefing, typed out a slide at a time.
 *
 * The words are the server's `pre_story` for that challenge, split into slides
 * client-side; the face and name fronting them are the path's lead, which is
 * presentation the API has no column for.
 */
export const BriefingModal: React.FC = () => {
  const { showBriefingModal, closeBriefing, briefingChallenge, navigateTo } = useGame();

  const slides = useMemo(
    () => (briefingChallenge?.preStory ? toSlides(briefingChallenge.preStory) : []),
    [briefingChallenge?.preStory],
  );
  const speaker = briefingChallenge ? PATH_SKINS[briefingChallenge.pathId].lead : '';
  const character = getCharacterForSpeaker(speaker);

  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState('');

  useEffect(() => {
    setIdx(0);
    setShown('');
  }, [briefingChallenge?.slot, showBriefingModal]);

  useEffect(() => {
    if (!showBriefingModal) return;
    const full = slides[idx] || '';
    let i = 0;
    setShown('');
    const t = setInterval(() => {
      if (i < full.length) setShown(full.slice(0, ++i));
      else clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [idx, showBriefingModal, slides]);

  if (!showBriefingModal || !briefingChallenge || slides.length === 0) return null;

  const enterChallenge = () => {
    soundFx.playClick();
    closeBriefing();
    navigateTo('CHALLENGE', briefingChallenge.slot);
  };

  const next = () => {
    soundFx.playClick();
    if (idx < slides.length - 1) {
      setIdx((v) => v + 1);
    } else {
      enterChallenge();
    }
  };

  const prev = () => {
    soundFx.playClick();
    if (idx > 0) {
      setIdx((v) => v - 1);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl border border-[#1E2536] bg-[#0B0E16] px-6 py-5">
        <div className="text-[10px] tracking-[0.3em] text-[#8B93A9] flex justify-between">
          <span>WITNESS LOG · {briefingChallenge.slot}</span>
          <button onClick={closeBriefing} className="hover:text-[#E84D7E] transition-colors cursor-pointer">CLOSE ✕</button>
        </div>
        <div className="mt-2 text-[12px] text-[#8B93A9]">
          <span className="text-[#5ED6E3] font-medium">{character.name}</span> — PATH {briefingChallenge.pathId} ·{' '}
          {briefingChallenge.title}
        </div>
        <div onClick={next} className="mt-6 min-h-[140px] cursor-pointer">
          <p className="font-lore text-2xl leading-relaxed text-[#F2F5FA]">{shown}</p>
        </div>
        <div className="mt-8 flex items-center justify-between">
          <span className="text-[11px] text-[#8B93A9]">{idx + 1} / {slides.length}</span>
          <div className="flex gap-5 text-[12px] font-semibold tracking-[0.15em]">
            <button
              id="btn-briefing-prev"
              onClick={prev}
              disabled={idx === 0}
              className="text-[#8B93A9] hover:text-[#F2F5FA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              ← PREV
            </button>
            <button
              id="btn-briefing-skip-to-challenge"
              onClick={enterChallenge}
              className="text-[#8B93A9] hover:text-[#5ED6E3] transition-colors cursor-pointer"
            >
              SKIP
            </button>
            <button
              id="btn-briefing-next"
              onClick={next}
              className="text-[#5ED6E3] border-b border-[#5ED6E3] pb-0.5 hover:brightness-125 cursor-pointer"
            >
              {idx < slides.length - 1 ? 'NEXT →' : 'FACE IT →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
