import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function FirebaseSyncIndicator() {
  const { loading } = useAuth();

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 h-1 z-[9999] bg-gray-200 overflow-hidden"
        >
          <motion.div
            className="h-full bg-blue-500 shadow-[0_0_10px_2px_rgba(59,130,246,0.7)]"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              repeat: Infinity,
              duration: 1,
              ease: 'linear',
            }}
            style={{ width: '50%' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
