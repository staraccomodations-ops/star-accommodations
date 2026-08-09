        //  SYNC ACROSS COMPUTERS (data file in Dropbox / Google Drive)
        //  Uses the File System Access API (Chrome / Edge).
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        let syncHandle = null;          // FileSystemFileHandle
        let syncState = 'off';          // 'off' | 'pending' (handle stored, needs user click) | 'on'
        let syncFileName = '';
        let lastSyncSavedAt = '';
        let syncWriteTimer = null;

        // Tiny IndexedDB helpers (file handles can persist in IndexedDB, not localStorage)
        function idbOpen() {
            return new Promise((res, rej) => {
                const rq = indexedDB.open('hms_sync', 1);
                rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
                rq.onsuccess = () => res(rq.result);
                rq.onerror = () => rej(rq.error);
            });
        }
        async function idbSet(key, val) {
            const db = await idbOpen();
            return new Promise((res, rej) => {
                const tx = db.transaction('kv', 'readwrite');
                tx.objectStore('kv').put(val, key);
                tx.oncomplete = () => res();
                tx.onerror = () => rej(tx.error);
            });
        }
        async function idbGet(key) {
            const db = await idbOpen();
            return new Promise((res, rej) => {
                const tx = db.transaction('kv', 'readonly');
                const rq = tx.objectStore('kv').get(key);
                rq.onsuccess = () => res(rq.result);
                rq.onerror = () => rej(rq.error);
            });
        }
        async function idbDel(key) {
            const db = await idbOpen();
            return new Promise((res, rej) => {
                const tx = db.transaction('kv', 'readwrite');
                tx.objectStore('kv').delete(key);
                tx.oncomplete = () => res();
                tx.onerror = () => rej(tx.error);
            });
        }

        function buildSyncSnapshot() {
            return {
                _meta: { app: 'star-accommodations', version: 1, savedAt: new Date().toISOString() },
                data: {
                    guests, txs, journal, cashbook, cbSeq, jeSeq,
                    archivedCashbooks, verifiers, tiers, coa,
                    cashCategories, subCategories, redeemRules, adminPass, companies, reconciliations
                }
            };
        }

        function applySyncSnapshot(snap) {
            if (!snap || !snap.data) return false;
            const d = snap.data;
            guests = d.guests || [];
            txs = d.txs || [];
            journal = d.journal || [];
            cashbook = d.cashbook || [];
            cbSeq = d.cbSeq || 0;
            jeSeq = d.jeSeq || 0;
            archivedCashbooks = d.archivedCashbooks || {};
            verifiers = d.verifiers || ['AQ', 'NM'];
            tiers = d.tiers || JSON.parse(JSON.stringify(DEFAULT_TIERS));
            coa = d.coa || JSON.parse(JSON.stringify(BASE_COA));
            cashCategories = d.cashCategories || JSON.parse(JSON.stringify(DEFAULT_CASH_CATEGORIES));
            subCategories = d.subCategories || JSON.parse(JSON.stringify(DEFAULT_SUBCATEGORIES));
            redeemRules = d.redeemRules || JSON.parse(JSON.stringify(DEFAULT_REDEEM_RULES));
            companies = d.companies || [];
            reconciliations = d.reconciliations || [];
            if (d.adminPass) adminPass = d.adminPass;
            try {
                localStorage.setItem('hms_cbseq', JSON.stringify(cbSeq));
                localStorage.setItem('hms_jeseq', JSON.stringify(jeSeq));
                if (adminPass) localStorage.setItem('hms_adminpass', JSON.stringify(adminPass));
            } catch (e) {}
            saveSubCategories();
            saveRedeemRules();
            saveCompanies();
            saveReconciliations();
            save();  // persists everything else to localStorage (and re-writes the file, which is harmless)
            return true;
        }

        function scheduleSyncWrite() {
            if (syncState !== 'on' || !syncHandle) return;
            clearTimeout(syncWriteTimer);
            syncWriteTimer = setTimeout(syncWriteNow, 800);
        }

        async function syncWriteNow() {
            if (syncState !== 'on' || !syncHandle) return;
            try {
                const w = await syncHandle.createWritable();
                const snap = buildSyncSnapshot();
                await w.write(JSON.stringify(snap, null, 1));
                await w.close();
                lastSyncSavedAt = new Date().toLocaleString();
                lastSyncWroteAtMs = Date.now();
                lastKnownFileSavedAt = snap._meta.savedAt;
                updateSyncBadge();
            } catch (e) {
                // Losing write access mid-session: fall back to pending so the user can reconnect
                syncState = 'pending';
                updateSyncBadge();
                toast('<ion-icon name="alert-circle"></ion-icon> Could not save to data file — click Settings to reconnect.');
            }
        }

        // Auto-poll the data file every ~30s and reload if another computer has updated it.
        let syncPollTimer = null;
        let lastSyncWroteAtMs = 0;
        let lastKnownFileSavedAt = '';
        const SYNC_POLL_INTERVAL_MS = 30000;
        const SYNC_SELF_WRITE_QUIET_MS = 5000; // don't pull within N ms of our own write

        async function syncPollOnce() {
            if (syncState !== 'on' || !syncHandle) return;
            // Skip if a modal is open — the user may be entering data.
            if (document.querySelector('.modal-overlay')) return;
            // Skip if we ourselves wrote very recently (would just pull our own write back).
            if (Date.now() - lastSyncWroteAtMs < SYNC_SELF_WRITE_QUIET_MS) return;
            let snap;
            try { snap = await syncReadFile(); } catch (e) { return; }
            if (!snap || !snap.data || !snap._meta || !snap._meta.savedAt) return;
            if (snap._meta.savedAt === lastKnownFileSavedAt) return;
            // Only reload if the file is genuinely newer than what we know.
            const localSaved = loadOr('hms_last_saved', null);
            if (localSaved && new Date(snap._meta.savedAt) <= new Date(localSaved)) {
                lastKnownFileSavedAt = snap._meta.savedAt;
                return;
            }
            // Apply the newer snapshot silently.
            lastKnownFileSavedAt = snap._meta.savedAt;
            applySyncSnapshot(snap);
            render();
            const when = new Date(snap._meta.savedAt).toLocaleTimeString();
            toast('Updated from ' + syncFileName + ' (saved ' + when + ').');
        }

        function startSyncPolling() {
            stopSyncPolling();
            syncPollTimer = setInterval(syncPollOnce, SYNC_POLL_INTERVAL_MS);
        }

        function stopSyncPolling() {
            if (syncPollTimer) { clearInterval(syncPollTimer); syncPollTimer = null; }
        }

        async function syncPermission(handle, ask) {
            try {
                let p = await handle.queryPermission({ mode: 'readwrite' });
                if (p === 'granted') return true;
                if (ask) {
                    p = await handle.requestPermission({ mode: 'readwrite' });
                    return p === 'granted';
                }
            } catch (e) {}
            return false;
        }

        async function syncReadFile() {
            const f = await syncHandle.getFile();
            const text = await f.text();
            if (!text.trim()) return null;
            try { return JSON.parse(text); } catch (e) { return undefined; } // undefined = unreadable
        }

        async function syncActivate(handle, isNew) {
            syncHandle = handle;
            syncFileName = handle.name || 'data file';
            try { await idbSet('handle', handle); } catch (e) {}
            if (isNew) {
                syncState = 'on';
                await syncWriteNow();
                updateSyncBadge();
                render();
                noticeModal(`Connected to <strong>${esc(syncFileName)}</strong>. Your current data has been saved into it. From now on, every change saves to this file automatically.<br><br>On your other computers, open this app and use <strong><ion-icon name="document"></ion-icon> Connect existing file</strong> to pick the same file from your Dropbox / Google Drive folder.`, '<ion-icon name="sync-circle"></ion-icon> Sync enabled');
                return;
            }
            // Existing file: decide which side's data wins
            const snap = await syncReadFile();
            if (snap === undefined) {
                noticeModal('That file exists but doesn\'t look like a Star Accommodations data file. Pick the correct file, or use "Create data file" to start a new one.', 'Sync');
                syncHandle = null;
                try { await idbDel('handle'); } catch (e) {}
                return;
            }
            if (snap === null) { // empty file — treat as new
                syncState = 'on';
                await syncWriteNow();
                updateSyncBadge();
                render();
                toast('Connected. Current data saved to ' + syncFileName + '.');
                return;
            }
            const fileWhen = snap._meta && snap._meta.savedAt ? new Date(snap._meta.savedAt).toLocaleString() : 'unknown time';
            const localWhen = (loadOr('hms_last_saved', null)) ? new Date(loadOr('hms_last_saved', null)).toLocaleString() : 'unknown time';
            const fileCounts = snap.data ? `${(snap.data.guests||[]).length} guests, ${(snap.data.txs||[]).length} bookings, ${(snap.data.cashbook||[]).length} cash entries` : '';
            const b =
                `<div class="alert alert-info" style="margin-bottom:14px;">This file already contains data. Choose which data to keep — the other will be replaced.</div>` +
                `<div class="stat-row"><span class="text-secondary">In the file (saved ${esc(fileWhen)})</span><span style="font-weight:600;">${esc(fileCounts)}</span></div>` +
                `<div class="stat-row" style="margin-bottom:12px;"><span class="text-secondary">On this computer (saved ${esc(localWhen)})</span><span style="font-weight:600;">${guests.length} guests, ${txs.length} bookings, ${cashbook.length} cash entries</span></div>` +
                `<div class="flex gap-8" style="flex-wrap:wrap;"><button class="btn btn-gold" id="sync-usefile"><ion-icon name="arrow-down"></ion-icon> Use the file's data</button><button class="btn btn-primary" id="sync-uselocal"><ion-icon name="arrow-up"></ion-icon> Keep this computer's data</button></div>`;
            const ov = modal('<ion-icon name="sync-circle"></ion-icon> Connect data file', b, function() { return true; }, 'Cancel');
            if (ov._saveBtn) ov._saveBtn.style.display = 'none';
            if (ov._cancelBtn) ov._cancelBtn.textContent = 'Cancel';
            ov.querySelector('#sync-usefile').onclick = async function() {
                applySyncSnapshot(snap);
                syncState = 'on';
                if (document.body.contains(ov)) document.body.removeChild(ov);
                updateSyncBadge();
                render();
                toast('Loaded data from ' + syncFileName + '. Sync is on.');
            };
            ov.querySelector('#sync-uselocal').onclick = async function() {
                syncState = 'on';
                await syncWriteNow();
                if (document.body.contains(ov)) document.body.removeChild(ov);
                updateSyncBadge();
                render();
                toast('This computer\'s data saved to ' + syncFileName + '. Sync is on.');
            };
        }

        async function syncCreateFile() {
            if (!window.showSaveFilePicker) { openSyncInstructions(); return; }
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'star-accommodations-data.json',
                    types: [{ description: 'Star Accommodations data', accept: { 'application/json': ['.json'] } }]
                });
                await syncActivate(handle, true);
            } catch (e) { /* user cancelled */ }
        }

        async function syncConnectExisting() {
            if (!window.showOpenFilePicker) { openSyncInstructions(); return; }
            try {
                const handles = await window.showOpenFilePicker({
                    types: [{ description: 'Star Accommodations data', accept: { 'application/json': ['.json'] } }]
                });
                if (!handles || !handles[0]) return;
                const ok = await syncPermission(handles[0], true);
                if (!ok) { noticeModal('Permission to read/write the file was not granted.', 'Sync'); return; }
                await syncActivate(handles[0], false);
            } catch (e) { /* user cancelled */ }
        }

        async function syncReconnect() {
            if (!syncHandle) {
                try { syncHandle = await idbGet('handle'); } catch (e) {}
            }
            if (!syncHandle) { syncState = 'off'; updateSyncBadge(); render(); return; }
            const ok = await syncPermission(syncHandle, true);
            if (!ok) { toast('Permission not granted.'); return; }
            syncFileName = syncHandle.name || 'data file';
            const snap = await syncReadFile();
            if (snap && snap.data) {
                await syncActivate(syncHandle, false);
            } else {
                syncState = 'on';
                await syncWriteNow();
                updateSyncBadge();
                render();
                toast('Reconnected to ' + syncFileName + '.');
            }
        }

        async function syncLoadFromFile() {
            if (syncState !== 'on' || !syncHandle) return;
            const snap = await syncReadFile();
            if (!snap || !snap.data) { noticeModal('The data file is empty or unreadable.', 'Sync'); return; }
            const fileWhen = snap._meta && snap._meta.savedAt ? new Date(snap._meta.savedAt).toLocaleString() : 'unknown time';
            confirmModal(`Replace this computer's data with the file's data (saved ${esc(fileWhen)})?`, function() {
                applySyncSnapshot(snap);
                render();
                toast('Loaded latest data from ' + syncFileName + '.');
            }, { title: 'Load from file', yesLabel: 'Load' });
        }

        function syncSaveNow() {
            syncWriteNow().then(() => toast('Saved to ' + syncFileName + '.'));
        }

        function syncDisconnect() {
            confirmModal('Disconnect the data file? This computer keeps its data, but changes will no longer be saved to the file.', async function() {
                syncHandle = null;
                syncState = 'off';
                syncFileName = '';
                try { await idbDel('handle'); } catch (e) {}
                updateSyncBadge();
                render();
                toast('Data file disconnected.');
            }, { danger: true, title: 'Disconnect sync', yesLabel: 'Disconnect' });
        }

        function updateSyncBadge() {
            const el = document.getElementById('sync-badge');
            if (syncState === 'on') startSyncPolling(); else stopSyncPolling();
            if (!el) return;
            el.classList.remove('pending');
            if (syncState === 'on') {
                el.style.display = 'inline-block';
                el.textContent = '<ion-icon name="sync-circle"></ion-icon> Synced';
                el.title = 'Saving to ' + syncFileName + (lastSyncSavedAt ? ' · last saved ' + lastSyncSavedAt : '') + ' · click for settings';
            } else if (syncState === 'pending') {
                el.style.display = 'inline-block';
                el.textContent = '<ion-icon name="sync-circle"></ion-icon> Reconnect';
                el.title = 'Click to reconnect your data file';
                el.classList.add('pending');
            } else {
                el.style.display = 'none';
            }
        }

        function syncBadgeClick() {
            if (syncState === 'pending') syncReconnect();
            else go('settings');
        }

        // On startup: if a handle was stored, show "Reconnect" (browsers require a user click to re-grant access)
        (async function syncStartup() {
            if (!window.showSaveFilePicker || !window.indexedDB) return;
            try {
                const h = await idbGet('handle');
                if (h) {
                    syncHandle = h;
                    syncFileName = h.name || 'data file';
                    const ok = await syncPermission(h, false);
                    if (ok) {
                        // Permission persisted — load the file silently if it's newer
                        const snap = await syncReadFile();
                        if (snap && snap.data && snap._meta && snap._meta.savedAt) {
                            const localSaved = loadOr('hms_last_saved', null);
                            if (!localSaved || new Date(snap._meta.savedAt) > new Date(localSaved)) {
                                applySyncSnapshot(snap);
                            }
                        }
                        syncState = 'on';
                        render();
                    } else {
                        syncState = 'pending';
                    }
                    updateSyncBadge();
                }
            } catch (e) {}
        })();

        // ── Backup & restore (works in every browser) ──
        function exportAllData() {
            const snap = buildSyncSnapshot();
            dl(JSON.stringify(snap, null, 1), 'star-backup-' + today() + '.json');
        }

        function importBackup() {
            const inp = document.createElement('input');
            inp.type = 'file';
            inp.accept = '.json,application/json';
            inp.onchange = function() {
                const f = inp.files && inp.files[0];
                if (!f) return;
                const rd = new FileReader();
                rd.onload = function() {
                    let snap = null;
                    try { snap = JSON.parse(rd.result); } catch (e) {}
                    if (!snap || !snap.data) { noticeModal('That file doesn\'t look like a Star Accommodations backup.', 'Import backup'); return; }
                    const when = snap._meta && snap._meta.savedAt ? new Date(snap._meta.savedAt).toLocaleString() : 'unknown time';
                    const counts = `${(snap.data.guests||[]).length} guests, ${(snap.data.txs||[]).length} bookings, ${(snap.data.cashbook||[]).length} cash entries`;
                    confirmModal(`Restore backup from ${esc(when)} (${esc(counts)})? This replaces ALL data currently on this computer.`, function() {
                        applySyncSnapshot(snap);
                        render();
                        toast('Backup restored.');
                    }, { danger: true, title: 'Import backup', yesLabel: 'Restore' });
                };
                rd.readAsText(f);
            };
            inp.click();
        }

        // ── In-app setup instructions ──
        function openSyncInstructions() {
            const b =
                `<div style="max-height:420px;overflow:auto;font-size:13px;line-height:1.65;">` +
                `<div class="sec-title" style="font-size:14px;"><span class="ic">1️⃣</span>What this does</div>` +
                `<p style="margin-bottom:12px;">Your hotel data normally lives only inside this browser, on this computer. Sync keeps all the data in <strong>one file</strong> that you place inside your <strong>Dropbox</strong> or <strong>Google Drive</strong> folder. Dropbox/Drive then copies that file to your other computers automatically, so you can pick up where you left off anywhere.</p>` +
                `<div class="sec-title" style="font-size:14px;"><span class="ic">2️⃣</span>One-time setup (first computer)</div>` +
                `<p><strong>Step 1.</strong> Install the <strong>Dropbox desktop app</strong> or <strong>Google Drive for desktop</strong> on each computer, signed into the same account. This gives you a Dropbox / Google Drive folder on the computer itself.</p>` +
                `<p><strong>Step 2.</strong> Open this app in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> (other browsers can't connect to files directly).</p>` +
                `<p><strong>Step 3.</strong> Go to <strong>Settings &gt; Sync Across Computers</strong> and click <strong><ion-icon name="document"></ion-icon> Create data file</strong>. In the window that opens, navigate <em>into your Dropbox or Google Drive folder</em> and save the file there (keep the suggested name).</p>` +
                `<p style="margin-bottom:12px;"><strong>Step 4.</strong> Done. A "<ion-icon name="sync-circle"></ion-icon> Synced" badge appears at the top, and every change now saves to that file automatically.</p>` +
                `<div class="sec-title" style="font-size:14px;"><span class="ic">3️⃣</span>Each additional computer</div>` +
                `<p><strong>Step 1.</strong> Wait for Dropbox/Drive to finish syncing (the file appears in that computer's Dropbox/Drive folder).</p>` +
                `<p><strong>Step 2.</strong> Open this app in Chrome or Edge, go to <strong>Settings</strong>, and click <strong> <ion-icon name="document"></ion-icon> Connect existing file</strong>. Pick the same data file from the Dropbox/Drive folder.</p>` +
                `<p style="margin-bottom:12px;"><strong>Step 3.</strong> Choose <strong>"Use the file's data"</strong> when asked. That computer is now synced too.</p>` +
                `<div class="sec-title" style="font-size:14px;"><span class="ic">4️⃣</span>Daily use</div>` +
                `<p>Just use the app — saving is automatic. When you sit down at a different computer, the app loads the latest data from the file by itself. While you're working, the app also checks the file every 30 seconds and pulls in changes another computer has saved. If it shows a <strong><ion-icon name="sync-circle"></ion-icon> Reconnect</strong> badge instead, click it once (browsers occasionally re-ask permission after a restart).</p>` +
                `<p style="margin-bottom:12px;">You can always check the connection under <strong>Settings</strong>, save manually with <strong><ion-icon name="bookmark"></ion-icon> Save to file now</strong>, or pull the latest with <strong><ion-icon name="arrow-down"></ion-icon> Load latest from file</strong>.</p>` +
                `<div class="sec-title" style="font-size:14px;"><span class="ic"><ion-icon name="alert-circle"></ion-icon></span>Important rules</div>` +
                `<p><strong>Use one computer at a time.</strong> This sync is not designed for two people editing at the same moment — the last computer to save wins, and the other's unsaved changes are lost. Finish on one computer, let Dropbox/Drive sync (a few seconds), then continue on the next.</p>` +
                `<p><strong>Let Dropbox/Drive finish syncing</strong> before switching computers — look for the green tick on the Dropbox/Drive icon.</p>` +
                `<p style="margin-bottom:12px;"><strong>Keep backups.</strong> Use <strong><ion-icon name="arrow-down"></ion-icon> Export All Data</strong> in Settings now and then. If anything ever goes wrong with the file, you can restore the backup with <ion-icon name="arrow-up"></ion-icon> Import Backup.</p>` +
                `<div class="sec-title" style="font-size:14px;"><span class="ic">📱</span>Install as an app (optional)</div>` +
                `<p>In <strong>Chrome</strong> or <strong>Edge</strong> on desktop, click the install icon in the address bar (a small monitor or <ion-icon name="arrow-down"></ion-icon> icon near the URL), or open the browser menu and choose <strong>"Install Star Accommodations"</strong>. This gives you a proper desktop app with its own window, icon, and Start-menu / Dock entry. Works offline once installed.</p>` +
                `<p>On <strong>Android</strong>, open the app in Chrome, tap the menu (<ion-icon name="ellipsis-vertical"></ion-icon>), and choose <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>. On <strong>iPhone</strong>, open in Safari, tap the share icon, then <strong>"Add to Home Screen"</strong> (note: iPhone can't use file sync — use Backup/Restore instead).</p>` +
                `<p style="margin-bottom:12px;">After installing on each computer, you still need to set up the sync file inside the installed app (Settings <ion-icon name="arrow-forward"></ion-icon> Create/Connect data file) — installing and syncing are independent.</p>` +
                `<p class="text-muted" style="font-size:12px;margin-top:8px;">Note: Sync needs Chrome or Edge. On other browsers, use Export All Data / Import Backup to move data by hand.</p>` +
                `</div>`;
            const ov = modal('Sync Setup Instructions', b, function() { return true; }, 'Close');
            if (ov._cancelBtn) ov._cancelBtn.style.display = 'none';
        }

        function dismissSyncHint() {
            try { localStorage.setItem('hms_sync_hint_dismissed', JSON.stringify(true)); } catch (e) {}
            render();
        }

        function toast(msg) {
            const t = document.getElementById('toast');
            t.innerHTML = '<ion-icon name="checkmark-circle"></ion-icon> ' + esc(msg);
            t.style.display = 'block';
            clearTimeout(t._timeout);
            t._timeout = setTimeout(() => { t.style.display = 'none'; }, 3500);
        }

        // Apply migration on load
        migrateCoa();

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
