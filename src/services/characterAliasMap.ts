/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Normalizes character IDs to their canonical representations while
 * supporting recognized aliases across UI and test suites.
 *
 * Recognized characters:
 * - Ethan / Ba Trường: char_ethan
 * - Emma / Mẹ Vân: char_emma
 * - Nancy / Pi: char_pi (alias: char_nancy, nancy, pi)
 * - Leo / Kem: char_kem (alias: char_leo, leo, kem)
 * - Mochi: char_mochi (alias: mochi)
 */
export function resolveCanonicalCharacterId(characterId: string): string {
  if (!characterId) return characterId;
  const lower = characterId.toLowerCase().trim();
  if (lower === 'char_nancy' || lower === 'nancy' || lower === 'char_pi' || lower === 'pi') {
    return 'char_pi';
  }
  if (lower === 'char_leo' || lower === 'leo' || lower === 'char_kem' || lower === 'kem') {
    return 'char_kem';
  }
  if (lower === 'char_ethan' || lower === 'ethan') {
    return 'char_ethan';
  }
  if (lower === 'char_emma' || lower === 'emma') {
    return 'char_emma';
  }
  if (lower === 'char_mochi' || lower === 'mochi') {
    return 'char_mochi';
  }
  return characterId;
}

/**
 * Normalizes character version IDs to their canonical representations while
 * supporting recognized aliases.
 *
 * Recognized v1 versions:
 * - ver_ethan_v1
 * - ver_emma_v1
 * - ver_pi_v1 / ver_nancy_v1
 * - ver_kem_v1 / ver_leo_v1
 * - ver_mochi_v1
 */
export function resolveCanonicalVersionId(versionId: string): string {
  if (!versionId) return versionId;
  const lower = versionId.toLowerCase().trim();
  if (lower === 'ver_nancy_v1' || lower === 'ver_pi_v1' || lower === 'ver_pi' || lower === 'ver_nancy') {
    return 'ver_pi_v1';
  }
  if (lower === 'ver_leo_v1' || lower === 'ver_kem_v1' || lower === 'ver_kem' || lower === 'ver_leo') {
    return 'ver_kem_v1';
  }
  if (lower === 'ver_ethan_v1' || lower === 'ver_ethan') {
    return 'ver_ethan_v1';
  }
  if (lower === 'ver_emma_v1' || lower === 'ver_emma') {
    return 'ver_emma_v1';
  }
  if (lower === 'ver_mochi_v1' || lower === 'ver_mochi') {
    return 'ver_mochi_v1';
  }
  return versionId;
}

/**
 * Returns all recognized version IDs for a given version (including aliases).
 */
export function getAssociatedVersionIds(versionId: string): string[] {
  if (!versionId) return [];
  const lower = versionId.toLowerCase().trim();
  if (lower === 'ver_nancy_v1' || lower === 'ver_pi_v1' || lower === 'ver_pi' || lower === 'ver_nancy') {
    return ['ver_pi_v1', 'ver_nancy_v1'];
  }
  if (lower === 'ver_leo_v1' || lower === 'ver_kem_v1' || lower === 'ver_kem' || lower === 'ver_leo') {
    return ['ver_kem_v1', 'ver_leo_v1'];
  }
  if (lower === 'ver_ethan_v1' || lower === 'ver_ethan') {
    return ['ver_ethan_v1'];
  }
  if (lower === 'ver_emma_v1' || lower === 'ver_emma') {
    return ['ver_emma_v1'];
  }
  if (lower === 'ver_mochi_v1' || lower === 'ver_mochi') {
    return ['ver_mochi_v1'];
  }
  return [versionId];
}

/**
 * Returns all recognized character IDs for a given character (including aliases).
 */
export function getAssociatedCharacterIds(characterId: string): string[] {
  if (!characterId) return [];
  const lower = characterId.toLowerCase().trim();
  if (lower === 'char_nancy' || lower === 'char_pi' || lower === 'nancy' || lower === 'pi') {
    return ['char_pi', 'char_nancy'];
  }
  if (lower === 'char_leo' || lower === 'char_kem' || lower === 'leo' || lower === 'kem') {
    return ['char_kem', 'char_leo'];
  }
  return [characterId];
}
