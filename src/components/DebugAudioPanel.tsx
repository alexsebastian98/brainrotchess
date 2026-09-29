/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MyInstantsSoundboardModal } from './MyInstantsSoundboardModal';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Redirect all Soundboard requests directly to the MyInstants Meme Soundboard
export const DebugAudioPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  return <MyInstantsSoundboardModal isOpen={isOpen} onClose={onClose} />;
};
