        //  ADD GUEST
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        function openAddGuest() {
            const b =
                `` +
                `<div class="form-row"><div class="form-group"><label>Full Name *</label><input id="g-name" placeholder="e.g. Ayesha Khan"></div><div class="form-group"><label>Phone Number *</label><input id="g-phone" placeholder="+92-3XX-XXXXXXX"></div></div>` +
                `<div class="form-row"><div class="form-group"><label>Email Address</label><input id="g-email" placeholder="guest@email.com"></div><div class="form-group"><label>Notes</label><input id="g-notes" placeholder="Room preferences, dietary needs..."></div></div>`;
            modal('<ion-icon name="person"></ion-icon> Register New Guest', b, function(ov) {
                const name = ov.querySelector('#g-name').value.trim(),
                    phone = ov.querySelector('#g-phone').value.trim();
                if (!name || !phone) { alert('Name and phone are required.'); return false; }
                guests.push({
                    id: Date.now(),
                    name,
                    phone,
                    email: ov.querySelector('#g-email').value.trim(),
                    notes: ov.querySelector('#g-notes').value.trim(),
                    spend: 0,
                    points: 0,
                    nights: 0,
                    stays: 0,
                    lastVisit: '-',
                    joined: today()
                });
                save();
                render();
                toast('Guest registered successfully.');
            });
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        //  ADD BOOKING – with payment tracking
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // ─── COMPANIES (special-rate accounts) ─────────────────
        function openManageCompanies() {
            const b =
                `` +
                `<div id="co-rows"></div>` +
                `<button type="button" class="btn btn-sm" id="co-add" style="margin-top:4px;"><ion-icon name="add"></ion-icon> Add Company</button>`;
            const ov = modal('<ion-icon name="business"></ion-icon> Manage Companies', b, function(ov) {
                const rows = [...ov.querySelectorAll('.co-row')];
                const list = [];
                for (const r of rows) {
                    const name = r.querySelector('.co-name').value.trim();
                    const rateStr = r.querySelector('.co-rate').value;
                    if (!name && !rateStr) continue; // skip fully blank rows
                    if (!name) { noticeModal('Enter a name for every company, or remove the empty row.', 'Companies'); return false; }
                    const rate = parseFloat(rateStr);
                    if (isNaN(rate) || rate < 0) { noticeModal(`Enter a valid rate for "${esc(name)}".`, 'Companies'); return false; }
                    list.push({ id: r.dataset.id || uid(), name: name, rate: rate });
                }
                companies = list;
                saveCompanies();
                render();
                toast('Companies updated.');
                return true;
            }, 'Save');
            const rowsWrap = ov.querySelector('#co-rows');

            function addRow(company) {
                const row = document.createElement('div');
                row.className = 'co-row';
                row.style.cssText = 'display:flex;gap:8px;align-items:flex-end;margin-bottom:10px;';
                if (company && company.id) row.dataset.id = company.id;
                row.innerHTML =
                    `<div class="form-group" style="flex:2;margin:0;"><label style="font-size:11px;">Company name</label><input class="co-name" placeholder="e.g. Acme Textiles" value="${company?esc(company.name):''}"></div>` +
                    `<div class="form-group" style="flex:1;margin:0;"><label style="font-size:11px;">Rate (Rs./room/night)</label><input class="co-rate" type="number" min="0" placeholder="e.g. 4500" value="${company?company.rate:''}"></div>` +
                    `<button type="button" class="btn btn-sm btn-danger co-del" title="Remove">✕</button>`;
                row.querySelector('.co-del').onclick = function() { row.remove(); };
                rowsWrap.appendChild(row);
            }
            companies.forEach(c => addRow(c));
            if (!companies.length) addRow(null);
            ov.querySelector('#co-add').onclick = function() { addRow(null); };
        }

        function openAddTx() {
            const b =
                `` +
                `<div class="form-group"><label>Guest *</label><div class="ac-wrap"><input id="t-guest-input" autocomplete="off" spellcheck="false" placeholder="Type to search guest..."><div id="t-guest-list" class="ac-list" style="display:none;"></div></div><div id="t-guest-preview" class="text-muted" style="font-size:12px;margin-top:4px;">Start typing to select a guest, or pick "Non-member".</div></div>` +
                `<div id="t-nonmember-name-group" style="display:none; margin-bottom:12px;"><div class="form-group"><label>Guest Name *</label><input id="t-nonmember-name" placeholder="Enter guest name..."></div></div>` +
                `<div class="form-row"><div class="form-group"><label>Number of Rooms</label><select id="t-rooms"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option></select></div><div class="form-group"><label>Price per Room (Rs.)</label><input type="number" min="0" id="t-price" placeholder="e.g. 5000"></div></div>` +
                `<div class="form-row"><div class="form-group"><label>Number of Nights</label><input type="number" min="1" id="t-nights" value="1"></div><div class="form-group"><label>Date</label><input type="date" id="t-date" value="${today()}"></div></div>` +
                `<div id="t-discount-section" style="display:none; margin-bottom:12px; padding:12px; background:var(--surface-2); border-radius:var(--radius-sm); border-left:3px solid var(--gold);"><div class="text-secondary" style="font-size:12px;"><ion-icon name="checkmark-circle"></ion-icon> Member discount (10%) automatically applied.</div></div>` +
                `<div class="total-preview" id="t-total-preview">
                    <div class="line"><span>Subtotal</span><span id="t-subtotal">Rs. 0</span></div>
                    <div class="line discount-line" id="t-discount-line" style="display:none;"><span>Discount (10%)</span><span id="t-discount-amount">-Rs. 0</span></div>
                    <div class="line total"><span>Total</span><span id="t-total">Rs. 0</span></div>
                    <div class="line"><span>Amount Paid by Customer</span><input type="number" min="0" id="t-paid" value="0" style="width:120px;display:inline-block;text-align:right;"></div>
                    <div class="line" style="font-weight:bold;color:var(--teal);"><span>Balance Owed</span><span id="t-balance">Rs. 0</span></div>
                    <div class="line"><span>Points to earn</span><span id="t-points">0</span></div>
                </div>` +
                `<div class="form-group"><label>Description</label><input id="t-desc" placeholder="e.g. Deluxe Room - 2 nights"></div>`;

            let selectedGuest = null;
            let selectedGuestId = null;

            const ov = modal('<ion-icon name="calendar"></ion-icon> New Booking', b, function(ov) {
                const guestId = selectedGuestId;
                const amt = parseFloat(ov.querySelector('#t-price').value);
                const nights = parseInt(ov.querySelector('#t-nights').value) || 1;
                const rooms = parseInt(ov.querySelector('#t-rooms').value) || 1;
                if (!guestId && guestId !== 'nonmember') { alert('Please select a guest, a company, or choose Non-member.'); return false; }
                if (!amt || amt <= 0) { alert('Please enter a valid price per room.'); return false; }

                const isNonMember = guestId === 'nonmember';
                const isCompany = typeof guestId === 'string' && guestId.indexOf('company:') === 0;
                let g = null;
                let company = null;
                let pts = 0;
                let totalAmount = 0;
                const discountPercent = 10;
                const subtotal = amt * rooms * nights;
                let nonMemberName = '';
                let paid = parseFloat(ov.querySelector('#t-paid').value) || 0;

                if (isCompany) {
                    company = byId(companies, guestId.slice('company:'.length));
                    if (!company) { alert('Company not found.'); return false; }
                    totalAmount = subtotal;
                    pts = 0;
                } else if (!isNonMember) {
                    g = byId(guests, parseInt(guestId));
                    if (!g) { alert('Guest not found.'); return false; }
                    resetTierIfInactive(g);
                    const date = ov.querySelector('#t-date').value;
                    const blackout = isBlackoutPeriod(date);
                    let finalDiscount = 0;
                    if (!blackout) {
                        finalDiscount = discountPercent;
                    }
                    const discountAmount = subtotal * (finalDiscount / 100);
                    totalAmount = subtotal - discountAmount;
                    pts = earnPointsForBooking(rooms);
                } else {
                    nonMemberName = ov.querySelector('#t-nonmember-name').value.trim();
                    if (!nonMemberName) {
                        alert('Please enter the guest name for non-member booking.');
                        ov.querySelector('#t-nonmember-name').focus();
                        return false;
                    }
                    totalAmount = subtotal;
                    pts = 0;
                }

                const balance = totalAmount - paid;

                const entry = {
                    id: Date.now(),
                    gId: isNonMember || isCompany ? null : parseInt(guestId),
                    date: ov.querySelector('#t-date').value,
                    type: 'Room Revenue',
                    amount: totalAmount,
                    desc: ov.querySelector('#t-desc').value || `${rooms} room(s) for ${nights} nights`,
                    pts: pts,
                    nights: nights,
                    nonMember: isNonMember,
                    nonMemberName: nonMemberName,
                    isCompany: isCompany,
                    companyId: isCompany ? company.id : null,
                    companyName: isCompany ? company.name : '',
                    rooms: rooms,
                    pricePerRoom: amt,
                    subtotal: subtotal,
                    discountPercent: (!isNonMember && !isCompany) ? discountPercent : 0,
                    discountApplied: (!isNonMember && !isCompany && !isBlackoutPeriod(ov.querySelector('#t-date').value)) ? discountPercent :
                        0,
                    paid: paid,
                    balance: balance,
                    cashEntryId: null
                };

                // If paid > 0, create cash entry
                if (paid > 0) {
                    const date = entry.date;
                    const month = getMonthFromDate(date);
                    // Create cash entry for Room income
                    cbSeq++;
                    try { localStorage.setItem('hms_cbseq', JSON.stringify(cbSeq)); } catch (e) {}
                    const ref = 'CB-' + pad3(cbSeq);
                    const cashId = uid();
                    const cat = getCashCategories().find(c => c.label === 'Room income');
                    if (cat) {
                        const cashAcct = 'General Cash'; // default
                        cashbook.unshift({
                            id: cashId,
                            seq: cbSeq,
                            date: date,
                            desc: `Payment for booking ${entry.id}`,
                            catLabel: cat.label,
                            account: cat.account,
                            dir: 'in',
                            method: 'cash',
                            amount: paid,
                            ref: ref,
                            cashType: 'general',
                            month: month,
                            archived: false
                        });
                        // Journal entries
                        journal.unshift({ id: uid(), date: date, ref: ref, account: cashAcct, desc: 'Payment for booking',
                            dr: paid, cr: 0, source: 'cashbook', cbId: cashId });
                        journal.unshift({ id: uid(), date: date, ref: ref, account: cat.account, desc: 'Payment for booking',
                            dr: 0, cr: paid, source: 'cashbook', cbId: cashId });
                        entry.cashEntryId = cashId;
                    } else {
                        toast('Warning: "Room income" category not found. Payment not recorded in cash book.');
                    }
                }

                txs.unshift(entry);

                if (!isNonMember && !isCompany) {
                    g.spend += totalAmount;
                    g.points += pts;
                    g.nights = (g.nights || 0) + nights;
                    g.stays = (g.stays || 0) + 1;
                    g.lastVisit = entry.date;
                }
                save();
                render();
                toast(isCompany ? `Company booking saved for ${company.name}.` :
                    isNonMember ? `Non-member booking saved for ${nonMemberName}.` :
                    `Booking saved. ${pts.toLocaleString()} points awarded.`);
                return true;
            });

            // ─── Autocomplete for guest ────────────────────────
            const input = ov.querySelector('#t-guest-input');
            const list = ov.querySelector('#t-guest-list');
            const preview = ov.querySelector('#t-guest-preview');
            const nonMemberGroup = ov.querySelector('#t-nonmember-name-group');

            function renderGuestAC() {
                const q = input.value.toLowerCase().trim();
                let matches = [];
                matches.push({ label: '<ion-icon name="walk"></ion-icon> Non-member (no points)', id: 'nonmember' });
                companies.forEach(c => {
                    if (c.name.toLowerCase().indexOf(q) >= 0) {
                        matches.push({ label: '<ion-icon name="business"></ion-icon> ' + c.name + ' (Company rate)', id: 'company:' + c.id });
                    }
                });
                guests.forEach(g => {
                    if (g.name.toLowerCase().indexOf(q) >= 0 || (g.phone && g.phone.indexOf(q) >= 0) || (g
                            .email && g.email.toLowerCase().indexOf(q) >= 0)) {
                        matches.push({ label: g.name + ' (Member)', id: g.id });
                    }
                });
                if (matches.length === 0) {
                    list.innerHTML = `<div class="ac-empty">No matches. Try typing a name or phone.</div>`;
                    list.style.display = 'block';
                    return;
                }
                list.innerHTML = matches.map(m =>
                    `<div class="ac-item" data-id="${m.id}"><span>${esc(m.label)}</span></div>`
                ).join('');
                list.style.display = 'block';
                list.querySelectorAll('.ac-item').forEach(el => {
                    el.addEventListener('mousedown', function(ev) { ev.preventDefault();
                        chooseGuest(el.getAttribute('data-id')); });
                });
            }

            function chooseGuest(id) {
                if (id === 'nonmember') {
                    selectedGuestId = 'nonmember';
                    selectedGuest = null;
                    input.value = '<ion-icon name="walk"></ion-icon> Non-member (no points)';
                    preview.innerHTML = 'Non-member — no discount, no points. Please enter guest name.';
                    nonMemberGroup.style.display = 'block';
                    ov.querySelector('#t-discount-section').style.display = 'none';
                } else if (typeof id === 'string' && id.indexOf('company:') === 0) {
                    const cid = id.slice('company:'.length);
                    const c = byId(companies, cid);
                    if (c) {
                        selectedGuestId = 'company:' + cid;
                        selectedGuest = null;
                        input.value = '<ion-icon name="business"></ion-icon> ' + c.name + ' (Company rate)';
                        preview.innerHTML = `Company — no discount, no points. Rate prefilled at ${PKR(c.rate)}/room, still editable below.`;
                        nonMemberGroup.style.display = 'none';
                        ov.querySelector('#t-discount-section').style.display = 'none';
                        const priceField = ov.querySelector('#t-price');
                        if (!priceField.value || parseFloat(priceField.value) === 0) priceField.value = c.rate;
                    }
                } else {
                    const g = byId(guests, parseInt(id));
                    if (g) {
                        resetTierIfInactive(g);
                        selectedGuestId = g.id;
                        selectedGuest = g;
                        input.value = g.name + ' (Member)';
                        preview.innerHTML =
                            `Member — 10% discount, ${earnRateLabel()}. Current points: ${g.points.toLocaleString()}.`;
                        nonMemberGroup.style.display = 'none';
                        ov.querySelector('#t-discount-section').style.display = 'block';
                    }
                }
                list.style.display = 'none';
                updateTotals(ov);
            }

            input.addEventListener('focus', renderGuestAC);
            input.addEventListener('input', function() {
                selectedGuestId = null;
                selectedGuest = null;
                nonMemberGroup.style.display = 'none';
                ov.querySelector('#t-discount-section').style.display = 'none';
                renderGuestAC();
            });
            input.addEventListener('blur', function() { setTimeout(() => { list.style.display = 'none'; }, 150); });

            // ─── Total update with paid and balance ─────────────
            function updateTotals(ov) {
                const price = parseFloat(ov.querySelector('#t-price').value) || 0;
                const nights = parseInt(ov.querySelector('#t-nights').value) || 1;
                const rooms = parseInt(ov.querySelector('#t-rooms').value) || 1;
                const subtotal = price * rooms * nights;
                let discount = 0;
                let points = 0;
                let total = subtotal;
                const date = ov.querySelector('#t-date').value;
                const paid = parseFloat(ov.querySelector('#t-paid').value) || 0;

                if (selectedGuestId && selectedGuestId !== 'nonmember' && !(typeof selectedGuestId === 'string' && selectedGuestId.indexOf('company:') === 0)) {
                    const g = byId(guests, parseInt(selectedGuestId));
                    if (g) {
                        const blackout = isBlackoutPeriod(date);
                        if (!blackout) {
                            discount = subtotal * 0.10;
                            total = subtotal - discount;
                        } else {
                            discount = 0;
                            total = subtotal;
                        }
                        points = earnPointsForBooking(rooms);
                        if (blackout) {
                            ov.querySelector('#t-discount-section').innerHTML =
                                `<div class="alert alert-warning" style="margin:0;"><ion-icon name="alert-circle"></ion-icon> Blackout period (Dec 15 - Jan 15): No discount applied, but you will still earn ${earnRateLabel()}.</div>`;
                        } else {
                            ov.querySelector('#t-discount-section').innerHTML =
                                `<div class="text-secondary" style="font-size:12px;"><ion-icon name="checkmark-circle"></ion-icon> Member discount (10%) automatically applied. Points earned: ${earnRateLabel()}.</div>`;
                        }
                        ov.querySelector('#t-discount-section').style.display = 'block';
                    }
                } else if (selectedGuestId === 'nonmember' || (typeof selectedGuestId === 'string' && selectedGuestId.indexOf('company:') === 0)) {
                    points = 0;
                    discount = 0;
                    total = subtotal;
                    ov.querySelector('#t-discount-section').style.display = 'none';
                }

                const balance = total - paid;
                const balanceColor = balance > 0 ? 'var(--coral)' : 'var(--teal)';

                ov.querySelector('#t-subtotal').textContent = PKR(subtotal);
                const discountLine = ov.querySelector('#t-discount-line');
                const discountAmountSpan = ov.querySelector('#t-discount-amount');
                if (discount > 0) {
                    discountLine.style.display = 'flex';
                    discountAmountSpan.textContent = '- ' + PKR(discount);
                    ov.querySelector('#t-discount-line span:first-child').textContent = 'Discount (10%)';
                } else {
                    discountLine.style.display = 'none';
                }
                ov.querySelector('#t-total').textContent = PKR(total);
                ov.querySelector('#t-points').textContent = points.toLocaleString();
                ov.querySelector('#t-balance').textContent = PKR(balance);
                ov.querySelector('#t-balance').style.color = balanceColor;
            }

            ov.querySelector('#t-price').addEventListener('input', function() { updateTotals(ov); });
            ov.querySelector('#t-nights').addEventListener('input', function() { updateTotals(ov); });
            ov.querySelector('#t-rooms').addEventListener('change', function() { updateTotals(ov); });
            ov.querySelector('#t-date').addEventListener('change', function() { updateTotals(ov); });
            ov.querySelector('#t-paid').addEventListener('input', function() { updateTotals(ov); });

            setTimeout(() => {
                updateTotals(ov);
            }, 50);
        }

        // ─── EDIT BOOKING (with payment handling) ──────────────
        function openEditBooking(id) {
            const tx = byId(txs, id);
            if (!tx) { noticeModal('Booking not found.', 'Edit booking'); return; }
            if (tx.redemption) {
                noticeModal('This is a points redemption and can\'t be edited. To reverse it, delete the row — the redeemed points will be refunded to the guest.', 'Redemption');
                return;
            }
            if (isOlderThanWeek(tx.date) && !adminUnlocked) {
                noticeModal('This booking is older than 7 days. Switch to Admin mode to edit it.', 'Admin required');
                return;
            }
            let guestOpts = '<option value="">Select guest...</option>';
            guestOpts += `<option value="nonmember" ${tx.nonMember?'selected':''}><ion-icon name="walk"></ion-icon> Non-member</option>`;
            companies.forEach(c => {
                const sel = (tx.isCompany && tx.companyId === c.id) ? 'selected' : '';
                guestOpts += `<option value="company:${c.id}" ${sel}><ion-icon name="business"></ion-icon> ${esc(c.name)} (Company rate)</option>`;
            });
            guests.forEach(g => {
                const sel = (g.id === tx.gId && !tx.nonMember && !tx.isCompany) ? 'selected' : '';
                guestOpts += `<option value="${g.id}" ${sel}>${esc(g.name)} (Member)</option>`;
            });

            const b =
                `` +
                `<div id="e-nonmember-name-group" style="${tx.nonMember?'display:block':'display:none'}; margin-bottom:12px;"><div class="form-group"><label>Guest Name *</label><input id="e-nonmember-name" value="${esc(tx.nonMemberName||'')}" placeholder="Enter guest name..."></div></div>` +
                `<div class="form-row"><div class="form-group"><label>Date</label><input type="date" id="e-date" value="${esc(tx.date)}"></div><div class="form-group"><label>Number of Rooms</label><select id="e-rooms">${[1,2,3,4,5,6,7,8,9].map(r => `<option value="${r}" ${tx.rooms===r?'selected':''}>${r}</option>`).join('')}</select></div></div>` +
                `<div class="form-row"><div class="form-group"><label>Price per Room (Rs.)</label><input type="number" min="0" id="e-price" value="${tx.pricePerRoom||0}"></div><div class="form-group"><label>Number of Nights</label><input type="number" min="1" id="e-nights" value="${tx.nights||1}"></div></div>` +
                `` +
                `<div class="total-preview" id="e-total-preview">
                    <div class="line"><span>Subtotal</span><span id="e-subtotal">Rs. 0</span></div>
                    <div class="line discount-line" id="e-discount-line" style="display:none;"><span>Discount (10%)</span><span id="e-discount-amount">-Rs. 0</span></div>
                    <div class="line total"><span>Total</span><span id="e-total">Rs. 0</span></div>
                    <div class="line"><span>Amount Paid by Customer</span><input type="number" min="0" id="e-paid" value="${tx.paid||0}" style="width:120px;display:inline-block;text-align:right;"></div>
                    <div class="line" style="font-weight:bold;color:var(--teal);"><span>Balance Owed</span><span id="e-balance">Rs. 0</span></div>
                    <div class="line"><span>Points to earn</span><span id="e-points">0</span></div>
                </div>` +
                `<div class="form-group"><label>Description</label><input id="e-desc" value="${esc(tx.desc)}"></div>`;

            const ov = modal('<ion-icon name="create"></ion-icon> Edit Booking', b, function(ov) {
                const guestVal = ov.querySelector('#e-guest').value;
                const amt = parseFloat(ov.querySelector('#e-price').value);
                const nights = parseInt(ov.querySelector('#e-nights').value) || 1;
                const rooms = parseInt(ov.querySelector('#e-rooms').value) || 1;
                const date = ov.querySelector('#e-date').value;
                const isNonMember = guestVal === 'nonmember';
                const isCompany = typeof guestVal === 'string' && guestVal.indexOf('company:') === 0;
                if (!guestVal) { alert('Please select a guest.'); return false; }
                if (!amt || amt <= 0) { alert('Please enter a valid price per room.'); return false; }

                let nonMemberName = '';
                if (isNonMember) {
                    nonMemberName = ov.querySelector('#e-nonmember-name').value.trim();
                    if (!nonMemberName) {
                        alert('Please enter the guest name for non-member booking.');
                        ov.querySelector('#e-nonmember-name').focus();
                        return false;
                    }
                }
                let company = null;
                if (isCompany) {
                    company = byId(companies, guestVal.slice('company:'.length));
                    if (!company) { alert('Company not found.'); return false; }
                }

                // Remove old booking's effects from guest
                if (!tx.nonMember && !tx.isCompany) {
                    const oldG = byId(guests, tx.gId);
                    if (oldG) {
                        oldG.spend -= tx.amount;
                        oldG.points -= tx.pts || 0;
                        oldG.nights -= tx.nights || 0;
                        oldG.stays -= 1;
                    }
                }

                // Remove old cash entry if exists
                if (tx.cashEntryId) {
                    cashbook = cashbook.filter(e => e.id !== tx.cashEntryId);
                    journal = journal.filter(j => j.cbId !== tx.cashEntryId);
                }

                txs = txs.filter(t => t.id !== id);

                let g = null;
                let pts = 0;
                let totalAmount = 0;
                const subtotal = amt * rooms * nights;
                let paid = parseFloat(ov.querySelector('#e-paid').value) || 0;

                if (isCompany) {
                    totalAmount = subtotal;
                    pts = 0;
                } else if (!isNonMember) {
                    g = byId(guests, parseInt(guestVal));
                    if (!g) { alert('Guest not found.'); return false; }
                    resetTierIfInactive(g);
                    const blackout = isBlackoutPeriod(date);
                    let finalDiscount = 0;
                    if (!blackout) {
                        finalDiscount = 10;
                    }
                    const discountAmount = subtotal * (finalDiscount / 100);
                    totalAmount = subtotal - discountAmount;
                    pts = earnPointsForBooking(rooms);
                    g.spend += totalAmount;
                    g.points += pts;
                    g.nights += nights;
                    g.stays += 1;
                    g.lastVisit = date;
                } else {
                    totalAmount = subtotal;
                    pts = 0;
                }

                const balance = totalAmount - paid;
                let cashEntryId = null;

                // If paid > 0, create cash entry
                if (paid > 0) {
                    const month = getMonthFromDate(date);
                    cbSeq++;
                    try { localStorage.setItem('hms_cbseq', JSON.stringify(cbSeq)); } catch (e) {}
                    const ref = 'CB-' + pad3(cbSeq);
                    const cashId = uid();
                    const cat = getCashCategories().find(c => c.label === 'Room income');
                    if (cat) {
                        const cashAcct = 'General Cash';
                        cashbook.unshift({
                            id: cashId,
                            seq: cbSeq,
                            date: date,
                            desc: `Payment for booking ${id}`,
                            catLabel: cat.label,
                            account: cat.account,
                            dir: 'in',
                            method: 'cash',
                            amount: paid,
                            ref: ref,
                            cashType: 'general',
                            month: month,
                            archived: false
                        });
                        journal.unshift({ id: uid(), date: date, ref: ref, account: cashAcct, desc: 'Payment for booking',
                            dr: paid, cr: 0, source: 'cashbook', cbId: cashId });
                        journal.unshift({ id: uid(), date: date, ref: ref, account: cat.account, desc: 'Payment for booking',
                            dr: 0, cr: paid, source: 'cashbook', cbId: cashId });
                        cashEntryId = cashId;
                    }
                }

                const newEntry = {
                    id: id,
                    gId: (isNonMember || isCompany) ? null : parseInt(guestVal),
                    date: date,
                    type: 'Room Revenue',
                    amount: totalAmount,
                    desc: ov.querySelector('#e-desc').value.trim() || `${rooms} room(s) for ${nights} nights`,
                    pts: pts,
                    nights: nights,
                    nonMember: isNonMember,
                    nonMemberName: nonMemberName,
                    isCompany: isCompany,
                    companyId: isCompany ? company.id : null,
                    companyName: isCompany ? company.name : '',
                    rooms: rooms,
                    pricePerRoom: amt,
                    subtotal: subtotal,
                    discountPercent: (!isNonMember && !isCompany) ? 10 : 0,
                    discountApplied: (!isNonMember && !isCompany && !isBlackoutPeriod(date)) ? 10 : 0,
                    paid: paid,
                    balance: balance,
                    cashEntryId: cashEntryId
                };
                txs.unshift(newEntry);
                save();
                render();
                toast('Booking updated.');
                return true;
            });

            function updateEditTotals() {
                const guestVal = ov.querySelector('#e-guest').value;
                const amt = parseFloat(ov.querySelector('#e-price').value) || 0;
                const nights = parseInt(ov.querySelector('#e-nights').value) || 1;
                const rooms = parseInt(ov.querySelector('#e-rooms').value) || 1;
                const date = ov.querySelector('#e-date').value;
                const subtotal = amt * rooms * nights;
                let discount = 0;
                let points = 0;
                let total = subtotal;
                const paid = parseFloat(ov.querySelector('#e-paid').value) || 0;
                const nonMemberGroup = ov.querySelector('#e-nonmember-name-group');

                if (guestVal === 'nonmember') {
                    nonMemberGroup.style.display = 'block';
                    points = 0;
                    discount = 0;
                    total = subtotal;
                    ov.querySelector('#e-discount-section').style.display = 'none';
                } else if (typeof guestVal === 'string' && guestVal.indexOf('company:') === 0) {
                    nonMemberGroup.style.display = 'none';
                    points = 0;
                    discount = 0;
                    total = subtotal;
                    ov.querySelector('#e-discount-section').style.display = 'none';
                } else if (guestVal) {
                    nonMemberGroup.style.display = 'none';
                    const g = byId(guests, parseInt(guestVal));
                    if (g) {
                        const blackout = isBlackoutPeriod(date);
                        if (!blackout) {
                            discount = subtotal * 0.10;
                            total = subtotal - discount;
                        } else {
                            discount = 0;
                            total = subtotal;
                        }
                        points = earnPointsForBooking(rooms);
                        if (blackout) {
                            ov.querySelector('#e-discount-section').innerHTML =
                                `<div class="alert alert-warning" style="margin:0;"><ion-icon name="alert-circle"></ion-icon> Blackout period (Dec 15 - Jan 15): No discount applied, but you will still earn ${earnRateLabel()}.</div>`;
                        } else {
                            ov.querySelector('#e-discount-section').innerHTML =
                                `<div class="text-secondary" style="font-size:12px;"><ion-icon name="checkmark-circle"></ion-icon> Member discount (10%) automatically applied. Points earned: ${earnRateLabel()}.</div>`;
                        }
                        ov.querySelector('#e-discount-section').style.display = 'block';
                    }
                } else {
                    nonMemberGroup.style.display = 'none';
                    ov.querySelector('#e-discount-section').style.display = 'none';
                }

                const balance = total - paid;
                const balanceColor = balance > 0 ? 'var(--coral)' : 'var(--teal)';

                ov.querySelector('#e-subtotal').textContent = PKR(subtotal);
                const dl = ov.querySelector('#e-discount-line');
                const da = ov.querySelector('#e-discount-amount');
                if (discount > 0) {
                    dl.style.display = 'flex';
                    da.textContent = '- ' + PKR(discount);
                    ov.querySelector('#e-discount-line span:first-child').textContent = 'Discount (10%)';
                } else {
                    dl.style.display = 'none';
                }
                ov.querySelector('#e-total').textContent = PKR(total);
                ov.querySelector('#e-points').textContent = points.toLocaleString();
                ov.querySelector('#e-balance').textContent = PKR(balance);
                ov.querySelector('#e-balance').style.color = balanceColor;
            }

            ov.querySelector('#e-guest').onchange = updateEditTotals;
            ov.querySelector('#e-price').oninput = updateEditTotals;
            ov.querySelector('#e-nights').oninput = updateEditTotals;
            ov.querySelector('#e-rooms').onchange = updateEditTotals;
            ov.querySelector('#e-date').onchange = updateEditTotals;
            ov.querySelector('#e-paid').oninput = updateEditTotals;
            setTimeout(updateEditTotals, 50);
        }

        // ─── DELETE BOOKING ─────────────────────────────────────
        function deleteBooking(id) {
            const tx = byId(txs, id);
            if (!tx) { noticeModal('Booking not found.', 'Delete booking'); return; }
            if (isOlderThanWeek(tx.date) && !adminUnlocked) {
                noticeModal('This booking is older than 7 days. Switch to Admin mode to delete it.', 'Admin required');
                return;
            }
            const who = bookingGuestName(tx);
            const msg = tx.redemption ?
                `Delete this redemption for ${esc(who)} on ${esc(tx.date)}? ${(tx.pointsRedeemed||0).toLocaleString()} points will be refunded to the guest.` :
                `Delete this booking for ${esc(who)} on ${esc(tx.date)}? This will also revert guest stats and remove any associated cash entry.`;
            confirmModal(msg, function() {
                if (tx.redemption) {
                    const g = byId(guests, tx.gId);
                    if (g) g.points += tx.pointsRedeemed || 0;
                    txs = txs.filter(t => t.id !== id);
                    save();
                    render();
                    toast('Redemption reversed and points refunded.');
                    return;
                }
                if (!tx.nonMember && !tx.isCompany) {
                    const g = byId(guests, tx.gId);
                    if (g) {
                        g.spend -= tx.amount;
                        g.points -= tx.pts || 0;
                        g.nights -= tx.nights || 0;
                        g.stays -= 1;
                    }
                }
                // Remove cash entry if exists
                if (tx.cashEntryId) {
                    cashbook = cashbook.filter(e => e.id !== tx.cashEntryId);
                    journal = journal.filter(j => j.cbId !== tx.cashEntryId);
                }
                txs = txs.filter(t => t.id !== id);
                save();
                render();
                toast('Booking deleted.');
            }, { danger: true, title: tx.redemption ? 'Reverse redemption' : 'Delete booking', yesLabel: tx.redemption ? 'Refund' : 'Delete' });
        }

        // ─── EDIT CASH ENTRY ────────────────────────────────────
        function openEditCashEntry(id) {
            const entry = byId(cashbook, id);
            if (!entry) { alert('Entry not found.'); return; }
            if (isOlderThanWeek(entry.date) && !adminUnlocked) {
                alert('This entry is older than 7 days. You need Admin mode to edit it.');
                return;
            }
            const cats = getCashCategories();
            let catOpts = '<option value="">Select category...</option>';
            const visibleCats = adminUnlocked ? cats : cats.filter(c => c.reg === true);
            visibleCats.forEach(c => {
                const sel = (c.label === entry.catLabel) ? 'selected' : '';
                catOpts += `<option value="${esc(c.label)}" ${sel}>${esc(c.label)} (${c.dir==='in'?'In':'Out'})</option>`;
            });

            const b =
                `<div class="form-row"><div class="form-group"><label>Date</label><input type="date" id="ce-date" value="${esc(entry.date)}"></div><div class="form-group"><label>Account</label><select id="ce-method">${PAYMENT_METHOD_OPTIONS.map(m=>`<option value="${m.value}" ${entry.method===m.value?'selected':''}>${m.label}</option>`).join('')}</select></div></div>` +
                `<div id="ce-cash-type-group" style="${entry.method==='cash' && adminUnlocked ? 'display:block' : 'display:none'}"><div class="form-group"><label>Cash Type</label><select id="ce-cash-type"><option value="general" ${entry.cashType==='general'?'selected':''}>General Cash</option><option value="petty" ${entry.cashType==='petty'?'selected':''}>Petty Cash</option></select></div></div>` +
                `<div class="form-group"><label>Category</label><select id="ce-cat">${catOpts}</select></div>` +
                `<div class="form-row"><div class="form-group"><label>Amount (Rs.)</label><input type="number" min="0" id="ce-amt" value="${entry.amount}"></div><div class="form-group"><label>Note</label><input id="ce-desc" value="${esc(entry.desc||'')}"></div></div>`;

            const ov = modal('✎ Edit Cash Entry', b, function(ov) {
                const catLabel = ov.querySelector('#ce-cat').value;
                const amt = parseFloat(ov.querySelector('#ce-amt').value);
                const date = ov.querySelector('#ce-date').value;
                const method = ov.querySelector('#ce-method').value;
                const cashType = ov.querySelector('#ce-cash-type') ? ov.querySelector('#ce-cash-type').value :
                    (adminUnlocked ? 'general' : (entry.dir === 'in' ? 'general' : 'petty'));
                const desc = ov.querySelector('#ce-desc').value.trim();
                if (!catLabel || !amt || amt <= 0) { alert('Please select a category and enter a valid amount.'); return false; }
                const cat = cats.find(c => c.label === catLabel);
                if (!cat) { alert('Category not found.'); return false; }

                journal = journal.filter(j => j.cbId !== id);
                const idx = cashbook.findIndex(e => e.id === id);
                if (idx === -1) { alert('Entry not found.'); return false; }

                let finalCashType = cashType;
                if (!adminUnlocked) {
                    finalCashType = cat.dir === 'in' ? 'general' : 'petty';
                }

                const oldEntry = cashbook[idx];
                const month = getMonthFromDate(date);
                cashbook[idx] = { ...oldEntry, date, desc, catLabel: cat.label, account: cat.account, dir: cat.dir,
                    method, amount: amt, cashType: finalCashType, month: month };
                const ref = cashbook[idx].ref;
                const cashAcct = methodAccountName(method, finalCashType);
                const note = desc || cat.label;
                if (cat.dir === 'in') {
                    journal.unshift({ id: uid(), date, ref, account: cashAcct, desc: note, dr: amt, cr: 0,
                        source: 'cashbook', cbId: id });
                    journal.unshift({ id: uid(), date, ref, account: cat.account, desc: note, dr: 0, cr: amt,
                        source: 'cashbook', cbId: id });
                } else {
                    journal.unshift({ id: uid(), date, ref, account: cat.account, desc: note, dr: amt, cr: 0,
                        source: 'cashbook', cbId: id });
                    journal.unshift({ id: uid(), date, ref, account: cashAcct, desc: note, dr: 0, cr: amt,
                        source: 'cashbook', cbId: id });
                }
                save();
                render();
                toast('Cash entry updated.');
                return true;
            });

            const methodSelect = ov.querySelector('#ce-method');
            const cashTypeGroup = ov.querySelector('#ce-cash-type-group');
            methodSelect.onchange = function() {
                if (this.value === 'cash' && adminUnlocked) {
                    cashTypeGroup.style.display = 'block';
                } else {
                    cashTypeGroup.style.display = 'none';
                }
            };
            if (!adminUnlocked) {
                cashTypeGroup.style.display = 'none';
            }
        }

        // ─── DELETE CASH ENTRY ─────────────────────────────────
        function deleteCashEntry(id) {
            const entry = byId(cashbook, id);
            if (!entry) { noticeModal('Entry not found.', 'Delete cash entry'); return; }
            if (isOlderThanWeek(entry.date) && !adminUnlocked) {
                noticeModal('This entry is older than 7 days. Switch to Admin mode to delete it.', 'Admin required');
                return;
            }
            // Check if this cash entry is linked to a booking
            const linkedBooking = txs.find(t => t.cashEntryId === id);
            if (linkedBooking) {
                noticeModal('This cash entry is the payment recorded for a booking. To remove it, delete that booking — or edit the booking to change the amount paid — on the Bookings page.', 'Linked to a booking');
                return;
            }
            let msg = 'Delete this cash book entry? It will also be removed from the ledger.';
            if ((entry.isReplenish && entry.replenishPair) || (entry.isTransfer && entry.transferPair)) {
                const pairId = entry.replenishPair || entry.transferPair;
                const pair = byId(cashbook, pairId);
                if (pair) msg = `This is part of a paired transaction. The paired entry "${esc(pair.catLabel)}" will remain. Delete this entry anyway? It will also be removed from the ledger.`;
            }
            confirmModal(msg, function() {
                cashbook = cashbook.filter(e => e.id !== id);
                journal = journal.filter(j => j.cbId !== id);
                save();
                render();
                toast('Entry deleted.');
            }, { danger: true, title: 'Delete cash entry', yesLabel: 'Delete' });
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
