import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Instagram, Youtube, Facebook, Send, Truck } from 'lucide-react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // 0 -> Instagram
    // 1 -> YouTube
    // 2 -> Facebook
    // 3 -> Telegram (Send)
    // 4 -> Truck & Banner
    // 5 -> Exit
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 600);
    const t3 = setTimeout(() => setStep(3), 900);
    const t4 = setTimeout(() => setStep(4), 1200);
    const t5 = setTimeout(() => {
      setStep(5);
      setTimeout(onComplete, 300); // Wait for exit animation to complete
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  const slideVariants = {
    initial: { x: '100vw', opacity: 1 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100vw', opacity: 1 }
  };

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="instagram"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex flex-col items-center text-pink-600 absolute"
          >
            <Instagram size={120} />
          </motion.div>
        )}
        {step === 1 && (
          <motion.div
            key="youtube"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex flex-col items-center text-red-600 absolute"
          >
            <Youtube size={120} />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div
            key="facebook"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex flex-col items-center text-blue-600 absolute"
          >
            <Facebook size={120} />
          </motion.div>
        )}
        {step === 3 && (
          <motion.div
            key="telegram"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex flex-col items-center text-sky-500 absolute"
          >
            <Send size={120} />
          </motion.div>
        )}
        {step === 4 && (
          <motion.div
            key="truck"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center text-gray-900 absolute"
          >
            <Truck size={120} className="mb-6 text-blue-600" />
            <h1 className="text-4xl md:text-6xl font-black tracking-widest text-center uppercase text-gray-900 drop-shadow-md">
              XVIROR SMM
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
