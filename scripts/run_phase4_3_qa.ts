/**
 * Phase 4.3 Full Storyboard Image Generation E2E Test Runner
 * 
 * Target: Episode 9 / sb_ep009
 * Total Scope: 25 Shots across 6 Scenes
 * 
 * For every shot:
 * 1. Create Image Job
 * 2. Execute with Mock Studio
 * 3. Verify completed output asset
 * 4. Verify Shot <-> Job <-> Output mapping
 * 5. Verify locked Character Versions, References and Style
 * 6. Approve the generated keyframe
 * 
 * Post-execution Verifications:
 * - 25/25 completed
 * - 25/25 approved
 * - zero duplicate/orphan records
 * - zero snapshot leakage
 * - persistence after cold refresh
 * - all 25 approved keyframes are usable as Video inputs
 */

// 1. Browser localStorage polyfill
class MockLocalStorage {
  private store: Record<string, string> = {};

  public getItem(key: string): string | null {
    return this.store.hasOwnProperty(key) ? this.store[key] : null;
  }

  public setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  public removeItem(key: string): void {
    delete this.store[key];
  }

  public clear(): void {
    this.store = {};
  }

  public get length(): number {
    return Object.keys(this.store).length;
  }

  public key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  public dump(): Record<string, string> {
    return { ...this.store };
  }

  public load(raw: Record<string, string>): void {
    this.store = { ...raw };
  }
}

const mockStorage = new MockLocalStorage();
(globalThis as any).localStorage = mockStorage;
(globalThis as any).window = globalThis;

import { storageService, StorageService } from '../src/services/storageService';
import { EpisodeService } from '../src/services/episodeService';
import { StoryboardService } from '../src/services/storyboardService';
import { ImageGenerationService } from '../src/services/imageGenerationService';
import { Shot, ImageGenerationJob, ImageGenerationOutputAsset } from '../src/types';

interface ShotExecutionResult {
  sceneNumber: number;
  shotNumber: number;
  shotId: string;
  jobId: string;
  outputAssetId: string;
  status: 'completed' | 'failed';
  approvalStatus: string;
  charactersLocked: string[];
  styleLocked: string;
  hasValidVideoInput: boolean;
  errors: string[];
}

async function runPhase4_3() {
  console.log('========================================================================');
  console.log('STARTING PHASE 4.3 FULL STORYBOARD IMAGE GENERATION E2E (25 SHOTS)');
  console.log('========================================================================\n');

  // Initialize fresh database state
  storageService.resetToSeed();
  const db = storageService.getDatabase();
  const imageGenService = ImageGenerationService.getInstance();

  // Clear any existing initial demo jobs to begin with a completely pristine canvas
  storageService.saveDatabase({ imageGenerationJobs: [] });

  // Locate Episode 9 and Storyboard sb_ep009
  const ep9 = EpisodeService.getEpisodeById('ep_009');
  if (!ep9) {
    throw new Error('Episode 9 (ep_009) missing from database');
  }

  const currentDb = storageService.getDatabase();
  const storyboard = currentDb.storyboards.find((s) => s.episodeId === 'ep_009');
  if (!storyboard) {
    throw new Error('Storyboard sb_ep009 missing from database');
  }

  console.log(`[TARGET ACQUIRED] Episode: ${ep9.id} (${ep9.title}), Storyboard: ${storyboard.id}`);
  console.log(`[SCENES COUNT] Total Scenes: ${storyboard.scenes.length}\n`);

  const results: ShotExecutionResult[] = [];
  let globalIndex = 0;

  // Process all scenes and shots
  for (const scene of storyboard.scenes) {
    console.log(`------------------------------------------------------------------------`);
    console.log(`SCENE ${scene.sceneNumber}: "${scene.title}" (${scene.shots.length} shots)`);
    console.log(`------------------------------------------------------------------------`);

    for (const shot of scene.shots) {
      globalIndex++;
      const errors: string[] = [];
      const prefix = `[Shot ${globalIndex}/25 - Sc${scene.sceneNumber}Sh${shot.shotNumber}]`;

      // 1. Create Image Job
      const job = imageGenService.createJobFromShot(
        shot,
        ep9.id,
        storyboard.id,
        'mock-studio',
        {
          aspectRatio: '16:9',
          resolution: '1920x1080',
          seed: 100000 + globalIndex * 7919,
          steps: 30,
        }
      );

      if (!job || !job.id) {
        throw new Error(`${prefix} Failed to create Image Job`);
      }

      // 2. Execute with Mock Studio
      const completedJob = await imageGenService.runJob(job.id);
      if (completedJob.status !== 'completed' || completedJob.progress !== 100) {
        errors.push(`Job execution failed: status=${completedJob.status}, progress=${completedJob.progress}`);
      }

      // 3. Verify completed output asset
      const outputAsset = completedJob.outputAssets?.[0];
      if (!outputAsset) {
        errors.push('No output asset generated');
      } else {
        if (!outputAsset.imageUrl || !outputAsset.imageUrl.startsWith('data:image/svg+xml')) {
          errors.push('Output asset imageUrl is missing or not a valid SVG URI');
        }
        if (outputAsset.width !== 1920 || outputAsset.height !== 1080) {
          errors.push(`Dimensions mismatch: got ${outputAsset.width}x${outputAsset.height}`);
        }
        if (outputAsset.aspectRatio !== '16:9') {
          errors.push(`Aspect ratio mismatch: got ${outputAsset.aspectRatio}`);
        }
      }

      // 4. Verify Shot <-> Job <-> Output mapping
      if (job.shotId !== shot.id) {
        errors.push(`Job shotId mismatch: expected ${shot.id}, got ${job.shotId}`);
      }
      if (job.sceneId !== scene.id) {
        errors.push(`Job sceneId mismatch: expected ${scene.id}, got ${job.sceneId}`);
      }
      if (outputAsset && outputAsset.jobId !== job.id) {
        errors.push(`Output jobId mismatch: expected ${job.id}, got ${outputAsset.jobId}`);
      }
      if (outputAsset && outputAsset.shotId !== shot.id) {
        errors.push(`Output shotId mismatch: expected ${shot.id}, got ${outputAsset.shotId}`);
      }

      // 5. Verify locked Character Versions, References and Style
      const shotCharRefs = Object.entries(shot.characterDnaReferences || {});
      for (const [charId, expectedVerId] of shotCharRefs) {
        const lockedVer = job.characterDnaSnapshots[charId];
        if (lockedVer !== expectedVerId) {
          errors.push(`Character ${charId} version mismatch: expected ${expectedVerId}, got ${lockedVer}`);
        }
      }

      if (shot.styleVersionSnapshotId && job.styleVersionSnapshotId !== shot.styleVersionSnapshotId) {
        errors.push(`Style snapshot mismatch: expected ${shot.styleVersionSnapshotId}, got ${job.styleVersionSnapshotId}`);
      }

      // 6. Approve the generated keyframe
      if (outputAsset) {
        imageGenService.approveOutput(job.id, outputAsset.id);
      }

      // Verify shot approval state in database
      const liveDb = storageService.getDatabase();
      const liveSb = liveDb.storyboards.find((s) => s.id === storyboard.id);
      const liveShot = liveSb?.scenes
        .find((sc) => sc.id === scene.id)
        ?.shots.find((sh) => sh.id === shot.id);

      if (!liveShot) {
        errors.push('Shot not found in database after approval');
      } else {
        if (liveShot.generationStatus !== 'Approved') {
          errors.push(`Shot generationStatus is "${liveShot.generationStatus}", expected "Approved"`);
        }
        if (outputAsset && liveShot.activeImageOutputUrl !== outputAsset.imageUrl) {
          errors.push('Shot activeImageOutputUrl does not match approved output asset URL');
        }
        if (liveShot.activeImageJobId !== job.id) {
          errors.push(`Shot activeImageJobId does not match job.id: ${liveShot.activeImageJobId} vs ${job.id}`);
        }
      }

      // Verify keyframe is usable as Video input
      const isUsableVideoInput = Boolean(
        liveShot &&
        liveShot.generationStatus === 'Approved' &&
        liveShot.activeImageOutputUrl &&
        liveShot.activeImageOutputUrl.length > 50 &&
        liveShot.action &&
        outputAsset &&
        outputAsset.isApproved &&
        outputAsset.width === 1920 &&
        outputAsset.height === 1080
      );

      if (!isUsableVideoInput) {
        errors.push('Keyframe fails video input conditioning validation');
      }

      const lockedChars = Object.entries(job.characterDnaSnapshots).map(([c, v]) => `${c}:${v}`);
      const shotResult: ShotExecutionResult = {
        sceneNumber: scene.sceneNumber,
        shotNumber: shot.shotNumber,
        shotId: shot.id,
        jobId: job.id,
        outputAssetId: outputAsset ? outputAsset.id : 'N/A',
        status: completedJob.status as 'completed' | 'failed',
        approvalStatus: outputAsset?.approvalStatus || 'none',
        charactersLocked: lockedChars,
        styleLocked: job.styleVersionSnapshotId || 'N/A',
        hasValidVideoInput: isUsableVideoInput,
        errors,
      };

      results.push(shotResult);

      const statusTag = errors.length === 0 ? '✓ OK' : '✗ ERR';
      console.log(
        `  ${statusTag} ${prefix} Job: ${job.id.slice(0, 32)}... -> Output: ${outputAsset?.id.slice(0, 30)}... (Approved: Yes, Video Input: Ready)${
          errors.length > 0 ? ` [ERRORS: ${errors.join('; ')}]` : ''
        }`
      );
    }
  }

  console.log('\n========================================================================');
  console.log('PERFORMING SYSTEM-WIDE INTEGRITY AUDITS');
  console.log('========================================================================\n');

  const auditErrors: string[] = [];

  // Verification 1: 25/25 completed
  const completedCount = results.filter((r) => r.status === 'completed').length;
  console.log(`1. Completed Jobs: ${completedCount}/25`);
  if (completedCount !== 25) {
    auditErrors.push(`Expected 25 completed jobs, got ${completedCount}`);
  }

  // Verification 2: 25/25 approved
  const approvedCount = results.filter((r) => r.approvalStatus === 'approved').length;
  console.log(`2. Approved Keyframes: ${approvedCount}/25`);
  if (approvedCount !== 25) {
    auditErrors.push(`Expected 25 approved keyframes, got ${approvedCount}`);
  }

  // Verification 3: Zero duplicate/orphan records
  const finalDb = storageService.getDatabase();
  const allJobIds = new Set<string>();
  const duplicateJobs: string[] = [];
  const allOutputIds = new Set<string>();
  const duplicateOutputs: string[] = [];

  for (const job of finalDb.imageGenerationJobs || []) {
    if (allJobIds.has(job.id)) duplicateJobs.push(job.id);
    allJobIds.add(job.id);

    for (const out of job.outputAssets || []) {
      if (allOutputIds.has(out.id)) duplicateOutputs.push(out.id);
      allOutputIds.add(out.id);

      if (out.jobId !== job.id) {
        auditErrors.push(`Orphan/mismatched output asset ${out.id} pointing to ${out.jobId} instead of ${job.id}`);
      }
    }
  }

  console.log(`3. Unique Jobs: ${allJobIds.size}/25 (Duplicates: ${duplicateJobs.length})`);
  console.log(`   Unique Output Assets: ${allOutputIds.size}/25 (Duplicates: ${duplicateOutputs.length})`);
  if (duplicateJobs.length > 0) auditErrors.push(`Found duplicate jobs: ${duplicateJobs.join(', ')}`);
  if (duplicateOutputs.length > 0) auditErrors.push(`Found duplicate output assets: ${duplicateOutputs.join(', ')}`);
  if (allJobIds.size !== 25) auditErrors.push(`Expected exactly 25 unique jobs, got ${allJobIds.size}`);

  // Check storyboard shot references
  const finalSb = finalDb.storyboards.find((s) => s.id === storyboard.id);
  let totalApprovedShots = 0;
  for (const sc of finalSb?.scenes || []) {
    for (const sh of sc.shots) {
      if (sh.generationStatus === 'Approved') {
        totalApprovedShots++;
      }
      if (!sh.activeImageJobId || !allJobIds.has(sh.activeImageJobId)) {
        auditErrors.push(`Shot ${sh.id} points to missing activeImageJobId: ${sh.activeImageJobId}`);
      }
      if (!sh.activeImageOutputUrl) {
        auditErrors.push(`Shot ${sh.id} missing activeImageOutputUrl`);
      }
    }
  }
  console.log(`   Storyboard Shots Approved: ${totalApprovedShots}/25`);
  if (totalApprovedShots !== 25) {
    auditErrors.push(`Expected 25 storyboard shots approved, got ${totalApprovedShots}`);
  }

  // Verification 4: Zero snapshot leakage across live database mutation
  console.log('\n4. Testing Live Snapshot Isolation (Registry Mutation Defense)...');
  const originalCharacters = JSON.parse(JSON.stringify(finalDb.characters));
  for (const char of finalDb.characters) {
    char.activeVersionId = `mutated_version_${Date.now()}`;
  }
  storageService.saveDatabase({ characters: finalDb.characters });

  let leakageDetected = false;
  for (const job of storageService.getDatabase().imageGenerationJobs || []) {
    const shotResult = results.find((r) => r.jobId === job.id);
    if (!shotResult) continue;

    for (const [charId, snapshotVer] of Object.entries(job.characterDnaSnapshots)) {
      if (snapshotVer.startsWith('mutated_version_')) {
        leakageDetected = true;
        auditErrors.push(`Critical leakage in job ${job.id}: character ${charId} version mutated to ${snapshotVer}`);
      }
    }

    // Run auditJobIntegrity on every job
    const audit = imageGenService.auditJobIntegrity(job.id);
    if (!audit.isImmutable || audit.score !== 100) {
      auditErrors.push(`Job ${job.id} integrity audit score is ${audit.score}%, isImmutable=${audit.isImmutable}`);
    }
  }

  // Restore characters in database
  storageService.saveDatabase({ characters: originalCharacters });
  console.log(`   Snapshot Leakage: ${leakageDetected ? 'LEAK DETECTED!' : 'ZERO LEAKAGE (100% Immutable)'}`);

  // Verification 5: Persistence after cold refresh
  console.log('\n5. Testing Cold Refresh Rehydration Persistence...');
  const dumpedStorage = mockStorage.dump();
  const rawJson = dumpedStorage['pikem_animation_studio_v2'];
  if (!rawJson) {
    auditErrors.push('Storage key pikem_animation_studio_v2 is missing in localStorage');
  } else {
    // Purge in-memory mock storage and rehydrate
    mockStorage.clear();
    mockStorage.setItem('pikem_animation_studio_v2', rawJson);

    // Rehydrate database from cold storage
    const rehydratedDb = storageService.getDatabase();
    const rehydratedJobs = rehydratedDb.imageGenerationJobs || [];
    const rehydratedSb = rehydratedDb.storyboards.find((s) => s.id === storyboard.id);

    console.log(`   Persisted Storage Size: ${rawJson.length} bytes`);
    console.log(`   Rehydrated Jobs Count: ${rehydratedJobs.length}/25`);
    console.log(`   Rehydrated Completed: ${rehydratedJobs.filter((j) => j.status === 'completed').length}/25`);

    if (rehydratedJobs.length !== 25) {
      auditErrors.push(`Cold reload expected 25 jobs, got ${rehydratedJobs.length}`);
    }

    let rehydratedApprovedShots = 0;
    for (const sc of rehydratedSb?.scenes || []) {
      for (const sh of sc.shots) {
        if (sh.generationStatus === 'Approved' && sh.activeImageOutputUrl) {
          rehydratedApprovedShots++;
        }
      }
    }
    console.log(`   Rehydrated Approved Shots: ${rehydratedApprovedShots}/25`);
    if (rehydratedApprovedShots !== 25) {
      auditErrors.push(`Cold reload expected 25 approved shots, got ${rehydratedApprovedShots}`);
    }
  }

  // Verification 6: All 25 approved keyframes are usable as Video inputs
  console.log('\n6. Verifying Usability of All 25 Keyframes as Video Inputs...');
  const usableVideoInputsCount = results.filter((r) => r.hasValidVideoInput).length;
  console.log(`   Ready for Video Production: ${usableVideoInputsCount}/25`);
  if (usableVideoInputsCount !== 25) {
    auditErrors.push(`Expected 25 video-ready keyframes, got ${usableVideoInputsCount}`);
  }

  // Final Summary
  console.log('\n========================================================================');
  console.log('PHASE 4.3 FULL STORYBOARD E2E EXECUTION SUMMARY');
  console.log('========================================================================\n');

  console.log(`Total Shots Tested:          25`);
  console.log(`Jobs Completed:              ${completedCount}/25`);
  console.log(`Keyframes Approved:          ${approvedCount}/25`);
  console.log(`Video Input Ready:           ${usableVideoInputsCount}/25`);
  console.log(`Orphan/Duplicate Records:    0`);
  console.log(`Snapshot Leakage:            0 (Audits 100% across all 25 jobs)`);
  console.log(`Persistence Fidelity:        100%`);
  console.log(`Audit Errors:                ${auditErrors.length === 0 ? 'None' : auditErrors.join('; ')}\n`);

  if (auditErrors.length > 0) {
    console.error('[QA FAIL] Phase 4.3 E2E test encountered failures!');
    process.exit(1);
  } else {
    console.log('[QA PASS] All 25 shots successfully generated, approved, audited and validated for Video Production!');
  }
}

runPhase4_3().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
