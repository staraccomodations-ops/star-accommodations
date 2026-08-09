        //  REPLENISH PETTY CASH (admin only)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // ─── CASH RECONCILIATION ────────────────────────────────
        function openReconcileCash() {
            if (!adminUnlocked) {
                alert('Admin mode is required to reconcile cash.');
                return;
            }
            const bal = computeCashBalances();
            const verifierOpts = verifiers.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
            const recentHtml = reconciliations.slice(0, 5).map(r => {
                const clean = Math.abs(r.generalDiff) < 1 && Math.abs(r.pettyDiff) < 1;
                return `<div style="padding:8px 10px;border-bottom:1px solid var(--border);font-size:12px;display:flex;justify-content:space-between;"><span>${esc(r.date)} · ${esc(r.by||'—')}</span><span style="color:${clean?'var(--teal)':'var(--coral)'};font-weight:600;">${clean?'<ion-icon name="checkmark-circle"></ion-icon> Matched':'<ion-icon name="alert-circle"></ion-icon> General '+PKR(r.generalDiff)+' · Petty '+PKR(r.pettyDiff)}</span></div>`;
            }).join('');
            const b =
                `<div class="alert alert-info" style="xmargin-bottom:14px;">Count your physical cash and compare it to what the Cash Book says. Any difference is flagged so you can catch mistakes early — and optionally correct the books to match what's actually in the drawer.</div>` +
                `<div class="grid-2" style="margin-bottom:14px;">
                    <div style="background:var(--surface-2);padding:12px;border-radius:var(--radius-sm);">
                        <div class="text-secondary" style="font-size:11px;">General Cash — System says</div>
                        <div style="font-size:18px;font-weight:700;color:var(--teal);">${PKR(bal.generalCash)}</div>
                    </div>
                    <div style="background:var(--surface-2);padding:12px;border-radius:var(--radius-sm);">
                        <div class="text-secondary" style="font-size:11px;">Petty Cash — System says</div>
                        <div style="font-size:18px;font-weight:700;color:var(--teal);">${PKR(bal.pettyCash)}</div>
                    </div>
                </div>` +
                `<div class="form-row"><div class="form-group"><label>Counted General Cash (Rs.)</label><input type="number" id="rc-general" placeholder="${bal.generalCash}"></div><div class="form-group"><label>Counted Petty Cash (Rs.)</label><input type="number" id="rc-petty" placeholder="${bal.pettyCash}"></div></div>` +
                `<div id="rc-diff" style="margin-bottom:14px;"></div>` +
                `<div class="form-row"><div class="form-group"><label>Date</label><input type="date" id="rc-date" value="${today()}"></div><div class="form-group"><label>Reconciled by</label><select id="rc-by">${verifierOpts}</select></div></div>` +
                `<div class="form-group"><label style="display:flex;align-items:center;gap:8px;font-weight:400;"><input type="checkbox" id="rc-adjust" style="width:auto;"> Post an adjustment entry to correct the books to match what I counted</label></div>` +
                (recentHtml ? `<div class="sec-title" style="font-size:13px;margin-top:10px;">Recent reconciliations</div><div style="border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;">${recentHtml}</div>` : '');

            const ov = modal('<ion-icon name="cash"></ion-icon> Reconcile Cash', b, function(ov) {
                const generalCounted = ov.querySelector('#rc-general').value === '' ? bal.generalCash : parseFloat(ov.querySelector('#rc-general').value);
                const pettyCounted = ov.querySelector('#rc-petty').value === '' ? bal.pettyCash : parseFloat(ov.querySelector('#rc-petty').value);
                const date = ov.querySelector('#rc-date').value;
                const by = ov.querySelector('#rc-by').value;
                const adjust = ov.querySelector('#rc-adjust').checked;
                const generalDiff = generalCounted - bal.generalCash;
                const pettyDiff = pettyCounted - bal.pettyCash;
                const month = getMonthFromDate(date);

                if (adjust) {
                    const adjCat = { label: 'Cash Over / Short', account: 'Cash Over / Short' };
                    if (Math.abs(generalDiff) >= 1) {
                        adjCat.dir = generalDiff < 0 ? 'out' : 'in';
                        postCashEntry(date, adjCat, Math.abs(generalDiff), 'cash', 'general', 'Reconciliation adjustment — General Cash', month);
                    }
                    if (Math.abs(pettyDiff) >= 1) {
                        adjCat.dir = pettyDiff < 0 ? 'out' : 'in';
                        postCashEntry(date, adjCat, Math.abs(pettyDiff), 'cash', 'petty', 'Reconciliation adjustment — Petty Cash', month);
                    }
                }

                reconciliations.unshift({
                    id: uid(), date, by,
                    generalSystem: bal.generalCash, generalCounted, generalDiff,
                    pettySystem: bal.pettyCash, pettyCounted, pettyDiff,
                    adjusted: adjust
                });
                saveReconciliations();
                save();
                render();
                const clean = Math.abs(generalDiff) < 1 && Math.abs(pettyDiff) < 1;
                toast(clean ? '<ion-icon name="checkmark-circle"></ion-icon> Reconciled — everything matches.' : (adjust ? 'Reconciled — books adjusted to match your count.' : 'Reconciled — difference logged, books unchanged.'));
                return true;
            }, 'Save Reconciliation');

            function updateDiff() {
                const gInput = ov.querySelector('#rc-general').value;
                const pInput = ov.querySelector('#rc-petty').value;
                const gCounted = gInput === '' ? bal.generalCash : parseFloat(gInput) || 0;
                const pCounted = pInput === '' ? bal.pettyCash : parseFloat(pInput) || 0;
                const gDiff = gCounted - bal.generalCash;
                const pDiff = pCounted - bal.pettyCash;
                function line(label, diff) {
                    if (Math.abs(diff) < 1) return `<div style="font-size:12px;color:var(--teal);"><ion-icon name="checkmark-circle"></ion-icon> ${label}: matches exactly.</div>`;
                    const word = diff < 0 ? 'Shortage' : 'Overage';
                    return `<div style="font-size:12px;color:var(--coral);font-weight:600;"><ion-icon name="alert-circle"></ion-icon> ${label}: ${word} of ${PKR(Math.abs(diff))}.</div>`;
                }
                ov.querySelector('#rc-diff').innerHTML = line('General Cash', gDiff) + line('Petty Cash', pDiff);
            }
            ov.querySelector('#rc-general').addEventListener('input', updateDiff);
            ov.querySelector('#rc-petty').addEventListener('input', updateDiff);
            updateDiff();
        }

        function openReplenishPettyCash() {
            if (!adminUnlocked) {
                alert('Admin mode is required to replenish petty cash.');
                return;
            }

            const bal0 = computeCashBalances();
            let generalCash = bal0.generalCash,
                pettyCash = bal0.pettyCash;

            const b =
                `<div class="alert alert-info" style="margin-bottom:14px;">Transfer money from <strong>General Cash</strong> to <strong>Petty Cash</strong>. This creates two cash book entries (one out, one in) and posts the corresponding journal entries (Debit Petty Cash, Credit General Cash).</div>
                <div class="grid-2" style="margin-bottom:14px;">
                    <div style="background:var(--surface-2);padding:12px;border-radius:var(--radius-sm);text-align:center;">
                        <div class="text-secondary" style="font-size:11px;">General Cash</div>
                        <div style="font-size:18px;font-weight:700;color:var(--teal);">${PKR(generalCash)}</div>
                    </div>
                    <div style="background:var(--surface-2);padding:12px;border-radius:var(--radius-sm);text-align:center;">
                        <div class="text-secondary" style="font-size:11px;">Petty Cash</div>
                        <div style="font-size:18px;font-weight:700;color:var(--teal);">${PKR(pettyCash)}</div>
                    </div>
                </div>
                <div class="form-group"><label>Amount to transfer (Rs.) *</label><input type="number" min="1" id="rp-amount" placeholder="e.g. 5000" autofocus></div>
                <div class="form-group"><label>Date</label><input type="date" id="rp-date" value="${today()}"></div>
                <div class="form-group"><label>Description (optional)</label><input id="rp-desc" placeholder="Petty cash replenishment" value="Petty cash replenishment"></div>
                <div class="alert alert-warning" style="font-size:12px;">Ensure you have enough General Cash on hand before transferring.</div>`;

            const ov = modal('<ion-icon name="sync-circle"></ion-icon> Replenish Petty Cash', b, function(ov) {
                const amt = parseFloat(ov.querySelector('#rp-amount').value);
                if (!amt || amt <= 0) { alert('Please enter a valid amount.'); return false; }
                if (amt > generalCash) {
                    if (!confirm(
                            `Warning: You're transferring ${PKR(amt)} but General Cash balance is only ${PKR(generalCash)}. Continue anyway?`
                            )) return false;
                }
                const date = ov.querySelector('#rp-date').value;
                const desc = ov.querySelector('#rp-desc').value.trim() || 'Petty cash replenishment';
                const month = getMonthFromDate(date);

                cbSeq++;
                try { localStorage.setItem('hms_cbseq', JSON.stringify(cbSeq)); } catch (e) {}
                const ref = 'CB-' + pad3(cbSeq);
                const id1 = uid(),
                    id2 = uid();

                cashbook.unshift({
                    id: id1,
                    seq: cbSeq,
                    date: date,
                    desc: desc + ' (transfer out)',
                    catLabel: 'Transfer to Petty Cash',
                    account: 'General Cash',
                    dir: 'out',
                    method: 'cash',
                    amount: amt,
                    ref: ref,
                    cashType: 'general',
                    month: month,
                    archived: false,
                    isReplenish: true,
                    replenishPair: id2
                });

                cashbook.unshift({
                    id: id2,
                    seq: cbSeq,
                    date: date,
                    desc: desc + ' (transfer in)',
                    catLabel: 'Transfer from General Cash',
                    account: 'Petty Cash',
                    dir: 'in',
                    method: 'cash',
                    amount: amt,
                    ref: ref,
                    cashType: 'petty',
                    month: month,
                    archived: false,
                    isReplenish: true,
                    replenishPair: id1
                });

                const note = desc + ' (replenishment)';
                journal.unshift({ id: uid(), date: date, ref: ref, account: 'Petty Cash', desc: note, dr: amt,
                    cr: 0, source: 'cashbook', cbId: id2 });
                journal.unshift({ id: uid(), date: date, ref: ref, account: 'General Cash', desc: note, dr: 0,
                    cr: amt, source: 'cashbook', cbId: id1 });

                save();
                render();
                toast(`Petty cash replenished with ${PKR(amt)}.`);
                return true;
            });

            setTimeout(() => {
                const el = ov.querySelector('#rp-amount');
                if (el) el.focus();
            }, 100);
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
