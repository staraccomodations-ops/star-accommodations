        //  ADMIN
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // ─── ADMIN PASSCODE (sync-aware) ───────────────────────
        // If sync is on, the passcode lives in the shared file so it works
        // across all connected computers. This gate makes sure we don't
        // accidentally overwrite a shared passcode with a per-device one.
        async function adminGate(onOk) {
            // If sync is on, pull the freshest passcode from the file first
            // so a new device that just connected always sees the true value.
            if (syncState === 'on' && syncHandle) {
                try {
                    const snap = await syncReadFile();
                    if (snap && snap.data && snap.data.adminPass) {
                        adminPass = snap.data.adminPass;
                        try { localStorage.setItem('hms_adminpass', JSON.stringify(adminPass)); } catch (e) {}
                    }
                } catch (e) { /* fall through to whatever local state we have */ }
            }
            if (!adminPass) {
                openCreatePass(onOk, false);
            } else {
                openEnterPass(onOk);
            }
        }

        function openCreatePass(onOk, isChange) {
            let syncWarn = '';
            if (!isChange && syncState === 'on') {
                syncWarn = `<div class="alert alert-warning" style="margin-bottom:14px;"><strong>Heads up:</strong> The data file at "${esc(syncFileName || 'sync')}" doesn't contain an admin passcode yet, so you're setting the shared passcode for <strong>all connected computers</strong>. Anyone with this passcode will get admin access on every device that uses this data file. If someone else already set a passcode, cancel this and ask them for it instead.</div>`;
            }
            const intro = isChange ? 'Set a new admin passcode. This will replace the current passcode on every computer connected to this data file.' :
                (syncState === 'on' ?
                    'No admin passcode is set for this data file yet. Choose one now — it will be the same on every computer that connects to this file.' :
                    'Set an admin passcode. You\'ll need it to use the admin-only categories in the Cash Book, and to open the Chart of Accounts and Accounting Ledger.');
            const b =
                syncWarn +
                `<div class="alert alert-info" style="margin-bottom:14px;">${intro} Keep it safe — if forgotten, it can only be reset by clearing all data.</div>` +
                `<div class="form-group"><label>${isChange?'New passcode':'Passcode'}</label><input type="password" id="ap-new" autocomplete="new-password"></div>` +
                `<div class="form-group"><label>Confirm passcode</label><input type="password" id="ap-conf" autocomplete="new-password"></div>` +
                (!isChange ? `<div class="text-muted" style="font-size:12px;text-align:center;margin-top:8px;"><a href="#" id="ap-have" style="color:var(--teal);">I already have an admin passcode — enter it instead</a></div>` : '');
            const ov = modal(isChange ? '<ion-icon name="key"></ion-icon> Change Admin Passcode' : '<ion-icon name="key"></ion-icon> Create Admin Passcode', b, function(ov) {
                const p = ov.querySelector('#ap-new').value,
                    c = ov.querySelector('#ap-conf').value;
                if (!p || p.length < 3) { noticeModal('Please choose a passcode of at least 3 characters.', 'Passcode'); return false; }
                if (p !== c) { noticeModal('The two passcodes do not match.', 'Passcode'); return false; }
                adminPass = p;
                try { localStorage.setItem('hms_adminpass', JSON.stringify(p)); } catch (e) {}
                save();               // persists + triggers sync write so other devices pick it up
                adminUnlocked = true;
                if (onOk) onOk();
                return true;
            }, isChange ? 'Save passcode' : 'Create & unlock');
            const el = ov.querySelector('#ap-new');
            if (el) el.focus();
            const haveLink = ov.querySelector('#ap-have');
            if (haveLink) {
                haveLink.onclick = function(e) {
                    e.preventDefault();
                    if (document.body.contains(ov)) document.body.removeChild(ov);
                    // Give them the Enter flow — sync-aware so it can pull the shared one
                    openEnterPass(onOk, true);
                };
            }
        }

        // wrongAttempts tracks failed tries in the enter dialog, to offer recovery when sync is on.
        function openEnterPass(onOk, allowSyncRecovery) {
            let wrongAttempts = 0;
            const recoveryPossible = (syncState === 'on');
            const recoverBtn = recoveryPossible ?
                `<button type="button" id="ap-recover" class="btn btn-sm" style="margin-top:8px;display:none;"><ion-icon name="sync-circle"></ion-icon> Refresh passcode from sync file</button>` : '';
            const b =
                `<div class="form-group"><label>Enter admin passcode</label><input type="password" id="ap-in" autocomplete="off"></div>` +
                `<div id="ap-err" style="font-size:12px;color:var(--coral);display:none;">Incorrect passcode. Please try again.</div>` +
                `<div id="ap-hint" style="font-size:12px;color:var(--text-secondary);display:none;margin-top:8px;">Still not working? If the passcode was set on another computer, this device may have an old value. Try refreshing from the sync file.</div>` +
                recoverBtn;
            const ov = modal('<ion-icon name="key"></ion-icon> Admin Access', b, async function(ov) {
                const p = ov.querySelector('#ap-in').value;
                if (p !== adminPass) {
                    wrongAttempts++;
                    ov.querySelector('#ap-err').style.display = 'block';
                    if (recoveryPossible && wrongAttempts >= 2) {
                        ov.querySelector('#ap-hint').style.display = 'block';
                        const rb = ov.querySelector('#ap-recover'); if (rb) rb.style.display = 'inline-block';
                    }
                    const f = ov.querySelector('#ap-in');
                    f.value = '';
                    f.focus();
                    return false;
                }
                adminUnlocked = true;
                if (onOk) onOk();
                return true;
            }, 'Unlock');
            const el = ov.querySelector('#ap-in');
            if (el) el.focus();
            const rb = ov.querySelector('#ap-recover');
            if (rb) {
                rb.onclick = async function() {
                    rb.disabled = true;
                    rb.textContent = 'Refreshing…';
                    try {
                        const snap = await syncReadFile();
                        if (snap && snap.data && snap.data.adminPass) {
                            adminPass = snap.data.adminPass;
                            try { localStorage.setItem('hms_adminpass', JSON.stringify(adminPass)); } catch (e) {}
                            toast('Passcode refreshed from sync file. Try again.');
                            ov.querySelector('#ap-err').style.display = 'none';
                            ov.querySelector('#ap-hint').style.display = 'none';
                            rb.style.display = 'none';
                            const f = ov.querySelector('#ap-in'); if (f) f.focus();
                        } else {
                            toast('The sync file has no passcode set.');
                        }
                    } catch (e) {
                        toast('Could not read the sync file.');
                    }
                    rb.disabled = false;
                    rb.textContent = '<ion-icon name="sync-circle"></ion-icon> Refresh passcode from sync file';
                };
            }
        }

        function unlockAdmin() { adminGate(function() { render();
                toast('Admin mode unlocked.'); }); }

        function lockAdmin() { adminUnlocked = false;
            render();
            toast('Admin mode locked.'); }

        function changePass() { openCreatePass(function() { render();
                toast('Admin passcode updated.'); }, true); }

        function lockedPage(which) {
            const name = which === 'coa' ? 'Chart of Accounts' : 'Accounting Ledger';
            let h =
                ``;
            h +=
                `<div class="panel"><div class="panel-body" style="text-align:center;padding:48px 22px;"><div style="font-size:48px;margin-bottom:12px;"><ion-icon name="lock-closed"></ion-icon></div><div style="font-size:18px;font-weight:700;margin-bottom:6px;">${name} is admin-only</div><div class="text-secondary" style="font-size:13px;margin-bottom:18px;">Enter the admin passcode to view this section.</div><button class="btn btn-gold" onclick="unlockAdmin()"><ion-icon name="lock-open"></ion-icon> Unlock with admin passcode</button></div></div>`;
            return h;
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
