

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobePanel';
import OutfitStack from './components/OutfitStack';
import { generateVirtualTryOnImage, generatePoseVariation } from './services/geminiService';
import { OutfitLayer, WardrobeItem, LookData } from './types';
import { ChevronDownIcon, ChevronUpIcon } from './components/icons';
import { defaultWardrobe } from './wardrobe';
import Footer from './components/Footer';
import { getFriendlyErrorMessage } from './lib/utils';
import Spinner from './components/Spinner';

const POSE_INSTRUCTIONS = [
  "Vista frontal, mãos nos quadris",
  "Ligeiramente virado, vista 3/4",
  "Vista de perfil lateral",
  "Saltando no ar, em movimento",
  "Andando em direção à câmera",
  "Apoiado em uma parede",
];

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQueryList.addEventListener('change', listener);
    
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};


const App: React.FC = () => {
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultWardrobe);
  const [garmentUploadMessage, setGarmentUploadMessage] = useState<string | null>(null);
  const [savedLooks, setSavedLooks] = useState<LookData[]>([]); // New state for saved looks
  const isMobile = useMediaQuery('(max-width: 767px)');

  const activeOutfitLayers = useMemo(() => outfitHistory.slice(0, currentOutfitIndex + 1), 
    [outfitHistory, currentOutfitIndex]
  );
  
  const activeGarmentIds = useMemo(() => activeOutfitLayers.map(layer => layer.garment?.id).filter(Boolean) as string[], 
    [activeOutfitLayers]
  );
  
  const displayImageUrl = useMemo(() => {
    if (outfitHistory.length === 0) return modelImageUrl;
    const currentLayer = outfitHistory[currentOutfitIndex];
    if (!currentLayer) return modelImageUrl;

    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    return currentLayer.poseImages[poseInstruction] ?? Object.values(currentLayer.poseImages)[0];
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, modelImageUrl]);

  const availablePoseKeys = useMemo(() => {
    if (outfitHistory.length === 0) return [];
    const currentLayer = outfitHistory[currentOutfitIndex];
    return currentLayer ? Object.keys(currentLayer.poseImages) : [];
  }, [outfitHistory, currentOutfitIndex]);

  const handleModelFinalized = (url: string) => {
    setModelImageUrl(url);
    setOutfitHistory([{
      garment: null,
      poseImages: { [POSE_INSTRUCTIONS[0]]: url }
    }]);
    setCurrentOutfitIndex(0);
    setCurrentPoseIndex(0);
  };

  const handleStartOver = () => {
    setModelImageUrl(null);
    setOutfitHistory([]);
    setCurrentOutfitIndex(0);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setCurrentPoseIndex(0);
    setIsSheetCollapsed(false);
    setWardrobe(defaultWardrobe);
    setGarmentUploadMessage(null);
  };

  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem) => {
    if (!displayImageUrl || isLoading) return;

    setWardrobe(prev => {
      if (prev.find(item => item.id === garmentInfo.id)) {
          return prev;
      }
      return [...prev, garmentInfo];
    });

    const nextLayer = outfitHistory[currentOutfitIndex + 1];
    if (nextLayer && nextLayer.garment?.id === garmentInfo.id) {
        setCurrentOutfitIndex(prev => prev + 1);
        setCurrentPoseIndex(0);
        return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Adicionando ${garmentInfo.name}...`);

    try {
      const newImageUrl = await generateVirtualTryOnImage(displayImageUrl, garmentFile);
      const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
      
      const newLayer: OutfitLayer = { 
        garment: garmentInfo, 
        poseImages: { [currentPoseInstruction]: newImageUrl } 
      };

      setOutfitHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, currentOutfitIndex + 1);
        return [...newHistory, newLayer];
      });
      setCurrentOutfitIndex(prev => prev + 1);
      
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Falha ao aplicar a peça'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [displayImageUrl, isLoading, currentPoseIndex, outfitHistory, currentOutfitIndex]);

  const handleRemoveLastGarment = () => {
    if (currentOutfitIndex > 0) {
      setCurrentOutfitIndex(prevIndex => prevIndex - 1);
      setCurrentPoseIndex(0);
    }
  };
  
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    const currentLayer = outfitHistory[currentOutfitIndex];

    if (currentLayer.poseImages[poseInstruction]) {
      setCurrentPoseIndex(newIndex);
      return;
    }

    const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0];
    if (!baseImageForPoseChange) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Mudando pose...`);
    
    const prevPoseIndex = currentPoseIndex;
    setCurrentPoseIndex(newIndex);

    try {
      const newImageUrl = await generatePoseVariation(baseImageForPoseChange, poseInstruction);
      setOutfitHistory(prevHistory => {
        const newHistory = [...prevHistory];
        const updatedLayer = newHistory[currentOutfitIndex];
        if (updatedLayer) {
          updatedLayer.poseImages[poseInstruction] = newImageUrl;
        }
        return newHistory;
      });
    } catch (err) {
      // FIX: The 'err' object from a catch block is of type 'unknown'. The getFriendlyErrorMessage function is designed to handle this and return a string.
      // While the type system should correctly infer that 'getFriendlyErrorMessage' returns a 'string', an explicit type assertion is added here
      // to resolve potential type inference issues reported by the linter/compiler in some environments.
      setError(getFriendlyErrorMessage(err, 'Falha ao mudar a pose') as string);
      setCurrentPoseIndex(prevPoseIndex);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentPoseIndex, outfitHistory, isLoading, currentOutfitIndex]);

  const handleGarmentUploadFromStartScreen = useCallback(async (file: File) => {
    setGarmentUploadMessage(null);
    setError(null);
    setIsLoading(true);
    setLoadingMessage('Fazendo upload da peça...');
    
    try {
      if (!file.type.startsWith('image/')) {
          throw new Error('Por favor, selecione um arquivo de imagem (ex: PNG, JPEG, WEBP).');
      }
      const customGarmentInfo: WardrobeItem = {
          id: `custom-${Date.now()}`,
          name: file.name,
          url: URL.createObjectURL(file),
      };
      setWardrobe(prev => [...prev, customGarmentInfo]);
      setGarmentUploadMessage(`Peça "${file.name}" adicionada ao guarda-roupa!`);
    } catch (err) {
      const friendlyError = getFriendlyErrorMessage(err, 'Falha ao fazer upload da peça');
      setError(friendlyError);
      setGarmentUploadMessage(null);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [setIsLoading, setLoadingMessage, setError, setWardrobe]);

  const handleSaveCurrentLook = useCallback(() => {
    if (!displayImageUrl) return;

    const newLookId = `saved-look-${Date.now()}`;
    const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];

    const newLook: LookData = {
        id: newLookId,
        name: `Look Salvo ${savedLooks.length + 1}`,
        baseImage: displayImageUrl, // The current display image (mannequin + clothes)
        poses: { [currentPoseInstruction]: displayImageUrl }, // Initially only current pose is saved
    };
    setSavedLooks(prev => [...prev, newLook]);
    setLoadingMessage('Look salvo com sucesso!');
    setTimeout(() => setLoadingMessage(''), 3000);
  }, [displayImageUrl, currentPoseIndex, savedLooks.length, setLoadingMessage]);

  const handleLoadLook = useCallback((look: LookData) => {
    setModelImageUrl(look.baseImage); // Base image is the current outfit
    const initialPoseKey = Object.keys(look.poses)[0];
    const initialPoseIndex = POSE_INSTRUCTIONS.indexOf(initialPoseKey);
    setOutfitHistory([{
      garment: null, // This represents the combined look
      poseImages: look.poses
    }]);
    setCurrentOutfitIndex(0);
    setCurrentPoseIndex(initialPoseIndex !== -1 ? initialPoseIndex : 0);
    setError(null);
    setGarmentUploadMessage(null);
  }, []);

  const handleUpdateLookName = useCallback((id: string, newName: string) => {
    setSavedLooks(prevLooks => 
      prevLooks.map(look => 
        look.id === id ? { ...look, name: newName } : look
      )
    );
  }, []);

  const handleDeleteLook = useCallback((id: string) => {
    setSavedLooks(prevLooks => prevLooks.filter(look => look.id !== id));
  }, []);

  const viewVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <div className="font-sans">
      <AnimatePresence mode="wait">
        {!modelImageUrl ? (
          <motion.div
            key="start-screen"
            className="w-screen min-h-screen flex items-start sm:items-center justify-center bg-gray-50 p-4 pb-20"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <StartScreen 
              onModelFinalized={handleModelFinalized}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
              setIsLoading={setIsLoading}
              setLoadingMessage={setLoadingMessage}
              setError={setError}
              onGarmentUpload={handleGarmentUploadFromStartScreen}
              garmentUploadMessage={garmentUploadMessage}
              setGarmentUploadMessage={setGarmentUploadMessage}
              savedLooks={savedLooks}
              onLoadLook={handleLoadLook}
              onUpdateLookName={handleUpdateLookName}
              onDeleteLook={handleDeleteLook}
              isMobile={isMobile}
            />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="relative flex flex-col h-screen bg-white overflow-hidden"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <main className="flex-grow relative flex flex-col md:flex-row overflow-hidden">
              <div className="w-full h-full flex-grow flex items-center justify-center bg-white pb-16 relative">
                <Canvas 
                  displayImageUrl={displayImageUrl}
                  onStartOver={handleStartOver}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSelectPose={handlePoseSelect}
                  poseInstructions={POSE_INSTRUCTIONS}
                  currentPoseIndex={currentPoseIndex}
                  availablePoseKeys={availablePoseKeys}
                  onSaveLook={handleSaveCurrentLook} // Pass the new save look function
                />
              </div>

              <aside 
                className={`absolute md:relative md:flex-shrink-0 bottom-0 right-0 h-auto md:h-full w-full md:w-1/3 md:max-w-sm bg-white/80 backdrop-blur-md flex flex-col border-t md:border-t-0 md:border-l border-gray-200/60 transition-transform duration-500 ease-in-out ${isSheetCollapsed ? 'translate-y-[calc(100%-4.5rem)]' : 'translate-y-0'} md:translate-y-0`}
                style={{ transitionProperty: 'transform' }}
              >
                  <button 
                    onClick={() => setIsSheetCollapsed(!isSheetCollapsed)} 
                    className="md:hidden w-full h-8 flex items-center justify-center bg-gray-100/50"
                    aria-label={isSheetCollapsed ? 'Expandir painel' : 'Recolher painel'}
                  >
                    {isSheetCollapsed ? <ChevronUpIcon className="w-6 h-6 text-gray-500" /> : <ChevronDownIcon className="w-6 h-6 text-gray-500" />}
                  </button>
                  <div className="p-4 md:p-6 pb-20 overflow-y-auto flex-grow flex flex-col gap-8">
                    {error && (
                      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md" role="alert">
                        <p className="font-bold">Erro</p>
                        <p>{error}</p>
                      </div>
                    )}
                    <OutfitStack 
                      outfitHistory={activeOutfitLayers}
                      onRemoveLastGarment={handleRemoveLastGarment}
                    />
                    <WardrobePanel
                      onGarmentSelect={handleGarmentSelect}
                      activeGarmentIds={activeGarmentIds}
                      isLoading={isLoading}
                      wardrobe={wardrobe}
                    />
                  </div>
              </aside>
            </main>
            <AnimatePresence>
              {isLoading && isMobile && (
                <motion.div
                  className="fixed inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Spinner />
                  {loadingMessage && (
                    <p className="text-lg font-serif text-gray-700 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer isOnDressingScreen={!!modelImageUrl} />
    </div>
  );
};

export default App;