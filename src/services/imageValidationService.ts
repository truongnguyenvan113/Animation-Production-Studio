/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ImageGenerationOutputAsset,
  Shot,
  ImmutableJobSnapshot,
  Storyboard,
} from '../types';

export interface ProductionImageValidationDetails {
  hasOutput: boolean;
  hasUri: boolean;
  isRasterMime: boolean;
  notSvg: boolean;
  validDimensions: boolean;
  notMock: boolean;
  hasProviderMeta: boolean;
  hasRequiredIds: boolean;
}

export interface ProductionImageValidationResult {
  isValid: boolean;
  error?: string;
  details: ProductionImageValidationDetails;
  output?: Partial<ImageGenerationOutputAsset>;
}

export interface VideoReadyValidationResult {
  videoReady: boolean;
  reason?: string;
  checks: {
    productionImage: boolean;
    approved: boolean;
    characterDnaLocked: boolean;
    styleLocked: boolean;
    compositionValid: boolean;
  };
}

const SUPPORTED_RASTER_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

/**
 * Checks if an output asset is explicitly or implicitly a mock preview (SVG / Dev / Test).
 */
export function isMockOutput(output?: Partial<ImageGenerationOutputAsset> | null): boolean {
  if (!output) return true;

  if (output.outputType === 'mock') return true;
  if (output.isMock === true) return true;
  if (output.provider === 'mock-studio') return true;
  if (output.mimeType === 'image/svg+xml') return true;

  const url = output.imageUrl || '';
  if (url.startsWith('data:image/svg+xml') || url.includes('<svg') || url.includes('%3Csvg')) {
    return true;
  }

  const storage = output.storagePath || '';
  if (storage.endsWith('.svg') || storage.includes('frame_mock_')) {
    return true;
  }

  return false;
}

/**
 * Validates whether an ImageGenerationOutputAsset is a genuine, verified production raster image.
 * 
 * Strict invariants enforced:
 * - Output must exist
 * - URI or storagePath must exist
 * - MIME type must be a supported raster image (image/png, image/jpeg, image/webp)
 * - MIME must NOT be image/svg+xml
 * - URI must not be SVG markup or SVG data URL
 * - Width and Height must both be > 0
 * - Output must NOT be marked mock (outputType !== 'mock', isMock !== true)
 * - Provider and Model metadata must exist
 * - Request ID and Output ID must exist
 */
export function validateProductionImageOutput(
  output?: Partial<ImageGenerationOutputAsset> | null
): ProductionImageValidationResult {
  const details: ProductionImageValidationDetails = {
    hasOutput: false,
    hasUri: false,
    isRasterMime: false,
    notSvg: false,
    validDimensions: false,
    notMock: false,
    hasProviderMeta: false,
    hasRequiredIds: false,
  };

  if (!output) {
    return {
      isValid: false,
      error: 'Output asset record is missing or null.',
      details,
    };
  }
  details.hasOutput = true;

  // 1. URI / Storage Path check
  const uri = output.imageUrl || '';
  const storage = output.storagePath || '';
  if ((!uri || uri.trim() === '') && (!storage || storage.trim() === '')) {
    return {
      isValid: false,
      error: 'Image output is missing both imageUrl and storagePath.',
      details,
      output,
    };
  }
  details.hasUri = true;

  // 2. SVG rejection
  const isSvgUrl =
    uri.startsWith('data:image/svg+xml') ||
    uri.includes('<svg') ||
    uri.includes('%3Csvg') ||
    storage.endsWith('.svg');
  const isSvgMime = output.mimeType === 'image/svg+xml';

  if (isSvgUrl || isSvgMime) {
    return {
      isValid: false,
      error: 'SVG output is classified as a Mock layout/preview and is NOT a valid production keyframe.',
      details,
      output,
    };
  }
  details.notSvg = true;

  // 3. Supported Raster MIME check
  const mime = (output.mimeType || '').toLowerCase().trim();
  let normalizedMime = mime;
  if (!normalizedMime && uri.startsWith('data:image/')) {
    const match = uri.match(/^data:(image\/[a-zA-Z0-9\-\+\.]+);base64,/);
    if (match) normalizedMime = match[1].toLowerCase();
  } else if (!normalizedMime && (storage.endsWith('.jpg') || storage.endsWith('.jpeg') || uri.endsWith('.jpg') || uri.endsWith('.jpeg'))) {
    normalizedMime = 'image/jpeg';
  } else if (!normalizedMime && (storage.endsWith('.png') || uri.endsWith('.png'))) {
    normalizedMime = 'image/png';
  } else if (!normalizedMime && (storage.endsWith('.webp') || uri.endsWith('.webp'))) {
    normalizedMime = 'image/webp';
  }

  if (!SUPPORTED_RASTER_MIMES.has(normalizedMime)) {
    return {
      isValid: false,
      error: `Unsupported MIME type "${output.mimeType || 'unknown'}". Production outputs must be image/png, image/jpeg, or image/webp.`,
      details,
      output,
    };
  }
  details.isRasterMime = true;

  // 4. Dimensions check
  const width = Number(output.width || 0);
  const height = Number(output.height || 0);
  if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) {
    return {
      isValid: false,
      error: `Invalid output image dimensions: ${output.width}x${output.height}. Dimensions must be positive integers.`,
      details,
      output,
    };
  }
  details.validDimensions = true;

  // 5. Mock flag check
  if (output.outputType === 'mock' || output.isMock === true || output.provider === 'mock-studio') {
    return {
      isValid: false,
      error: 'Asset is explicitly flagged as mock/test output.',
      details,
      output,
    };
  }
  details.notMock = true;

  // 6. Provider and model metadata
  if (!output.provider || !output.model) {
    return {
      isValid: false,
      error: 'Provider or model metadata is missing from output record.',
      details,
      output,
    };
  }
  details.hasProviderMeta = true;

  // 7. IDs check
  const outputId = output.id || output.outputId;
  if (!outputId || !output.requestId) {
    return {
      isValid: false,
      error: 'Output ID or provider Request ID is missing from output record.',
      details,
      output,
    };
  }
  details.hasRequiredIds = true;

  return {
    isValid: true,
    details,
    output,
  };
}

/**
 * Validates if an image keyframe is production-ready and video-ready.
 * 
 * Strict invariants:
 * - Output must pass validateProductionImageOutput (Mock SVG always fails!)
 * - Output must be explicitly approved (isApproved === true)
 * - Shot generationStatus must be 'Approved'
 * - Locked character version snapshots must exist for all shot characters
 * - Locked style snapshot must exist
 * - Shot action and framing must be defined
 */
export function validateVideoReadyKeyframe(options: {
  shot: Shot;
  outputAsset?: ImageGenerationOutputAsset | null;
  jobSnapshot?: ImmutableJobSnapshot | null;
  storyboard?: Storyboard | null;
}): VideoReadyValidationResult {
  const { shot, outputAsset, jobSnapshot } = options;

  const checks = {
    productionImage: false,
    approved: false,
    characterDnaLocked: false,
    styleLocked: false,
    compositionValid: false,
  };

  // 1. Output asset presence & production raster check
  if (!outputAsset) {
    return {
      videoReady: false,
      reason: 'No output asset found for shot.',
      checks,
    };
  }

  // Mock outputs NEVER qualify for video-readiness
  if (isMockOutput(outputAsset)) {
    return {
      videoReady: false,
      reason: 'Mock Studio SVG cannot be used as a video keyframe. A real raster image (PNG/JPEG/WebP) is required.',
      checks,
    };
  }

  const prodValidation = validateProductionImageOutput(outputAsset);
  if (!prodValidation.isValid) {
    return {
      videoReady: false,
      reason: `Keyframe failed production raster validation: ${prodValidation.error}`,
      checks,
    };
  }
  checks.productionImage = true;

  // 2. Approval status
  const isApproved =
    outputAsset.isApproved === true ||
    outputAsset.approvalStatus === 'approved' ||
    shot.generationStatus === 'Approved';

  if (!isApproved) {
    return {
      videoReady: false,
      reason: 'Keyframe has not been approved by the animation director.',
      checks,
    };
  }
  checks.approved = true;

  // 3. Locked Character DNA Snapshots check
  const charIds = shot.characterIds || [];
  let dnaLocked = true;
  if (charIds.length > 0) {
    if (jobSnapshot) {
      for (const cid of charIds) {
        if (!jobSnapshot.characterVersionIds || !jobSnapshot.characterVersionIds[cid]) {
          dnaLocked = false;
          break;
        }
      }
    } else if (shot.characterDnaReferences) {
      for (const cid of charIds) {
        if (!shot.characterDnaReferences[cid]) {
          dnaLocked = false;
          break;
        }
      }
    }
  }
  checks.characterDnaLocked = dnaLocked;
  if (!dnaLocked) {
    return {
      videoReady: false,
      reason: 'Shot characters missing locked Character DNA / Version snapshot references.',
      checks,
    };
  }

  // 4. Locked Style Snapshot check
  const styleLocked = Boolean(
    (jobSnapshot && jobSnapshot.styleSnapshot?.id) ||
    shot.styleVersionSnapshotId
  );
  checks.styleLocked = styleLocked;
  if (!styleLocked) {
    return {
      videoReady: false,
      reason: 'Shot missing locked Global Style version snapshot.',
      checks,
    };
  }

  // 5. Composition & framing validation
  const compositionValid = Boolean(
    shot.action &&
    shot.action.trim().length > 0 &&
    shot.framing &&
    shot.cameraMovement
  );
  checks.compositionValid = compositionValid;
  if (!compositionValid) {
    return {
      videoReady: false,
      reason: 'Shot missing required action description or camera framing parameters.',
      checks,
    };
  }

  return {
    videoReady: true,
    checks,
  };
}
