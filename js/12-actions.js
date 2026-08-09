        //  ACTIONS
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        function onSearch(v) { search = v;
            render(); }

        function onCbSearch(v) { cbSearch = v;
            render(); }

        function setCbFilterCat(v) { cbFilterCat = v;
            render(); }

        function setCbFilterMethod(v) { cbFilterMethod = v;
            render(); }

        function setCbFilterDir(v) { cbFilterDir = v;
            render(); }

        function clearCbFilters() { cbSearch = '';
            cbFilterCat = '';
            cbFilterMethod = '';
            cbFilterDir = '';
            render(); }

        function viewGuest(id) { selGuestId = id;
            page = 'guestDetail';
            render(); }

        function setAccTab(t) { accTab = t;
            render(); }

        function toggleCOA(sec) { coaOpen[sec] = !coaOpen[sec];
            render(); }

        // ─── PRINT RECEIPT ─────────────────────────────────────
        function printReceipt(bookingId) {
            const tx = byId(txs, bookingId);
            if (!tx) { noticeModal('Booking not found.', 'Print'); return; }
            const guestName = bookingGuestName(tx);

            let receiptHtml;
            if (tx.redemption) {
                receiptHtml = `
                <div class="receipt-print" id="receipt-print">
                    <h2>Star Accommodations ★</h2>
                    <div class="star"><ion-icon name="gift"></ion-icon></div>
                    <div class="thankyou">Points Redemption Voucher</div>
                    <div class="details">
                        <div><span>Guest:</span><span>${esc(guestName)}</span></div>
                        <div><span>Date:</span><span>${esc(tx.date)}</span></div>
                        <div><span>Reward:</span><span>${esc(tx.reward || tx.desc)}</span></div>
                        <div><span>Note:</span><span>${esc(tx.desc)}</span></div>
                        <div class="total-line"><span>Points Redeemed:</span><span>${(tx.pointsRedeemed||0).toLocaleString()} pts</span></div>
                        <div><span>Reward Value:</span><span>${PKR(tx.pointsValue||0)}</span></div>
                        <div><span>New Points Balance:</span><span>${(tx.pointsBalanceAfter||0).toLocaleString()} pts</span></div>
                    </div>
                    <div class="footer">Keep this voucher as proof of redemption.<br>Thank you for being a valued member.</div>
                </div>
                `;
            } else {
                receiptHtml = `
                <div class="receipt-print" id="receipt-print">
                    <h2>Star Accommodations ★</h2>
                    <div class="star"><ion-icon name="star"></ion-icon></div>
                    <div class="thankyou">Thank You for Your Stay!</div>
                    <div class="details">
                        <div><span>Guest:</span><span>${esc(guestName)}</span></div>
                        <div><span>Date:</span><span>${esc(tx.date)}</span></div>
                        <div><span>Nights:</span><span>${tx.nights||0}</span></div>
                        <div><span>Rooms:</span><span>${tx.rooms||1}</span></div>
                        <div><span>Description:</span><span>${esc(tx.desc)}</span></div>
                        <div><span>Subtotal:</span><span>${PKR(tx.subtotal)}</span></div>
                        ${tx.discountApplied > 0 ? `<div><span>Discount (${tx.discountApplied}%):</span><span>-${PKR(tx.subtotal * tx.discountApplied / 100)}</span></div>` : ''}
                        <div class="total-line"><span>Total:</span><span>${PKR(tx.amount)}</span></div>
                        <div><span>Paid:</span><span>${PKR(tx.paid||0)}</span></div>
                        <div><span>Balance:</span><span>${PKR(tx.balance||0)}</span></div>
                        ${tx.pts > 0 ? `<div><span>Points Earned:</span><span>${tx.pts.toLocaleString()}</span></div>` : ''}
                    </div>
                    <div class="footer">Thank you for choosing Star Accommodations.<br>We hope to see you again soon!</div>
                </div>
                `;
            }

            // Append to body, print, remove
            const div = document.createElement('div');
            div.innerHTML = receiptHtml;
            document.body.appendChild(div);
            // Trigger print
            window.print();
            // Clean up after print
            setTimeout(() => {
                document.body.removeChild(div);
            }, 1000);
        }

        // ─── REDEEM POINTS ─────────────────────────────────────
        function openRedeemPoints(guestId) {
            const g = byId(guests, guestId);
            if (!g) { noticeModal('Guest not found.', 'Redeem points'); return; }
            const bal = g.points || 0;
            if (bal <= 0) { noticeModal(`${esc(g.name)} has no points to redeem yet.`, 'Redeem points'); return; }
            const rewardOpts = redeemRules.rewards
                .map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
            const minNote = redeemRules.minPoints > 0 ? ` Minimum redemption is ${redeemRules.minPoints.toLocaleString()} points (${freeRoomLabel()}).` : '';
            const b =
                `<div class="alert alert-info" style="margin-bottom:14px;">Redeem loyalty points for a reward. This deducts points and records a booking on the guest's account as proof.${minNote}</div>` +
                `<div class="stat-row"><span class="text-secondary">Guest</span><span style="font-weight:700;">${esc(g.name)}</span></div>` +
                `<div class="stat-row"><span class="text-secondary">Current balance</span><span style="font-weight:700;">${bal.toLocaleString()} pts</span></div>` +
                `<div class="stat-row" style="margin-bottom:10px;"><span class="text-secondary">Redeemable value</span><span style="font-weight:700;">${PKR(pointsValue(bal))}</span></div>` +
                `<div class="form-group"><label>Redeem for</label><select id="rp-reward">${rewardOpts}</select></div>` +
                `<div class="form-group"><label>Points to redeem *</label><input type="number" min="1" max="${bal}" id="rp-pts" placeholder="Max ${bal.toLocaleString()}"></div>` +
                `<div class="form-group"><label>Note (optional)</label><input id="rp-note" placeholder="e.g. Redeemed at front desk"></div>` +
                `<div class="total-preview"><div class="line"><span>Points to redeem</span><span id="rp-out">0 pts</span></div><div class="line"><span>Reward value</span><span id="rp-val">Rs. 0</span></div><div class="line total"><span>New balance</span><span id="rp-newbal">${bal.toLocaleString()} pts</span></div></div>`;
            const ov = modal('<ion-icon name="gift"></ion-icon> Redeem Points', b, function(ov) {
                const pts = Math.floor(parseFloat(ov.querySelector('#rp-pts').value));
                if (!pts || pts <= 0) { noticeModal('Enter how many points to redeem.', 'Redeem points'); return false; }
                if (pts > bal) { noticeModal(`Only ${bal.toLocaleString()} points are available.`, 'Redeem points'); return false; }
                if (redeemRules.minPoints > 0 && pts < redeemRules.minPoints) { noticeModal(`Minimum redemption is ${redeemRules.minPoints.toLocaleString()} points.`, 'Redeem points'); return false; }
                const reward = ov.querySelector('#rp-reward').value;
                const note = ov.querySelector('#rp-note').value.trim();
                g.points = bal - pts;
                g.lastVisit = today();
                const desc = reward + (note ? ' — ' + note : '');
                const entry = {
                    id: uid(), gId: g.id, nonMember: false,
                    type: 'Points Redemption', desc: desc, date: today(),
                    nights: 0, amount: 0, paid: 0, balance: 0, pts: 0,
                    redemption: true, pointsRedeemed: pts, pointsValue: pointsValue(pts),
                    pointsBalanceAfter: g.points, reward: reward
                };
                txs.unshift(entry);
                save();
                render();
                toast(`Redeemed ${pts.toLocaleString()} pts for ${reward}.`);
                noticeModal(`<strong>Redemption complete.</strong><br>Guest: ${esc(g.name)}<br>Reward: ${esc(reward)}<br>Points redeemed: ${pts.toLocaleString()} (${PKR(pointsValue(pts))})<br>New balance: ${g.points.toLocaleString()} pts<br><br>A booking record has been added to this guest's account and to the Bookings page. Use the <ion-icon name="print"></ion-icon> button on that row to print a voucher.`, '<ion-icon name="gift"></ion-icon> Redemption Recorded');
                return true;
            }, 'Redeem');
            const ptsInp = ov.querySelector('#rp-pts');
            function upd() {
                let p = Math.floor(parseFloat(ptsInp.value)) || 0;
                if (p < 0) p = 0;
                if (p > bal) p = bal;
                ov.querySelector('#rp-out').textContent = p.toLocaleString() + ' pts';
                ov.querySelector('#rp-val').textContent = PKR(pointsValue(p));
                ov.querySelector('#rp-newbal').textContent = (bal - p).toLocaleString() + ' pts';
            }
            ptsInp.addEventListener('input', upd);
            ov.querySelector('#rp-reward').addEventListener('change', upd);
        }

        // ─── REDEMPTION RULES (admin) ──────────────────────────
        function openRedeemRules() {
            if (!adminUnlocked) { noticeModal('Admin mode required to edit redemption rules.', 'Admin required'); return; }
            const b =
                `<div class="alert alert-info" style="margin-bottom:14px;">Set how points are earned on bookings, how they convert to value on redemption, the minimum a guest must redeem, and the rewards guests can choose from.</div>` +
                `<div class="sec-title" style="font-size:13px;margin-bottom:8px;"><span class="ic"><ion-icon name="add"></ion-icon></span>Earning</div>` +
                `<div class="form-group"><label>Points earned per room (per booking)</label><input type="number" min="0" step="1" id="rr-earn" value="${redeemRules.earnPerRoom}"><div class="text-muted" style="font-size:11px;margin-top:4px;">Example: booking with 2 rooms at 1,000 pts/room = 2,000 points earned.</div></div>` +
                `<div class="sec-title" style="font-size:13px;margin:14px 0 8px;"><span class="ic"><ion-icon name="gift"></ion-icon></span>Redemption</div>` +
                `<div class="form-group"><label>Points needed for a free room</label><input type="number" min="0" id="rr-min" value="${redeemRules.minPoints}"><div class="text-muted" style="font-size:11px;margin-top:4px;">This is also the minimum a guest must have to redeem anything (default: 6,000 points = 1 free room).</div></div>` +
                `<div class="form-group"><label>Value per 1,000 points (Rs., used for display only)</label><input type="number" min="0" step="0.01" id="rr-rate" value="${redeemRules.ratePer1000}"></div>` +
                `<div class="form-group"><label>Rewards (one per line)</label><textarea id="rr-rewards" rows="6" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-family:inherit;font-size:14px;resize:vertical;background:var(--surface);color:var(--text);">${esc(redeemRules.rewards.join('\n'))}</textarea></div>` +
                `<div class="text-muted" style="font-size:12px;">Tip: changing the earn rate only affects new bookings.</div>`;
            modal('<ion-icon name="setting"></ion-icon> Points Rules', b, function(ov) {
                let earn = Math.floor(parseFloat(ov.querySelector('#rr-earn').value));
                const rate = parseFloat(ov.querySelector('#rr-rate').value);
                let min = Math.floor(parseFloat(ov.querySelector('#rr-min').value));
                const rewards = ov.querySelector('#rr-rewards').value.split('\n').map(s => s.trim()).filter(Boolean);
                if (isNaN(earn) || earn < 0) { noticeModal('Enter a valid points-per-room value.', 'Points rules'); return false; }
                if (isNaN(rate) || rate < 0) { noticeModal('Enter a valid value per 1,000 points.', 'Points rules'); return false; }
                if (!rewards.length) { noticeModal('Add at least one reward.', 'Points rules'); return false; }
                if (isNaN(min) || min < 0) min = 0;
                redeemRules.earnPerRoom = earn;
                redeemRules.ratePer1000 = rate;
                redeemRules.minPoints = min;
                redeemRules.rewards = rewards;
                saveRedeemRules();
                render();
                toast('Points rules updated.');
                return true;
            }, 'Save');
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
