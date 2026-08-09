        function pageSettings() {
            let h = '';
            // ── Sync across computers (Dropbox / Google Drive) ──
            const fsSupported = !!window.showSaveFilePicker;
            h += `<div class="panel" style="margin-bottom:16px;border-color:var(--gold);"><div class="panel-body">`;
            h += `<div class="flex-between" style="align-items:center;flex-wrap:wrap;gap:8px;"><div class="sec-title" style="margin-bottom:0;"><span class="ic"><ion-icon name="sync-circle"></ion-icon></span>Sync Across Computers (Dropbox / Google Drive)</div><button class="btn btn-sm" onclick="openSyncInstructions()"><ion-icon name="document-text"></ion-icon> Setup Instructions</button></div>`;
            if (!fsSupported) {
                h += `<div class="alert alert-info" style="margin-top:12px;">Your current browser can't connect directly to a data file. Use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> for automatic sync — or use the Backup &amp; Restore buttons below, which work in every browser.</div>`;
            } else if (syncState === 'on') {
                h += `<div class="alert alert-success" style="margin-top:12px;"><ion-icon name="checkmark-circle"></ion-icon> Connected to <strong>${esc(syncFileName || 'data file')}</strong>. Every change saves to this file automatically.${lastSyncSavedAt ? ' Last saved: ' + esc(lastSyncSavedAt) : ''}</div>`;
                h += `<div class="flex gap-8" style="flex-wrap:wrap;margin-top:10px;"><button class="btn btn-sm" onclick="syncSaveNow()"><ion-icon name="print"></ion-icon> Save to file now</button><button class="btn btn-sm" onclick="syncLoadFromFile()"><ion-icon name="arrow-down"></ion-icon> Load latest from file</button><button class="btn btn-sm btn-danger" onclick="syncDisconnect()">Disconnect</button></div>`;
            } else if (syncState === 'pending') {
                h += `<div class="alert alert-info" style="margin-top:12px;">A data file (<strong>${esc(syncFileName || 'data file')}</strong>) was connected previously. Click below to reconnect and load the latest data.</div>`;
                h += `<div class="flex gap-8" style="flex-wrap:wrap;margin-top:10px;"><button class="btn btn-gold btn-sm" onclick="syncReconnect()"><ion-icon name="sync-circle"></ion-icon> Reconnect data file</button><button class="btn btn-sm btn-danger" onclick="syncDisconnect()">Forget file</button></div>`;
            } else {
                h += `<div class="text-secondary" style="font-size:12px;margin:10px 0;">Keep your hotel data in a file inside your Dropbox or Google Drive folder. Every change saves to it automatically, and Dropbox/Drive syncs it to your other computers. Click <ion-icon name="document-text"></ion-icon> Setup Instructions for the full guide.</div>`;
                h += `<div class="flex gap-8" style="flex-wrap:wrap;"><button class="btn btn-gold" onclick="syncCreateFile()"><ion-icon name="create"></ion-icon> Create data file...</button><button class="btn btn-primary" onclick="syncConnectExisting()"><ion-icon name="document"></ion-icon> Connect existing file...</button></div>`;
            }
            h += `</div></div>`;

            // ── Backup & Restore (works in every browser) ──
            h +=
                `<div class="panel" style="margin-bottom:16px;"><div class="panel-body"><div class="sec-title"><span class="ic"><ion-icon name="git-compare"></ion-icon></span>Backup &amp; Restore</div><div class="text-secondary" style="font-size:12px;margin-bottom:12px;">Download everything (guests, bookings, cash book, ledger, settings) as one backup file, and restore it on any computer. Works in every browser — also useful as a regular safety backup.</div><div class="flex gap-8" style="flex-wrap:wrap;"><button class="btn btn-gold" onclick="exportAllData()"><ion-icon name="arrow-down"></ion-icon> Export All Data (backup)</button><button class="btn btn-primary" onclick="importBackup()"><ion-icon name="cloud-upload"></ion-icon> Import Backup...</button></div></div></div>`;

            h +=
                `<div class="panel" style="margin-bottom:16px;"><div class="panel-body"><div class="sec-title"><span class="ic"><ion-icon name="arrow-down"></ion-icon></span>Export Data (CSV)</div><div class="text-secondary" style="font-size:12px;margin-bottom:12px;">Download your data to open in Google Sheets or Excel. Export regularly to keep a backup.</div><div class="flex gap-8" style="flex-wrap:wrap;"><button class="btn" onclick="exportGuests()">Export Guests</button><button class="btn" onclick="exportTx()">Export Bookings</button><button class="btn" onclick="exportCashbook()">Export Cash Book</button><button class="btn" onclick="exportJournal()">Export Ledger</button></div></div></div>`;

            // Verifiers management (admin only)
            if (adminUnlocked) {
                h +=
                    `<div class="panel" style="margin-bottom:16px;"><div class="panel-body"><div class="sec-title"><span class="ic"><ion-icon name="shield-checkmark"></ion-icon></span>Verifiers</div><div class="text-secondary" style="font-size:12px;margin-bottom:10px;">Manage the list of verifiers for archived cash books.</div><div class="flex gap-8" style="flex-wrap:wrap;margin-bottom:8px;">`;
                verifiers.forEach((v, i) => {
                    h +=
                        `<span style="background:var(--surface-2);padding:4px 12px;border-radius:30px;display:inline-flex;gap:6px;align-items:center;">${esc(v)} <span style="cursor:pointer;color:var(--coral);" onclick="removeVerifier(${i})"><ion-icon name="close"></ion-icon></span></span>`;
                });
                h += `</div><div class="flex gap-8"><input id="new-verifier" placeholder="Add verifier initials..."><button class="btn btn-sm btn-primary" onclick="addVerifier()">Add</button></div></div></div>`;
            }

            h +=
                `<div class="panel" style="margin-bottom:16px;"><div class="panel-body"><div class="sec-title"><span class="ic"><ion-icon name="information-circle"></ion-icon></span>System Information</div>`;
            h +=
                `<div class="stat-row"><span class="text-secondary">Currency</span><span>Pakistani Rupee (PKR / Rs.)</span></div>`;
            h +=
                `<div class="stat-row"><span class="text-secondary">GST Rate</span><span>17% (FBR Pakistan)</span></div>`;
            h +=
                `<div class="stat-row"><span class="text-secondary">Member benefits</span><span>10% discount, ${earnRateLabel()}</span></div>`;
            h +=
                `<div class="stat-row"><span class="text-secondary">Total Members</span><span style="font-weight:700;">${guests.length}</span></div>`;
            h +=
                `<div class="stat-row"><span class="text-secondary">Bookings</span><span style="font-weight:700;">${txs.length}</span></div>`;
            h +=
                `<div class="stat-row"><span class="text-secondary">Cash Book Entries</span><span style="font-weight:700;">${cashbook.length}</span></div>`;
            h +=
                `<div class="stat-row"><span class="text-secondary">Archived Months</span><span style="font-weight:700;">${Object.keys(archivedCashbooks).length}</span></div>`;
            h +=
                `<div class="stat-row" style="border-bottom:none;"><span class="text-secondary">Ledger Lines</span><span style="font-weight:700;">${journal.length}</span></div>`;
            h += `</div></div>`;

            h +=
                `<div class="panel" style="border-color:var(--coral);"><div class="panel-body"><div class="sec-title" style="color:var(--coral);"><span class="ic"><ion-icon name="lock-closed"></ion-icon></span>Admin Controls</div>`;
            if (adminUnlocked) {
                h +=
                    `<div class="flex gap-8" style="flex-wrap:wrap;margin-bottom:10px;"><span class="alert alert-success" style="padding:4px 14px;"><ion-icon name="lock-open"></ion-icon> Admin mode active</span><button class="btn btn-sm" onclick="lockAdmin()">Lock</button><button class="btn btn-sm" onclick="changePass()">Change passcode</button></div>`;
            } else {
                h +=
                    `<div class="flex gap-8" style="flex-wrap:wrap;margin-bottom:10px;"><button class="btn btn-gold btn-sm" onclick="unlockAdmin()"><ion-icon name="lock-open"></ion-icon> Unlock admin</button></div>`;
            }
            h += `<div class="text-muted" style="font-size:12px;">Admin mode unlocks the Chart of Accounts and Accounting Ledger, plus admin-only Cash Book categories. Also required to edit/delete items older than 7 days.</div>`;
            h += `</div></div>`;

            // Danger Zone — locked behind admin
            h +=
                `<div class="panel" style="margin-top:20px; border-color:var(--coral);"><div class="panel-body"><div class="sec-title" style="color:var(--coral);"><span class="ic"><ion-icon name="trash"></ion-icon></span>Danger Zone</div><div class="text-secondary" style="font-size:12px;margin-bottom:12px;">Permanently delete all guests, bookings, cash book entries, and ledger lines. This requires admin mode.</div><button class="btn btn-danger" onclick="openResetModal()"><ion-icon name="trash"></ion-icon> Clear all data...</button></div></div>`;

            return h;
        }

        // ─── Verifier management ──────────────────────────────
        function addVerifier() {
            const input = document.getElementById('new-verifier');
            if (!input) return;
            const val = input.value.trim().toUpperCase();
            if (!val) { alert('Please enter initials.'); return; }
            if (verifiers.includes(val)) { alert('Verifier already exists.'); return; }
            verifiers.push(val);
            save();
            render();
            toast('Verifier added.');
        }

        function removeVerifier(idx) {
            if (verifiers.length <= 1) { alert('At least one verifier required.'); return; }
            if (!confirm('Remove this verifier?')) return;
            verifiers.splice(idx, 1);
            save();
            render();
            toast('Verifier removed.');
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
