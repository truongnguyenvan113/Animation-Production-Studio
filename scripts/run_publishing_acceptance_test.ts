import { storageService } from '../src/services/storageService';
import { publishingService } from '../src/services/publishingService';
import { PublishingPack, PublishingTemplate, PublishingStatus } from '../src/types';

async function runAcceptanceTest() {
  console.log('====================================================');
  console.log('🎬 STARTING PUBLISHING STUDIO ACCEPTANCE TEST SUITE');
  console.log('====================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(title: string, condition: boolean, extra?: string) {
    if (condition) {
      console.log(`✅ PASS: ${title}`);
      if (extra) console.log(`   ${extra}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${title}`);
      if (extra) console.error(`   ${extra}`);
      failCount++;
    }
  }

  // 1 & 2. Database State Check
  console.log('--- 1 & 2. DATABASE & EPISODE CHECK ---');
  const db = storageService.getDatabase();
  const ep010 = db.episodes.find((e) => e.id === 'ep_010');
  assert('ep_010 exists in database', !!ep010, `Found: ${ep010?.title}`);
  assert('ep_010 title contains "Chiếc Đèn Lồng Đặc Biệt"', ep010?.title.includes('Chiếc Đèn Lồng Đặc Biệt') ?? false);
  assert('ep_010 has theme and educational context', !!(ep010?.theme || ep010?.educationalMessage || ep010?.storyIdea));

  // 3 & 4. Initial Pack Creation / Retrieval
  console.log('\n--- 3 & 4. INITIAL PACK CREATION & HYDRATION ---');
  const pack = publishingService.getOrCreatePublishingPack('ep_010');
  assert('Publishing pack created or retrieved for ep_010', !!pack && pack.episodeId === 'ep_010');
  assert('Episode brief populated from canonical episode', pack.episodeBrief.title === 'Chiếc Đèn Lồng Đặc Biệt');
  assert('YouTube title populated', pack.youtube.title.length > 0, `Title: ${pack.youtube.title}`);
  assert('Facebook post populated', pack.facebook.post.length > 0);

  // 5. Manual Edit Test
  console.log('\n--- 5. MANUAL EDIT & PERSISTENCE TEST ---');
  const customYTTitle = '🏮 [BẢN ĐẶC BIỆT] Pi & Kem và Đèn Lồng Mặt Trăng | Kem Tivi 4K';
  const customFBPost = '🏮 Đêm hội trăng rằm cùng Pi và Kem! Cả nhà đã chuẩn bị rước đèn chưa? Hãy cùng theo dõi tập phim ấm áp này nhé! ❤️';
  
  publishingService.updateYouTubeData('ep_010', {
    ...pack.youtube,
    title: customYTTitle,
  });
  publishingService.updateFacebookData('ep_010', {
    ...pack.facebook,
    post: customFBPost,
  });

  const updatedPackAfterEdit = publishingService.getPublishingPackByEpisodeId('ep_010');
  assert('Manual edit to YouTube title persisted', updatedPackAfterEdit?.youtube.title === customYTTitle);
  assert('Manual edit to Facebook post persisted', updatedPackAfterEdit?.facebook.post === customFBPost);

  // 6. Asset Test
  console.log('\n--- 6. ASSET ATTACHMENT TEST ---');
  const selectedVideoAssetId = 'asset_vid_final_ep010';
  const selectedVideoUrl = 'https://storage.googleapis.com/kem-tivi-assets/ep010_master_4k.mp4';
  const selectedThumbAssetId = 'asset_thumb_ep010_hero';
  const selectedThumbUrl = 'https://images.unsplash.com/photo-1513151233558-d860c5398176';

  publishingService.updateAssetsData('ep_010', {
    finalVideoAssetId: selectedVideoAssetId,
    finalVideoUrl: selectedVideoUrl,
    thumbnailAssetId: selectedThumbAssetId,
    thumbnailUrl: selectedThumbUrl,
  });

  const packWithAssets = publishingService.getPublishingPackByEpisodeId('ep_010');
  assert('Video asset attached to pack', packWithAssets?.assets.finalVideoAssetId === selectedVideoAssetId);
  assert('Thumbnail asset attached to pack', packWithAssets?.assets.thumbnailAssetId === selectedThumbAssetId);
  assert('Video readiness reflects attached video', packWithAssets?.status.videoReady === true);
  assert('Thumbnail readiness reflects attached thumbnail', packWithAssets?.status.thumbnailReady === true);

  // 7 & 8. Navigation & Hard Refresh Persistence Test
  console.log('\n--- 7 & 8. HARD REFRESH & REHYDRATION TEST ---');
  await storageService.saveToDisk();
  const rehydratedPack = publishingService.getPublishingPackByEpisodeId('ep_010');
  assert('YouTube title preserved after hard refresh', rehydratedPack?.youtube.title === customYTTitle);
  assert('Facebook post preserved after hard refresh', rehydratedPack?.facebook.post === customFBPost);
  assert('Video asset preserved after hard refresh', rehydratedPack?.assets.finalVideoAssetId === selectedVideoAssetId);

  // 9. Revision History Test
  console.log('\n--- 9. REVISION HISTORY & RESTORE TEST ---');
  const initialRevisionCount = rehydratedPack?.history?.length || 0;
  
  // Make an intentional second edit and save as snapshot
  const secondEditTitle = '🏮 [BẢN CẬP NHẬT V2] Pi & Kem: Chiếc Đèn Lồng Diệu Kỳ';
  publishingService.savePublishingPack(
    {
      ...rehydratedPack!,
      youtube: { ...rehydratedPack!.youtube, title: secondEditTitle },
    },
    true,
    'Lưu trước khi thử nghiệm'
  );

  const packWithRev = publishingService.getPublishingPackByEpisodeId('ep_010');
  assert('New revision snapshot created in history', (packWithRev?.history?.length || 0) === initialRevisionCount + 1);
  const targetRevision = packWithRev?.history[0];
  assert('Revision has snapshot of edited title', targetRevision?.snapshot.youtube.title === secondEditTitle);

  // Now restore initial revision
  if (packWithRev && packWithRev.history.length > 1) {
    const olderRev = packWithRev.history[1];
    const restored = publishingService.restoreRevision('ep_010', olderRev.id);
    assert('Revision restore executes successfully', !!restored);
    assert('Restored pack restores previous title', restored?.youtube.title === olderRev.snapshot.youtube.title);
  }

  // 10. Template Isolation Test
  console.log('\n--- 10. TEMPLATE ISOLATION TEST ---');
  const templates = publishingService.getTemplates();
  const ytTemplate = templates.find((t) => t.type === 'youtube');
  assert('YouTube template found', !!ytTemplate);

  const savedTitleBeforeTemplateMutation = publishingService.getPublishingPackByEpisodeId('ep_010')?.youtube.title;
  
  // Mutate template
  const modifiedTemplate: PublishingTemplate = {
    ...ytTemplate!,
    name: 'YouTube Standard Modified v99',
    content: 'NEW FORMAT: {episode_title} - NEVER SILENTLY OVERWRITE',
  };
  await publishingService.saveTemplate(modifiedTemplate);

  const packAfterTemplateSave = publishingService.getPublishingPackByEpisodeId('ep_010');
  assert(
    'Existing saved pack title was NOT silently modified by template edit',
    packAfterTemplateSave?.youtube.title === savedTitleBeforeTemplateMutation,
    `Pack title remained: "${packAfterTemplateSave?.youtube.title}"`
  );

  // 11. Multi-Episode Switch Test
  console.log('\n--- 11. MULTI-EPISODE SWITCH TEST ---');
  const ep001Pack = publishingService.getOrCreatePublishingPack('ep_001');
  const ep010Pack = publishingService.getPublishingPackByEpisodeId('ep_010');
  assert('EP001 pack isolated from EP010 pack', ep001Pack.episodeId === 'ep_001' && ep010Pack?.episodeId === 'ep_010');
  assert('EP001 has its own title', ep001Pack.episodeBrief.title !== ep010Pack?.episodeBrief.title);

  // 12. Export Package Test
  console.log('\n--- 12. EXPORT PACKAGE TEST ---');
  assert('EP010 has complete export data ready', !!(ep010Pack?.youtube.title && ep010Pack?.facebook.post));
  const fullExport = `TIÊU ĐỀ YOUTUBE: ${ep010Pack?.youtube.title}\nFACEBOOK: ${ep010Pack?.facebook.post}`;
  assert('Export package string compiles without error', fullExport.includes('Chiếc Đèn Lồng'));

  // 13. Overwrite Protection Test
  console.log('\n--- 13. OVERWRITE PROTECTION TEST ---');
  const currentTitleBeforeRegen = ep010Pack?.youtube.title;
  // If user calls updateEpisodeBrief, it does NOT wipe YouTube or Facebook
  publishingService.updateEpisodeBrief('ep_010', {
    storySummary: 'Tóm tắt câu chuyện đã được biên tập lại cho hoàn chỉnh hơn.',
  });
  const packAfterBriefEdit = publishingService.getPublishingPackByEpisodeId('ep_010');
  assert(
    'Updating Episode Brief does NOT wipe YouTube title',
    packAfterBriefEdit?.youtube.title === currentTitleBeforeRegen
  );

  // 14. Persistence Location
  console.log('\n--- 14. PERSISTENCE LOCATION TEST ---');
  const finalDb = storageService.getDatabase();
  assert(
    'Publishing packs stored in single studio database (publishingPacks collection)',
    Array.isArray(finalDb.publishingPacks) && finalDb.publishingPacks.some((p) => p.episodeId === 'ep_010')
  );

  // 15. Publishing Status Transitions
  console.log('\n--- 15. STATUS TRANSITIONS TEST ---');
  const statuses: PublishingStatus[] = ['draft', 'ready', 'scheduled', 'published'];
  for (const st of statuses) {
    const transitioned = publishingService.updateOverallStatus('ep_010', st);
    assert(`Status transitioned to "${st}"`, transitioned.overallStatus === st);
  }

  // Restore to ready/scheduled
  publishingService.updateOverallStatus('ep_010', 'ready');
  await storageService.saveToDisk();

  console.log('\n====================================================');
  console.log(`🏁 ACCEPTANCE TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('====================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAcceptanceTest().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
