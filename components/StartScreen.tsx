

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloudIcon, PlusIcon, RotateCcwIcon } from './icons'; // Added PlusIcon and RotateCcwIcon for gallery view
import { generateMannequinImage } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage } from '../lib/utils';
import MannequinGenderSelectionModal from './MannequinGenderSelectionModal';
import LooksPanel from './LooksPanel'; // Import the new LooksPanel
import { LookData } from '../types'; // Import LookData type

interface StartScreenProps {
  onModelFinalized: (modelUrl: string) => void;
  isLoading: boolean;
  loadingMessage: string;
  setIsLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setError: (error: string | null) => void;
  onGarmentUpload: (file: File) => void;
  garmentUploadMessage: string | null;
  setGarmentUploadMessage: (message: string | null) => void;
  savedLooks: LookData[]; // New prop for saved looks
  onLoadLook: (look: LookData) => void; // New prop to load a saved look
  onUpdateLookName: (id: string, newName: string) => void; // New prop to update look name
  onDeleteLook: (id: string) => void; // New prop to delete a saved look
  isMobile: boolean; // New prop to determine mobile view
}

const StartScreen: React.FC<StartScreenProps> = ({ 
  onModelFinalized, 
  isLoading, 
  loadingMessage,
  setIsLoading, 
  setLoadingMessage, 
  setError,
  onGarmentUpload,
  garmentUploadMessage,
  setGarmentUploadMessage,
  savedLooks,
  onLoadLook,
  onUpdateLookName,
  onDeleteLook,
  isMobile,
}) => {
  const [generatedMannequinUrl, setGeneratedMannequinUrl] = useState<string | null>(null);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const handleGenerateMannequin = useCallback(async (gender: 'masculine' | 'feminine') => {
    setShowGenderModal(false);
    setIsLoading(true);
    setLoadingMessage(`Gerando seu manequim ${gender === 'masculine' ? 'masculino' : 'feminino'}...`);
    setGeneratedMannequinUrl(null);
    setError(null);
    setInternalError(null);
    setGarmentUploadMessage(null);

    try {
        const result = await generateMannequinImage(gender);
        setGeneratedMannequinUrl(result);
    } catch (err) {
        const friendlyError = getFriendlyErrorMessage(err, 'Falha ao criar manequim');
        setError(friendlyError);
        setInternalError(friendlyError);
        setGeneratedMannequinUrl(null);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [setIsLoading, setLoadingMessage, setError, setGarmentUploadMessage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGarmentUploadMessage(null);
      onGarmentUpload(file);
      e.target.value = '';
    }
  };

  const reset = () => {
    setGeneratedMannequinUrl(null);
    setError(null);
    setInternalError(null);
    setIsLoading(false);
    setLoadingMessage('');
    setGarmentUploadMessage(null);
  };

  const screenVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <AnimatePresence mode="wait">
      {/* State 1: Initial view (generate/upload) or Saved Looks Gallery */}
      {!generatedMannequinUrl && !showGenderModal ? (
        <motion.div
          key="initial-or-gallery"
          className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center gap-8 lg:gap-12"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {savedLooks.length > 0 ? (
            // Display Saved Looks Gallery via LooksPanel
            <div className="flex flex-col items-center text-center max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight">
                Seus Looks Salvos
              </h1>
              <p className="mt-4 text-lg text-gray-600 mb-8">
                Clique em um look para carregá-lo e continuar estilizando ou adicione uma nova roupa ao seu guarda-roupa.
              </p>
              <LooksPanel
                savedLooks={savedLooks}
                onLoadLook={onLoadLook}
                onUpdateLookName={onUpdateLookName}
                onDeleteLook={onDeleteLook}
                isMobile={isMobile}
              />
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
                <button
                  onClick={() => setShowGenderModal(true)}
                  className="px-8 py-3 text-base font-semibold text-gray-700 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  <RotateCcwIcon className="w-5 h-5 mr-2 inline-block" /> Gerar Novo Manequim
                </button>
                <label
                  htmlFor="start-screen-garment-upload"
                  className={`relative flex items-center justify-center px-8 py-3 text-base font-semibold text-gray-900 bg-gray-100 rounded-md transition-colors ${isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-200 cursor-pointer'}`}
                  aria-label="Subir Imagem da Roupa"
                >
                  <UploadCloudIcon className="w-5 h-5 mr-2" />
                  Subir Imagem da Roupa
                  <input
                    id="start-screen-garment-upload"
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </label>
              </div>
              {garmentUploadMessage && (
                <p className="text-green-600 text-sm mt-4" aria-live="polite">{garmentUploadMessage}</p>
              )}
            </div>
          ) : (
            // Display initial Generate Mannequin / Upload Garment options
            <div className="flex flex-col items-center text-center">
              <div className="max-w-lg">
                <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight">
                  Crie Instantaneamente Seu Manequim Virtual.
                </h1>
                <p className="mt-4 text-lg text-gray-600">
                  Gere um manequim fotorrealista, pronto para infinitas possibilidades de estilo. Escolha masculino ou feminino e comece a montar seu look perfeito.
                </p>
                <hr className="my-8 border-gray-200" />
                <div className="flex flex-col items-center w-full gap-3">
                  <button 
                    onClick={() => setShowGenderModal(true)}
                    className="w-full relative flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-gray-900 rounded-md cursor-pointer group hover:bg-gray-700 transition-colors"
                    aria-label="Gerar Manequim"
                    disabled={isLoading}
                  >
                    Gerar Manequim
                  </button>

                  <label
                    htmlFor="start-screen-garment-upload"
                    className={`w-full relative flex items-center justify-center px-8 py-3 text-base font-semibold text-gray-900 bg-gray-100 rounded-md transition-colors ${isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-200 cursor-pointer'}`}
                    aria-label="Subir Imagem da Roupa"
                  >
                    <UploadCloudIcon className="w-5 h-5 mr-2" />
                    Subir Imagem da Roupa
                    <input
                      id="start-screen-garment-upload"
                      type="file"
                      className="hidden"
                      accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                  </label>

                  {garmentUploadMessage && (
                    <p className="text-green-600 text-sm mt-2" aria-live="polite">{garmentUploadMessage}</p>
                  )}
                  
                  <p className="text-gray-500 text-xs mt-1">Este serviço é apenas para uso criativo e responsável. Evite gerar conteúdo prejudicial, explícito ou ilegal.</p>
                  {internalError && <p className="text-red-500 text-sm mt-2">{internalError}</p>}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        // State 2: Mannequin just generated, before proceeding to styling
        <motion.div
          key="mannequin-ready"
          className="w-full max-w-6xl mx-auto h-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="md:w-1/2 flex-shrink-0 flex flex-col items-center md:items-start">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight">
                Seu Manequim está Pronto!
              </h1>
              <p className="mt-2 text-md text-gray-600">
                Prossiga para estilizar ou gerar um diferente.
              </p>
            </div>
            
            {internalError && 
              <div className="text-center md:text-left text-red-600 max-w-md mt-6">
                <p className="font-semibold">Falha na Geração</p>
                <p className="text-sm mb-4">{internalError}</p>
                <button onClick={reset} className="text-sm font-semibold text-gray-700 hover:underline">Tentar Novamente</button>
              </div>
            }
            
            <AnimatePresence>
              {generatedMannequinUrl && !internalError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col sm:flex-row items-center gap-4 mt-8"
                >
                  <button 
                    onClick={reset}
                    className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-gray-700 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300 transition-colors"
                    disabled={isLoading}
                  >
                    Gerar Novo Manequim
                  </button>
                  <button 
                    onClick={() => generatedMannequinUrl && onModelFinalized(generatedMannequinUrl)}
                    className="w-full sm:w-auto relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-gray-900 rounded-md cursor-pointer group hover:bg-gray-700 transition-colors"
                    disabled={isLoading}
                  >
                    Prossiga para Estilizar &rarr;
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="md:w-1/2 w-full flex items-center justify-center">
            {generatedMannequinUrl ? (
                <img
                    src={generatedMannequinUrl}
                    alt="Manequim Gerado"
                    className="w-[280px] h-[420px] sm:w-[320px] sm:h-[480px] lg:w-[400px] lg:h-[600px] object-contain rounded-2xl bg-gray-200"
                />
            ) : (
                <div className="w-[280px] h-[420px] sm:w-[320px] sm:h-[480px] lg:w-[400px] lg:h-[600px] bg-gray-100 border border-gray-200 rounded-2xl flex flex-col items-center justify-center animate-pulse">
                  <Spinner />
                  <p className="text-md font-serif text-gray-600 mt-4">Gerando...</p>
                </div>
            )}
          </div>
        </motion.div>
      )}
      <MannequinGenderSelectionModal 
        isOpen={showGenderModal}
        onClose={() => setShowGenderModal(false)}
        onSelectGender={handleGenerateMannequin}
      />
    </AnimatePresence>
  );
};

export default StartScreen;