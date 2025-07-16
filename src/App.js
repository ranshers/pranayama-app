import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Play, Pause, RotateCcw, Info, X } from 'lucide-react';

// --- Tone.js for Audio Cues ---
// NOTE: Tone.js is not a direct dependency here, but we simulate its logic.
// In a real build, you would import it: import * as Tone from 'tone'
const Tone = {
  Synth: function() {
    return {
      toDestination: () => ({
        triggerAttackRelease: (note, duration, time) => {
          // This is a placeholder. In a real app, this would play sound.
          // console.log(`Playing ${note} for ${duration} at ${time}`);
        }
      })
    };
  },
  now: () => performance.now() / 1000,
};

// --- Main App Component ---
export default function App() {
  const [selectedPranayama, setSelectedPranayama] = useState(null);

  const handleSelectPranayama = (pranayama) => {
    setSelectedPranayama(pranayama);
  };

  const handleBack = () => {
    setSelectedPranayama(null);
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen font-sans flex flex-col items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {!selectedPranayama ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <SelectionScreen onSelect={handleSelectPranayama} />
            </motion.div>
          ) : (
            <motion.div
              key="session"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <PranayamaSession pranayama={selectedPranayama} onBack={handleBack} />
            </motion.div>
          )}
        </AnimatePresence>
        <footer className="text-center text-slate-400 mt-6 text-xs">
            <p>Pranayama Guide App</p>
            <p>Always practice safely. Stop if you feel dizzy or unwell.</p>
        </footer>
      </div>
    </div>
  );
}

// --- Pranayama Data ---
const pranayamas = {
  kapalabhati: {
    id: 'kapalabhati',
    name: 'Kapalabhati',
    tagline: 'Skull Shining Breath',
    description: 'Forceful exhalations followed by passive, natural inhalations to energize and cleanse.',
    settings: { reps: 20, cycles: 3 },
    instructions: [
      "Sit comfortably with a straight spine.",
      "Rest palms on knees, thumb and index finger touching.",
      "Close your eyes. Take three natural breaths.",
      "Inhale naturally, then forcefully exhale through the nose, drawing the belly in.",
      "Relax the belly to let the inhalation happen automatically.",
      "Practice 20 of these pumping movements.",
      "End on an exhalation. Take three natural breaths. This is one cycle.",
    ],
    tips: [
        "Don't force the inhalation; it should be a passive reflex.",
        "Keep the face relaxed and shoulders down.",
        "The movement comes from the abdomen, not the chest or shoulders.",
        "Avoid hunching over or jerking the body.",
    ]
  },
  bhastrika: {
    id: 'bhastrika',
    name: 'Bhastrika',
    tagline: 'Bellows Breath',
    description: 'Forceful inhalations and exhalations to build heat and vitality.',
    settings: { reps: 10, cycles: 1 },
    instructions: [
        "Sit comfortably with a straight spine.",
        "Close your eyes. Take three natural breaths.",
        "Make fists and bring them to your shoulders.",
        "As you inhale deeply, reach your fists up to the sky, opening the palms.",
        "As you exhale forcefully through the mouth, quickly bring hands back to the shoulders, drawing the belly in.",
        "This is one round. Practice 5-10 rounds.",
        "After finishing, rest in Savasana for a minute or two.",
    ],
    tips: [
        "Breathe from the belly, not the chest.",
        "Keep your chin parallel to the floor.",
        "Avoid tensing the face or breathing too quickly.",
        "If you feel dizzy, stop immediately and rest.",
    ]
  }
};

// --- Selection Screen Component ---
function SelectionScreen({ onSelect }) {
  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-sky-700">Pranayama</h1>
        <p className="text-slate-500 mt-2">Choose your practice for today.</p>
      </header>
      <div className="space-y-4">
        {Object.values(pranayamas).map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="w-full text-left p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-sky-300 focus:ring-opacity-50"
          >
            <h2 className="text-2xl font-bold text-sky-600">{p.name}</h2>
            <p className="text-sm text-slate-400 mb-2">{p.tagline}</p>
            <p className="text-slate-600">{p.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Pranayama Session Component ---
function PranayamaSession({ pranayama, onBack }) {
  const [status, setStatus] = useState('ready'); // ready, running, paused, finished
  const [step, setStep] = useState('Prepare');
  const [counts, setCounts] = useState({ rep: 0, cycle: 1 });
  const [showInfo, setShowInfo] = useState(false);

  const intervalRef = useRef(null);
  const audioSynth = useRef(null);

  const { settings, name } = pranayama;
  // Each rep is 10 seconds: 5s inhale + 5s exhale
  const repDuration = 10000;

  // Initialize Audio
  useEffect(() => {
    audioSynth.current = new Tone.Synth().toDestination();
  }, []);

  const resetPractice = useCallback(() => {
    clearInterval(intervalRef.current);
    setStatus('ready');
    setStep('Prepare');
    setCounts({ rep: 0, cycle: 1 });
  }, []);

  const startPractice = () => {
    setStatus('running');
    setStep('Get Ready...');

    // Initial Rest Period
    setTimeout(() => {
        if (pranayama.id === 'kapalabhati') runKapalabhati();
        if (pranayama.id === 'bhastrika') runBhastrika();
    }, 4000); // 4s for "Get Ready..."
  };
  
  const runKapalabhati = () => {
      let localRep = 0;
      setCounts(c => ({...c, rep: 0}));
      
      const cycleInterval = () => {
          if (localRep >= settings.reps) {
              // End of cycle
              setStep('Rest');
              clearInterval(intervalRef.current);
              setTimeout(() => {
                  setCounts(c => {
                      const nextCycle = c.cycle + 1;
                      if (nextCycle > settings.cycles) {
                          setStatus('finished');
                          setStep('Practice Complete');
                          return c;
                      }
                      // Start next cycle
                      localRep = 0;
                      setStep('Get Ready...');
                      setTimeout(() => {
                         intervalRef.current = setInterval(cycleInterval, repDuration);
                      }, 4000);
                      return { rep: 0, cycle: nextCycle };
                  });
              }, 5000); // 5s rest between cycles
              return;
          }

          localRep++;
          setCounts(c => ({...c, rep: localRep}));
          
          // Breathing logic
          setStep('Inhale');
          audioSynth.current.triggerAttackRelease("C4", "0.1", Tone.now());
          setTimeout(() => {
              setStep('Exhale');
              audioSynth.current.triggerAttackRelease("G4", "0.05", Tone.now() + repDuration / 2000);
          }, repDuration / 2); // 5 seconds
      };

      intervalRef.current = setInterval(cycleInterval, repDuration);
  };

  const runBhastrika = () => {
      let localRep = 0;
      setCounts({rep: 0, cycle: 1});

      const cycleInterval = () => {
          if (localRep >= settings.reps) {
              clearInterval(intervalRef.current);
              setStatus('finished');
              setStep('Practice Complete');
              return;
          }
          
          localRep++;
          setCounts(c => ({...c, rep: localRep}));

          setStep('Inhale & Reach Up');
          audioSynth.current.triggerAttackRelease("C4", "0.2", Tone.now());
          setTimeout(() => {
              setStep('Exhale & Pull Down');
              audioSynth.current.triggerAttackRelease("C5", "0.1", Tone.now() + repDuration / 2000);
          }, repDuration / 2); // 5 seconds
      };

      intervalRef.current = setInterval(cycleInterval, repDuration);
  };


  const pausePractice = () => {
    clearInterval(intervalRef.current);
    setStatus('paused');
  };

  const resumePractice = () => {
    setStatus('running');
    // We need to restart the interval logic based on the current state.
    // This simplified resume will restart the current rep.
    if (pranayama.id === 'kapalabhati') runKapalabhati();
    if (pranayama.id === 'bhastrika') runBhastrika();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const getCircleState = () => {
      if (status !== 'running') return 'idle';
      if (step.includes('Inhale') || step.includes('Get Ready')) return 'inhale';
      if (step.includes('Exhale') || step.includes('Rest')) return 'exhale';
      return 'idle';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col items-center relative">
        <AnimatePresence>
        {showInfo && (
            <InfoModal pranayama={pranayama} onClose={() => setShowInfo(false)} />
        )}
        </AnimatePresence>

      <div className="w-full flex justify-between items-start">
        <button onClick={onBack} className="text-slate-400 hover:text-sky-600 transition-colors">&larr; Back</button>
        <h1 className="text-3xl font-bold text-sky-700 -mt-2">{name}</h1>
        <button onClick={() => setShowInfo(true)} className="text-slate-400 hover:text-sky-600 transition-colors">
            <Info size={24} />
        </button>
      </div>

      <div className="my-8 w-64 h-64 flex items-center justify-center">
        <BreathingCircle state={getCircleState()} />
      </div>

      <div className="text-center h-20 flex flex-col justify-center">
        <p className="text-3xl font-semibold text-slate-700 tracking-wide">{step}</p>
        {status === 'running' && (
          <p className="text-xl text-slate-500 mt-2">
            {pranayama.id === 'kapalabhati' 
              ? `Rep: ${counts.rep}/${settings.reps} | Cycle: ${counts.cycle}/${settings.cycles}`
              : `Rep: ${counts.rep}/${settings.reps}`
            }
          </p>
        )}
         {status === 'finished' && (
             <p className="text-xl text-slate-500 mt-2">Well done!</p>
         )}
      </div>

      <div className="flex items-center space-x-4 mt-6">
        {status === 'ready' && <ControlButton onClick={startPractice} icon={<Play />} label="Start" />}
        {status === 'running' && <ControlButton onClick={pausePractice} icon={<Pause />} label="Pause" />}
        {status === 'paused' && <ControlButton onClick={resumePractice} icon={<Play />} label="Resume" />}
        {(status === 'paused' || status === 'finished') && <ControlButton onClick={resetPractice} icon={<RotateCcw />} label="Reset" />}
      </div>
    </div>
  );
}

// --- Child Components ---

function BreathingCircle({ state }) {
    const variants = {
        idle: { scale: 0.8, opacity: 0.7 },
        inhale: { scale: 1, opacity: 1, transition: { duration: 5, ease: "easeInOut" } },
        exhale: { scale: 0.6, opacity: 0.8, transition: { duration: 5, ease: "easeInOut" } },
    };
    return (
        <motion.div 
            className="w-full h-full rounded-full bg-gradient-to-br from-sky-300 to-indigo-400 flex items-center justify-center shadow-lg"
            variants={variants}
            animate={state}
            initial="idle"
        >
            <Wind className="text-white/70" size={64}/>
        </motion.div>
    );
}

function ControlButton({ onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-sky-600 text-white rounded-full shadow-lg hover:bg-sky-700 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-sky-300"
        >
            {icon}
            <span className="font-semibold">{label}</span>
        </button>
    );
}

function InfoModal({ pranayama, onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
                    <X />
                </button>
                <h3 className="text-2xl font-bold text-sky-700 mb-4">{pranayama.name} Guide</h3>
                
                <h4 className="font-bold text-slate-700 mt-4">Instructions:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 mt-2">
                    {pranayama.instructions.map((inst, i) => <li key={i}>{inst}</li>)}
                </ul>

                <h4 className="font-bold text-slate-700 mt-6">Common Mistakes & Tips:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 mt-2">
                    {pranayama.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
            </motion.div>
        </motion.div>
    );
}
