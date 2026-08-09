        //  ADD MANUAL JOURNAL ENTRY
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        function openAddJE() {
            let opts = '<option value="">Select account...</option>';
            for (const sec in coa) {
                opts += `<optgroup label="${sec}">`;
                coa[sec].accts.forEach(a => { opts +=
                        `<option value="${esc(a.name)}">[${a.code}] ${esc(a.name)}</option>`; });
                opts += `</optgroup>`;
            }
            const b =
                `` +
                `<div class="form-row"><div class="form-group"><label>Date</label><input type="date" id="j-date" value="${today()}"></div><div class="form-group"><label>Reference No.</label><input id="j-ref" placeholder="Leave blank to auto-generate"></div></div>` +
                `<div class="form-group"><label>Debit Account * <span class="text-muted" style="font-weight:400;">(where the value comes in)</span></label><select id="j-dr-acct">${opts}</select></div>` +
                `<div class="form-group"><label>Credit Account * <span class="text-muted" style="font-weight:400;">(where the value comes from)</span></label><select id="j-cr-acct">${opts}</select></div>` +
                `<div class="form-group"><label>Amount (Rs.) *</label><input type="number" min="0" id="j-amt" placeholder="0"></div>` +
                `<div class="form-group"><label>Description</label><input id="j-desc" placeholder="Brief description"></div>` +
                `<div class="text-muted" style="font-size:12px;">Both a debit line and a matching credit line for this amount will be posted together, and can be deleted together later.</div>`;

            modal('<ion-icon name="document-text"></ion-icon> Manual Journal Entry', b, function(ov) {
                const drAcct = ov.querySelector('#j-dr-acct').value;
                const crAcct = ov.querySelector('#j-cr-acct').value;
                const amt = parseFloat(ov.querySelector('#j-amt').value) || 0;
                if (!drAcct || !crAcct) { alert('Select both a debit account and a credit account.'); return false; }
                if (drAcct === crAcct) { alert('The debit and credit accounts must be different.'); return false; }
                if (!amt || amt <= 0) { alert('Enter an amount greater than zero.'); return false; }

                const date = ov.querySelector('#j-date').value;
                const desc = ov.querySelector('#j-desc').value;
                let ref = ov.querySelector('#j-ref').value.trim();
                if (!ref) {
                    jeSeq++;
                    try { localStorage.setItem('hms_jeseq', JSON.stringify(jeSeq)); } catch (e) {}
                    ref = 'JE-' + pad3(jeSeq);
                }
                const pairId = uid();
                journal.unshift({ id: uid(), date, ref, account: drAcct, desc, dr: amt, cr: 0, source: 'manual', pairId });
                journal.unshift({ id: uid(), date, ref, account: crAcct, desc, dr: 0, cr: amt, source: 'manual', pairId });
                save();
                render();
                toast(`Journal entry ${ref} posted — both sides recorded.`);
            });
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
