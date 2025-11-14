/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
}

export interface OutfitLayer {
  garment: WardrobeItem | null; // null represents the base model layer
  poseImages: Record<string, string>; // Maps pose instruction to image URL
}

export interface LookData {
  id: string;
  name: string;
  baseImage: string; // The image of the mannequin with the full outfit applied
  poses: Record<string, string>; // All generated poses for this specific look
}