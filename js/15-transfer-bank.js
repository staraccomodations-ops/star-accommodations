        //  TRANSFER TO BANK (admin only)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        function openTransferToBank() {
            if (!adminUnlocked) {
                alert('Admin mode is required to transfer to bank.');
                return;
            }

            const bal0 = computeCashBalances();
            let generalCash = bal0.generalCash,
                bankBal = bal0.bankBal;

            const b =
                `<div class="alert alert-info" style="margin-bottom:14px;">Transfer money from <strong>General Cash</strong> to your <strong>Bank Account</strong>. This creates two cash book entries (one out, one in) and posts the corresponding journal entries (Debit Bank Account, Credit General Cash).</div>
                <div class="grid-2" style="margin-bottom:14px;">
                    <div style="background:var(--surface-2);padding:12px;border-radius:var(--radius-sm);text-align:center;">
                        <div class="text-secondary" style="font-size:11px;">General Cash</div>
                        <div style="font-size:18px;font-weight:700;color:var(--teal);">${PKR(generalCash)}</div>
                    </div>
                    <div style="background:var(--surface-2);padding:12px;border-radius:var(--radius-sm);text-align:center;">
                        <div class="text-secondary" style="font-size:11px;">Bank Balance</div>
                        <div style="font-size:18px;font-weight:700;color:var(--teal);">${PKR(bankBal)}</div>
                    </div>
                </div>
                <div class="form-group"><label>Amount to transfer (Rs.) *</label><input type="number" min="1" id="tb-amount" placeholder="e.g. 20000" autofocus></div>
                <div class="form-group"><label>Date</label><input type="date" id="tb-date" value="${today()}"></div>
                <div class="form-group"><label>Description (optional)</label><input id="tb-desc" placeholder="Deposit to bank" value="Transfer to bank"></div>
                <div class="alert alert-warning" style="font-size:12px;">Ensure you have enough General Cash on hand before transferring.</div>`;

            const ov = modal('<ion-icon name="business"></ion-icon> Transfer to Bank', b, function(ov) {
                const amt = parseFloat(ov.querySelector('#tb-amount').value);
                if (!amt || amt <= 0) { alert('Please enter a valid amount.'); return false; }
                if (amt > generalCash) {
                    if (!confirm(
                            `Warning: You're transferring ${PKR(amt)} but General Cash balance is only ${PKR(generalCash)}. Continue anyway?`
                            )) return false;
                }
                const date = ov.querySelector('#tb-date').value;
                const desc = ov.querySelector('#tb-desc').value.trim() || 'Transfer to bank';
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
                    catLabel: 'Transfer to Bank',
                    account: 'General Cash',
                    dir: 'out',
                    method: 'cash',
                    amount: amt,
                    ref: ref,
                    cashType: 'general',
                    month: month,
                    archived: false,
                    isTransfer: true,
                    transferPair: id2
                });

                cashbook.unshift({
                    id: id2,
                    seq: cbSeq,
                    date: date,
                    desc: desc + ' (transfer in)',
                    catLabel: 'Transfer from Bank',
                    account: 'Bank Account',
                    dir: 'in',
                    method: 'bank',
                    amount: amt,
                    ref: ref,
                    cashType: 'bank',
                    month: month,
                    archived: false,
                    isTransfer: true,
                    transferPair: id1
                });

                const note = desc + ' (cash to bank)';
                journal.unshift({ id: uid(), date: date, ref: ref, account: 'Bank Account', desc: note, dr: amt,
                    cr: 0, source: 'cashbook', cbId: id2 });
                journal.unshift({ id: uid(), date: date, ref: ref, account: 'General Cash', desc: note, dr: 0,
                    cr: amt, source: 'cashbook', cbId: id1 });

                save();
                render();
                toast(`Transferred ${PKR(amt)} to bank.`);
                return true;
            });

            setTimeout(() => {
                const el = ov.querySelector('#tb-amount');
                if (el) el.focus();
            }, 100);
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
