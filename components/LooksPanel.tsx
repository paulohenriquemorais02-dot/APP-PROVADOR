/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LookData } from '../types';
import { PlusIcon, EditIcon, Trash2Icon, DownloadIcon } from './icons'; // Added DownloadIcon
import { SearchIcon } from './icons'; // Import SearchIcon

interface LooksPanelProps {
  savedLooks: LookData[];
  onLoadLook: (look: LookData) => void;
  onUpdateLookName: (id: string, newName: string) => void;
  onDeleteLook: (id: string) => void; // New prop for deleting a look
  isMobile: boolean;
}

const LooksPanel: React.FC<LooksPanelProps> = ({ savedLooks, onLoadLook, onUpdateLookName, onDeleteLook, isMobile }) => {
  const [editingLookId, setEditingLookId] = useState<string | null>(null);
  const [editingLookName, setEditingLookName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>(''); // New state for search query
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLooks = useMemo(() => {
    if (!searchQuery) {
      return savedLooks;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return savedLooks.filter(look =>
      look.name.toLowerCase().includes(lowerCaseQuery)
    );
  }, [savedLooks, searchQuery]);

  const handleEditClick = (look: LookData) => {
    setEditingLookId(look.id);
    setEditingLookName(look.name);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingLookName(e.target.value);
  };

  const handleSaveName = (id: string) => {
    if (editingLookName.trim() !== '' && editingLookName.trim() !== savedLooks.find(l => l.id === id)?.name) {
      onUpdateLookName(id, editingLookName.trim());
    }
    setEditingLookId(null);
    setEditingLookName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      handleSaveName(id);
    } else if (e.key === 'Escape') {
      setEditingLookId(null);
      setEditingLookName('');
    }
  };

  const handleDownloadLook = (look: LookData) => {
    const a = document.createElement('a');
    a.href = look.baseImage;
    // Sanitize filename: replace non-alphanumeric (except space, hyphen) with empty string,
    // replace spaces with hyphens, and ensure it ends with .png.
    const sanitizedName = look.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
    a.download = `${sanitizedName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Close edit mode if clicking outside the input
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingLookId && !(event.target as HTMLElement).closest('.look-name-edit')) {
        handleSaveName(editingLookId); // Save on blur if there's an active edit
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingLookId, handleSaveName]);


  if (isMobile) {
    return (
      <div className="w-full max-w-full overflow-hidden">
        <div className="relative mb-4 px-2">
            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                type="text"
                placeholder="Buscar looks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Buscar looks salvos"
            />
        </div>
        {filteredLooks.length === 0 && (
            <p className="text-center text-gray-500 mb-8">Nenhum look encontrado.</p>
        )}
        <motion.div
          ref={scrollRef}
          className="flex gap-4 p-2 cursor-grab active:cursor-grabbing pb-8"
          drag="x"
          dragConstraints={scrollRef}
          whileTap={{ cursor: "grabbing" }}
        >
          {filteredLooks.map((look) => (
            <motion.div
              key={look.id}
              className="flex-shrink-0 w-[70vw] aspect-[2/3] relative border border-gray-200 rounded-xl overflow-hidden shadow-sm"
              style={{ x: 0 }} // Ensure x is initialized for drag
            >
              <img
                src={look.baseImage}
                alt={look.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-4 opacity-0 hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => onLoadLook(look)}
                  className="p-2 text-white hover:bg-white/20 rounded-full"
                  aria-label={`Carregar look: ${look.name}`}
                >
                  <PlusIcon className="w-8 h-8" />
                </button>
                <button
                  onClick={() => handleDownloadLook(look)}
                  className="p-2 text-white hover:bg-white/20 rounded-full"
                  aria-label={`Baixar look: ${look.name}`}
                >
                  <DownloadIcon className="w-8 h-8" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-sm font-semibold truncate flex items-center justify-between">
                {editingLookId === look.id ? (
                  <input
                    type="text"
                    value={editingLookName}
                    onChange={handleNameChange}
                    onKeyDown={(e) => handleKeyDown(e, look.id)}
                    onBlur={() => handleSaveName(look.id)}
                    className="w-full bg-transparent border-b border-gray-400 text-white focus:outline-none focus:border-white text-xs look-name-edit"
                    autoFocus
                  />
                ) : (
                  <span className="truncate flex-grow">{look.name}</span>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditClick(look)}
                    className="text-white/80 hover:text-white transition-colors p-1"
                    aria-label="Editar nome do look"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteLook(look.id)}
                    className="text-white/80 hover:text-red-400 transition-colors p-1"
                    aria-label="Deletar look"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  // Desktop/Tablet View
  return (
    <div className="w-full max-w-5xl">
        <div className="relative mb-6">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                type="text"
                placeholder="Buscar looks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Buscar looks salvos"
            />
        </div>
        {filteredLooks.length === 0 ? (
            <p className="text-center text-gray-500">Nenhum look encontrado.</p>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {filteredLooks.map((look) => (
                <div
                key={look.id}
                className="relative group aspect-[2/3] border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800"
                >
                <img
                    src={look.baseImage}
                    alt={look.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={() => onLoadLook(look)}
                        className="p-2 text-white hover:bg-white/20 rounded-full"
                        aria-label={`Carregar look: ${look.name}`}
                    >
                        <PlusIcon className="w-8 h-8" />
                    </button>
                    <button
                        onClick={() => handleDownloadLook(look)}
                        className="p-2 text-white hover:bg-white/20 rounded-full"
                        aria-label={`Baixar look: ${look.name}`}
                    >
                        <DownloadIcon className="w-8 h-8" />
                    </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-sm font-semibold truncate flex items-center justify-between">
                    {editingLookId === look.id ? (
                    <input
                        type="text"
                        value={editingLookName}
                        onChange={handleNameChange}
                        onKeyDown={(e) => handleKeyDown(e, look.id)}
                        onBlur={() => handleSaveName(look.id)}
                        className="w-full bg-transparent border-b border-gray-400 text-white focus:outline-none focus:border-white text-sm look-name-edit"
                        autoFocus
                    />
                    ) : (
                    <span className="truncate flex-grow">{look.name}</span>
                    )}
                    <div className="flex items-center gap-1">
                    <button
                        onClick={() => handleEditClick(look)}
                        className="text-white/80 hover:text-white transition-colors p-1"
                        aria-label="Editar nome do look"
                    >
                        <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDeleteLook(look.id)}
                        className="text-white/80 hover:text-red-400 transition-colors p-1"
                        aria-label="Deletar look"
                    >
                        <Trash2Icon className="w-4 h-4" />
                    </button>
                    </div>
                </div>
                </div>
            ))}
            </div>
        )}
    </div>
  );
};

export default LooksPanel;