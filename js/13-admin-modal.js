        //  ADMIN TOGGLE
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        function toggleAdminFromButton() {
            if (adminUnlocked) {
                lockAdmin();
            } else {
                unlockAdmin();
            }
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        //  MODAL
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        function modal(title, bodyHtml, onSave, saveLabel) {
            const ov = document.createElement('div');
            ov.className = 'modal-overlay';
            ov.innerHTML =
                `<div class="modal"><div class="modal-title">${title}</div><div id="modal-body">${bodyHtml}</div><div class="modal-footer"><button class="btn" id="m-cancel">Cancel</button><button class="btn btn-gold" id="m-save">${saveLabel||'Save'}</button></div></div>`;
            ov.onclick = function(e) { if (e.target === ov && document.body.contains(ov)) document.body.removeChild(ov); };
            document.body.appendChild(ov);
            // Reference buttons directly (not via #id) so stacked modals with duplicate ids still work
            const footer = ov.querySelector('.modal-footer');
            const cancelBtn = footer.firstElementChild;
            const saveBtn = footer.lastElementChild;
            ov._cancelBtn = cancelBtn;
            ov._saveBtn = saveBtn;
            cancelBtn.onclick = function() { if (document.body.contains(ov)) document.body.removeChild(ov); };
            saveBtn.onclick = function() { if (onSave(ov) !== false && document.body.contains(ov)) document.body.removeChild(ov); };
            return ov;
        }

        // Modal-based confirm/notice so actions don't depend on native browser dialogs
        function confirmModal(message, onYes, opts) {
            opts = opts || {};
            const body = `<div class="alert ${opts.danger ? 'alert-danger' : 'alert-info'}" style="margin-bottom:2px;">${message}</div>`;
            const ov = modal(opts.title || 'Please confirm', body, function() { onYes(); return true; }, opts.yesLabel || 'Confirm');
            const sb = ov._saveBtn;
            if (opts.danger && sb) { sb.classList.remove('btn-gold'); sb.classList.add('btn-danger'); }
            return ov;
        }

        function noticeModal(message, title) {
            const body = `<div class="alert alert-info" style="margin-bottom:2px;">${message}</div>`;
            const ov = modal(title || 'Notice', body, function() { return true; }, 'OK');
            if (ov._cancelBtn) ov._cancelBtn.style.display = 'none';
            return ov;
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
