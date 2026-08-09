        function pageCOA() {
            let h =
                ``;

            // Cash Book Categories management
            h += `<div class="panel" style="margin-bottom:16px;"><div class="panel-body"><div class="flex-between"><div class="sec-title" style="margin-bottom:0;"><span class="ic"> <ion-icon name="wallet"></ion-icon></span>Cash Book Categories</div><button class="btn btn-sm btn-gold" onclick="openAddCashCategory()"><ion-icon name="add"></ion-icon> Add Category</button></div>`;
            h += `<div style="margin-top:12px;">`;
            const cats = getCashCategories();
            if (cats.length) {
                cats.forEach((c, idx) => {
                    const isCustom = c.custom === true;
                    const badge = c.reg ? 'cat-badge-staff' : 'cat-badge-admin';
                    const regLabel = c.reg ? 'Staff' : 'Admin';
                    h +=
                        `<div class="cat-item"><span>${esc(c.label)} <span class="cat-badge ${c.dir==='in'?'cat-badge-in':'cat-badge-out'}">${c.dir==='in'?'In':'Out'}</span> <span class="cat-badge ${badge}">${regLabel}</span> ${isCustom?'<span style="font-size:10px;color:var(--text-muted);">(custom)</span>':''}</span><div class="flex gap-8" style="align-items:center;"><span style="font-size:12px;color:var(--text-muted);"><ion-icon name="arrow-forward"></ion-icon> ${esc(c.account)}</span><button class="btn btn-sm btn-teal" onclick="openEditCashCategory(${idx})" title="Edit"><ion-icon name="create"></ion-icon></button><button class="btn btn-sm btn-danger" onclick="deleteCashCategory(${idx})" title="Delete"><ion-icon name="close"></ion-icon></button></div></div>`;
                });
            } else {
                h += emptyState('<ion-icon name="document-text"></ion-icon>', 'No categories', 'Add a cash category to start.');
            }
            h += `</div></div></div>`;

            // COA sections
            for (const sec in coa) {
                const data = coa[sec];
                const open = coaOpen[sec];
                h += `<div class="coa-card"><div class="coa-hdr" onclick="toggleCOA('${sec}')"><div class="flex gap-8" style="align-items:center;"><div style="width:34px;height:34px;border-radius:var(--radius-sm);background:${data.color}1A;display:flex;align-items:center;justify-content:center;color:${data.color};font-weight:700;">${sec.charAt(0)}</div><span style="font-weight:700;font-size:14px;">${sec}</span><span class="text-muted" style="font-size:12px;">${data.accts.length} accounts</span></div><div class="flex gap-8" style="align-items:center;"><button class="coa-add-btn" onclick="event.stopPropagation();openAddAccount('${sec}')">+ Add</button><span class="text-muted">${open?'<ion-icon name="caret-up"></ion-icon>':'<ion-icon name="caret-down"></ion-icon>'}</span></div></div>`;
                if (open) {
                    h += `<div class="coa-body">`;
                    data.accts.forEach(a => {
                        const protectedAcct = PROTECTED_ACCOUNTS.indexOf(a.name) >= 0;
                        h +=
                            `<div class="coa-item"><div class="flex gap-12" style="align-items:center;flex-wrap:wrap;"><span class="mono text-muted" style="min-width:42px;">${a.code}</span><span>${esc(a.name)}</span>${(a.opening||0)!==0?`<span class="text-muted" style="font-size:11px;">Opening: ${PKR(a.opening)}</span>`:''}${protectedAcct?'<span class="text-muted" style="font-size:10px;"><ion-icon name="lock-closed"></ion-icon> system</span>':''}</div><div class="flex gap-8" style="align-items:center;"><span style="font-size:11px;font-weight:700;padding:2px 10px;border-radius:30px;background:${a.type==='debit'?'var(--teal-light)':'var(--coral-light)'};color:${a.type==='debit'?'var(--teal)':'var(--coral)'};">${a.type.toUpperCase()}</span><button class="btn btn-sm btn-teal" onclick="openEditAccount('${esc(sec)}','${esc(a.code)}')" title="Edit"><ion-icon name="create"></ion-icon></button><button class="btn btn-sm btn-danger" onclick="deleteAccount('${esc(sec)}','${esc(a.code)}')" title="Delete"><ion-icon name="close"></ion-icon></button></div></div>`;
                    });
                    h += `</div>`;
                }
                h += `</div>`;
            }
            return h;
        }

        // ─── SETTINGS ──────────────────────────────────────────
