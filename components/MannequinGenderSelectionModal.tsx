/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from './icons';

interface MannequinGenderSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGender: (gender: 'masculine' | 'feminine') => void;
}

const MannequinGenderSelectionModal: React.FC<MannequinGenderSelectionModalProps> = ({ isOpen, onClose, onSelectGender }) => {
  const [selectedGender, setSelectedGender] = useState<'masculine' | 'feminine' | null>(null);

  const handleGenerateClick = () => {
    if (selectedGender) {
      onSelectGender(selectedGender);
      setSelectedGender(null); // Reset selection after generation
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gender-modal-title"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 id="gender-modal-title" className="text-2xl font-serif tracking-wider text-gray-800">Selecione o Tipo de Manequim</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="Fechar"
              >
                <XIcon className="w-6 h-6"/>
              </button>
            </div>
            <div className="p-6 flex-grow overflow-y-auto">
              <p className="text-gray-700 mb-6 text-center">Escolha o tipo de manequim que você gostaria de estilizar.</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedGender('masculine')}
                  className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all duration-200 ${
                    selectedGender === 'masculine' ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-500'
                  }`}
                  aria-pressed={selectedGender === 'masculine'}
                >
                  <img
                    src="https://storage.googleapis.com/gemini-95-icons/mannequin-male-thumbnail.png" // Placeholder image
                    alt="Manequim Masculino"
                    className="w-24 h-24 object-contain mb-2"
                  />
                  <span className="font-semibold text-gray-800">Masculino</span>
                </button>
                <button
                  onClick={() => setSelectedGender('feminine')}
                  className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all duration-200 ${
                    selectedGender === 'feminine' ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-500'
                  }`}
                  aria-pressed={selectedGender === 'feminine'}
                >
                  <img
                    src="https://storage.googleapis.com/gemini-95-icons/mannequin-female-thumbnail.png" // Placeholder image
                    alt="Manequim Feminino"
                    className="w-24 h-24 object-contain mb-2"
                  />
                  <span className="font-semibold text-gray-800">Feminino</span>
                </button>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateClick}
                disabled={!selectedGender}
                className="px-6 py-2 rounded-md text-white bg-gray-900 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Gerar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MannequinGenderSelectionModal;