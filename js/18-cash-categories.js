//  CASH BOOK CATEGORIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getCashCategories() {
  return cashCategories || [];
}

// Most-used categories, derived from actual Cash Book history (always accurate, no separate counter to maintain).
// Respects staff/admin visibility and, if given, restricts to categories the guest is currently searching for.
function getFavoriteCategories(limit, staffOnly) {
  limit = limit || 6;
  const counts = {};
  cashbook.forEach((e) => {
    counts[e.catLabel] = (counts[e.catLabel] || 0) + 1;
  });
  const cats = getCashCategories();
  const withCounts = cats
    .filter((c) => !staffOnly || c.reg === true)
    .map((c) => ({ cat: c, count: counts[c.label] || 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((x) => x.cat);
  return withCounts;
}

function openAddCashCategory() {
  let accOpts = '<option value="">Select account...</option>';
  for (const sec in coa) {
    coa[sec].accts.forEach((a) => {
      accOpts += `<option value="${esc(a.name)}">[${a.code}] ${esc(a.name)}</option>`;
    });
  }
  const b =
    `` +
    `<div class="form-group"><label>Category Label *</label><input id="cc-label" placeholder="e.g. Petty Cash"></div>` +
    `<div class="form-group"><label>Ledger Account *</label><select id="cc-account">${accOpts}</select></div>` +
    `<div class="form-row"><div class="form-group"><label>Direction</label><select id="cc-dir"><option value="in">Money In</option><option value="out">Money Out</option><option value="both">Both (Money In & Out)</option></select></div><div class="form-group"><label>Access</label><select id="cc-reg"><option value="true">Staff (daily ops)</option><option value="false">Admin (executive)</option></select></div></div>`;
  modal('<ion-icon name="add"></ion-icon> Add Cash Category', b, function (ov) {
    const label = ov.querySelector("#cc-label").value.trim();
    const account = ov.querySelector("#cc-account").value;
    const dir = ov.querySelector("#cc-dir").value;
    const reg = ov.querySelector("#cc-reg").value === "true";
    if (!label || !account) {
      alert("Please fill in label and account.");
      return false;
    }
    if (cashCategories.some((c) => c.label === label)) {
      alert("A category with this name already exists.");
      return false;
    }
    cashCategories.push({ label, account, dir, reg, custom: true });
    saveCashCategories();
    render();
    toast("Cash category added.");
  });
}

function openEditCashCategory(idx) {
  const cat = cashCategories[idx];
  if (!cat) {
    noticeModal("Category not found.", "Edit category");
    return;
  }
  let accOpts = "";
  for (const sec in coa) {
    accOpts += `<optgroup label="${esc(sec)}">`;
    coa[sec].accts.forEach((a) => {
      accOpts += `<option value="${esc(a.name)}" ${cat.account === a.name ? "selected" : ""}>[${a.code}] ${esc(a.name)}</option>`;
    });
    accOpts += `</optgroup>`;
  }
  const b =
    `<div class="form-group"><label>Category Label *</label><input id="cc-label" value="${esc(cat.label)}"></div>` +
    `<div class="form-group"><label>Ledger Account *</label><select id="cc-account">${accOpts}</select></div>` +
    `<div class="form-row"><div class="form-group"><label>Direction</label><select id="cc-dir"><option value="in" ${cat.dir === "in" ? "selected" : ""}>Money In</option><option value="out" ${cat.dir === "out" ? "selected" : ""}>Money Out</option><option value="both" ${cat.dir === "both" ? "selected" : ""}>Both (Money In & Out)</option></select></div><div class="form-group"><label>Access</label><select id="cc-reg"><option value="true" ${cat.reg ? "selected" : ""}>Staff (daily ops)</option><option value="false" ${!cat.reg ? "selected" : ""}>Admin (executive)</option></select></div></div>` +
    `<div class="text-muted" style="font-size:12px;">Renaming updates its item/subcategory list to match. Past Cash Book entries keep showing their original category name, so your history stays intact.</div>`;
  modal(
    '<ion-icon name="create"></ion-icon> Edit Cash Category',
    b,
    function (ov) {
      const label = ov.querySelector("#cc-label").value.trim();
      const account = ov.querySelector("#cc-account").value;
      const dir = ov.querySelector("#cc-dir").value;
      const reg = ov.querySelector("#cc-reg").value === "true";
      if (!label || !account) {
        alert("Please fill in label and account.");
        return false;
      }
      const dup = cashCategories.some((c, i) => i !== idx && c.label === label);
      if (dup) {
        alert("A category with this name already exists.");
        return false;
      }
      const oldLabel = cat.label;
      if (label !== oldLabel && subCategories[oldLabel]) {
        subCategories[label] = subCategories[oldLabel];
        delete subCategories[oldLabel];
        saveSubCategories();
      }
      cat.label = label;
      cat.account = account;
      cat.dir = dir;
      cat.reg = reg;
      saveCashCategories();
      render();
      toast("Cash category updated.");
      return true;
    },
  );
}

function deleteCashCategory(idx) {
  const cat = cashCategories[idx];
  if (!cat) {
    noticeModal("Category not found.", "Delete category");
    return;
  }
  const usageCount = cashbook.filter((e) => e.catLabel === cat.label).length;
  const msg =
    usageCount > 0
      ? `Delete the category "${esc(cat.label)}"? It has ${usageCount} past Cash Book ${usageCount === 1 ? "entry" : "entries"} — those will keep showing "${esc(cat.label)}" as their category, but it will no longer be available for new entries.`
      : `Delete the category "${esc(cat.label)}"? It hasn't been used yet, so nothing else is affected.`;
  confirmModal(
    msg,
    function () {
      cashCategories.splice(idx, 1);
      if (subCategories[cat.label]) {
        delete subCategories[cat.label];
        saveSubCategories();
      }
      saveCashCategories();
      render();
      toast("Cash category deleted.");
    },
    { danger: true, title: "Delete category", yesLabel: "Delete" },
  );
}

function openEditAccount(section, code) {
  const acct = coa[section] && coa[section].accts.find((a) => a.code === code);
  if (!acct) {
    noticeModal("Account not found.", "Edit account");
    return;
  }
  const protectedAcct = PROTECTED_ACCOUNTS.indexOf(acct.name) >= 0;
  const lockNote = protectedAcct
    ? `<div class="alert alert-warning" style="margin-bottom:14px;">"${esc(acct.name)}" is a core system account used throughout the Cash Book, so its name and type can't be changed here. You can still update its opening balance.</div>`
    : "";
  const b =
    lockNote +
    `<div class="form-group"><label>Account Code</label><input value="${esc(acct.code)}" disabled style="opacity:.6;"></div>` +
    `<div class="form-group"><label>Account Name *</label><input id="ea-name" value="${esc(acct.name)}" ${protectedAcct ? 'disabled style="opacity:.6;"' : ""}></div>` +
    `<div class="form-row"><div class="form-group"><label>Type</label><select id="ea-type" ${protectedAcct ? 'disabled style="opacity:.6;"' : ""}><option value="debit" ${acct.type === "debit" ? "selected" : ""}>Debit</option><option value="credit" ${acct.type === "credit" ? "selected" : ""}>Credit</option></select></div><div class="form-group"><label>Opening Balance (Rs.)</label><input type="number" id="ea-opening" value="${acct.opening || 0}"></div></div>` +
    (protectedAcct
      ? ""
      : `<div class="text-muted" style="font-size:12px;">Renaming this account updates every past and future journal entry and cash category linked to it, so nothing gets orphaned.</div>`);
  modal(`<ion-icon name="create"></ion-icon> Edit Account`, b, function (ov) {
    const newOpening = parseFloat(ov.querySelector("#ea-opening").value) || 0;
    if (protectedAcct) {
      acct.opening = newOpening;
      saveCoa();
      render();
      toast("Opening balance updated.");
      return true;
    }
    const newName = ov.querySelector("#ea-name").value.trim();
    const newType = ov.querySelector("#ea-type").value;
    if (!newName) {
      alert("Account name is required.");
      return false;
    }
    const dupName =
      newName !== acct.name &&
      Object.keys(coa).some((s) =>
        coa[s].accts.some((a) => a.name === newName),
      );
    if (dupName) {
      alert("An account with this name already exists.");
      return false;
    }
    const oldName = acct.name;
    if (newName !== oldName) {
      // Cascade the rename so no journal line or cash category is left pointing at the old name.
      journal.forEach((j) => {
        if (j.account === oldName) j.account = newName;
      });
      cashCategories.forEach((c) => {
        if (c.account === oldName) c.account = newName;
      });
    }
    acct.name = newName;
    acct.type = newType;
    acct.opening = newOpening;
    saveCoa();
    saveCashCategories();
    save();
    render();
    toast(
      newName !== oldName
        ? `Account renamed to "${newName}" — linked entries updated.`
        : "Account updated.",
    );
    return true;
  });
}

function deleteAccount(section, code) {
  const acct = coa[section] && coa[section].accts.find((a) => a.code === code);
  if (!acct) {
    noticeModal("Account not found.", "Delete account");
    return;
  }
  if (PROTECTED_ACCOUNTS.indexOf(acct.name) >= 0) {
    noticeModal(
      `"${esc(acct.name)}" is a core system account and can't be deleted.`,
      "Protected account",
    );
    return;
  }
  const usedInJournal = journal.some((j) => j.account === acct.name);
  const linkedCats = cashCategories.filter((c) => c.account === acct.name);
  if (usedInJournal) {
    noticeModal(
      `"${esc(acct.name)}" has journal entries recorded against it, so it can't be deleted (this protects your historical records). If you no longer need it, you can still stop using it going forward.`,
      "Account has activity",
    );
    return;
  }
  if (linkedCats.length) {
    noticeModal(
      `"${esc(acct.name)}" is still linked to ${linkedCats.length} Cash Book ${linkedCats.length === 1 ? "category" : "categories"} (${linkedCats.map((c) => esc(c.label)).join(", ")}). Edit or delete ${linkedCats.length === 1 ? "that category" : "those categories"} first, then delete this account.`,
      "Account in use",
    );
    return;
  }
  confirmModal(
    `Delete the account "${esc(acct.name)}" [${esc(acct.code)}]? This can't be undone.`,
    function () {
      coa[section].accts = coa[section].accts.filter((a) => a.code !== code);
      saveCoa();
      render();
      toast("Account deleted.");
    },
    { danger: true, title: "Delete account", yesLabel: "Delete" },
  );
}

function openAddAccount(section) {
  const b =
    `<div class="form-group"><label>Account Code *</label><input id="ac-code" placeholder="e.g. 7001"></div>` +
    `<div class="form-group"><label>Account Name *</label><input id="ac-name" placeholder="e.g. New Revenue Account"></div>` +
    `<div class="form-row"><div class="form-group"><label>Type</label><select id="ac-type"><option value="debit">Debit</option><option value="credit">Credit</option></select></div><div class="form-group"><label>Opening Balance (Rs.)</label><input type="number" id="ac-opening" value="0"></div></div>` +
    `<div class="text-muted" style="font-size:12px;">Opening balance is useful if you're starting to track an account that already has a balance (e.g. migrating from paper records).</div>`;
  modal(
    `<ion-icon name="add"></ion-icon> Add Account to ${section}`,
    b,
    function (ov) {
      const code = ov.querySelector("#ac-code").value.trim();
      const name = ov.querySelector("#ac-name").value.trim();
      const type = ov.querySelector("#ac-type").value;
      const opening = parseFloat(ov.querySelector("#ac-opening").value) || 0;
      if (!code || !name) {
        alert("Code and name are required.");
        return false;
      }
      if (!coa[section]) {
        alert("Section not found.");
        return false;
      }
      const dup = coa[section].accts.some((a) => a.code === code);
      if (dup) {
        alert("Account code already exists in this section.");
        return false;
      }
      const dupName =
        coa[section].accts.some((a) => a.name === name) ||
        Object.keys(coa).some((s) => coa[s].accts.some((a) => a.name === name));
      if (dupName) {
        alert("An account with this name already exists.");
        return false;
      }
      coa[section].accts.push({ code, name, type, opening });
      saveCoa();
      render();
      toast(`Account ${name} added to ${section}.`);
    },
  );
}

// ─── CASH ENTRY ────────────────────────────────────────
function openCashEntry(presetCategoryLabel) {
  const cats = getCashCategories();
  const favorites = getFavoriteCategories(6, !adminUnlocked);
  const favChipsHtml = favorites.length
    ? `<div class="form-group"><label style="font-size:11px;color:var(--text-muted);"> Frequently used</label><div class="flex gap-8" style="flex-wrap:wrap;" id="cb-favs">${favorites.map((c) => `<button type="button" class="fav-chip" data-label="${esc(c.label)}">${esc(c.label)}</button>`).join("")}</div></div>`
    : "";
  let b =
    `` +
    `<div class="form-row"><div class="form-group"><label>Date</label><input type="date" id="cb-date" value="${today()}"></div><div class="form-group"><label>Account</label><select id="cb-method">${PAYMENT_METHOD_OPTIONS.map((m) => `<option value="${m.value}">${m.label}</option>`).join("")}</select></div></div>` +
    `<div id="cb-cash-type-group" style="${adminUnlocked ? "display:none" : "display:none"}"><div class="form-group"><label>Cash Type</label><select id="cb-cash-type"><option value="general">General Cash</option><option value="petty">Petty Cash</option></select></div></div>` +
    // Change display:none to allow account selection when logged in as admin:
    // `<div id="cb-cash-type-group"><div class="form-group"><label>Cash Type</label><select id="cb-cash-type"><option value="general">General Cash</option><option value="petty">Petty Cash</option></select></div></div>` +
    favChipsHtml +
    `<div class="form-group"><label>What was this money for? *</label><div class="ac-wrap"><input id="cb-cat" autocomplete="off" spellcheck="false" placeholder="Type to search..."><div id="cb-ac" class="ac-list" style="display:none;"></div></div><div id="cb-prev" class="text-muted" style="font-size:12px;margin-top:6px;">Start typing and pick from the list.</div></div>` +
    `<div class="form-group" id="cb-subcat-group" style="display:none;"><label>Item / Subcategory</label><select id="cb-subcat"></select></div>` +
    `<div id="cb-guest-group" style="display:none;">` +
    `<div class="form-group"><label>Guest <span class="text-muted" style="font-weight:400;">(optional — link this income to a member or non-member guest so it shows on their booking history and the dashboard)</span></label><div class="ac-wrap"><input id="cb-guest-input" autocomplete="off" spellcheck="false" placeholder="Search a guest, or leave blank..."><div id="cb-guest-list" class="ac-list" style="display:none;"></div></div><div id="cb-guest-preview" class="text-muted" style="font-size:12px;margin-top:4px;">Leave blank to just log the income without linking a guest.</div></div>` +
    `<div id="cb-nonmember-group" style="display:none;margin-bottom:12px;"><div class="form-group"><label>Guest Name *</label><input id="cb-nonmember-name" placeholder="Enter guest name..."></div></div>` +
    `</div>` +
    `<div class="form-group"><label>Amount (Rs.) *</label><input type="number" min="0" id="cb-amt" placeholder="e.g. 5000"></div>` +
    `<div class="form-group"><label>Note (optional)</label><input id="cb-desc" placeholder="e.g. Towels from Al-Karam, or June electricity bill"></div>` +
    `<div id="cb-auto-hint" class="text-muted" style="font-size:11px;margin-top:6px;padding:6px 10px;background:var(--surface-2);border-radius:var(--radius-sm);display:none;"></div>`;

  let selected = null;
  const ov = modal(
    '<ion-icon name="wallet"></ion-icon> Add Cash Book Entry',
    b,
    function (ov) {
      const amt = parseFloat(ov.querySelector("#cb-amt").value);
      if (!selected) {
        alert("Please choose a category from the list.");
        ov.querySelector("#cb-cat").focus();
        return false;
      }
      // if (!amt || amt <= 0) { alert('Please enter an amount greater than zero.'); return false;  }
      const method = ov.querySelector("#cb-method").value;
      // let cashType;
      // if (adminUnlocked) {
      //   cashType = ov.querySelector("#cb-cash-type").value;
      // } else {
      //   cashType = selected.dir === "in" ? "general" : "petty";
      // }
      let cashType;
      const cashTypeSelect = ov.querySelector("#cb-cash-type");

      // Use selected cash type dropdown value if available, otherwise default appropriately
      if (cashTypeSelect && cashTypeSelect.style.display !== "none") {
        cashType = cashTypeSelect.value;
      } else {
        cashType = selected.dir === "in" ? "general" : "petty";
      }
      const date = ov.querySelector("#cb-date").value;
      const month = getMonthFromDate(date);
      let finalDesc = ov.querySelector("#cb-desc").value.trim();
      if (subcatGroup.style.display !== "none" && subcatSel.value) {
        finalDesc = finalDesc
          ? subcatSel.value + " — " + finalDesc
          : subcatSel.value;
      }

      const linkingGuest = selected.label === "Room income" && guestLinkId;
      let nonMemberName = "";
      if (linkingGuest && guestLinkId === "nonmember") {
        nonMemberName = ov.querySelector("#cb-nonmember-name").value.trim();
        if (!nonMemberName) {
          alert(
            "Please enter the guest name for a non-member booking, or clear the guest field to skip linking.",
          );
          ov.querySelector("#cb-nonmember-name").focus();
          return false;
        }
      }

      if (!linkingGuest) {
        postCashEntry(date, selected, amt, method, cashType, finalDesc, month);
        return true;
      }

      // Linked to a member or non-member guest: post the cash entry silently, then
      // create a matching booking so it shows in guest history, Bookings, and the dashboard.
      const cbId = postCashEntry(
        date,
        selected,
        amt,
        method,
        cashType,
        finalDesc,
        month,
        true,
      );
      const isNonMember = guestLinkId === "nonmember";
      let g = null,
        pts = 0;

      if (!isNonMember) {
        g = byId(guests, parseInt(guestLinkId));
        if (g) {
          resetTierIfInactive(g);
          pts = earnPointsForBooking(1);
        }
      }

      const tx = {
        id: Date.now(),
        gId: isNonMember ? null : g ? g.id : null,
        date: date,
        type: "Room Revenue",
        amount: amt,
        desc: finalDesc || "Room income",
        pts: pts,
        nights: 1,
        nonMember: isNonMember,
        nonMemberName: nonMemberName,
        isCompany: false,
        companyId: null,
        companyName: "",
        rooms: 1,
        pricePerRoom: amt,
        subtotal: amt,
        discountPercent: 0,
        discountApplied: 0,
        paid: amt,
        balance: 0,
        cashEntryId: cbId,
      };
      txs.unshift(tx);
      if (g) {
        g.spend += amt;
        g.points += pts;
        g.nights = (g.nights || 0) + 1;
        g.stays = (g.stays || 0) + 1;
        g.lastVisit = date;
      }
      save();
      render();
      toast(
        isNonMember
          ? `Income recorded and linked to ${nonMemberName}.`
          : `Income recorded. ${pts.toLocaleString()} points awarded to ${g ? g.name : "guest"}.`,
      );
      return true;
    },
  );

  const methodSelect = ov.querySelector("#cb-method");
  const cashTypeGroup = ov.querySelector("#cb-cash-type-group");
  const autoHint = ov.querySelector("#cb-auto-hint");
  const subcatGroup = ov.querySelector("#cb-subcat-group");
  const subcatSel = ov.querySelector("#cb-subcat");
  const guestGroup = ov.querySelector("#cb-guest-group");
  const guestInput = ov.querySelector("#cb-guest-input");
  const guestList = ov.querySelector("#cb-guest-list");
  const guestPreview = ov.querySelector("#cb-guest-preview");
  const nonMemberGroup = ov.querySelector("#cb-nonmember-group");
  let guestLinkId = null; // null | 'nonmember' | <memberId>

  function updateGuestLinkUI(label) {
    if (label === "Room income") {
      guestGroup.style.display = "block";
    } else {
      guestGroup.style.display = "none";
      nonMemberGroup.style.display = "none";
      guestLinkId = null;
      guestInput.value = "";
      guestPreview.textContent =
        "Leave blank to just log the income without linking a guest.";
    }
  }

  function renderGuestLinkAC() {
    const q = guestInput.value.toLowerCase().trim();
    let matches = [];
    matches.push({
      label: '<ion-icon name="walk"></ion-icon> Non-member',
      id: "nonmember",
    });
    guests.forEach((g) => {
      if (
        g.name.toLowerCase().indexOf(q) >= 0 ||
        (g.phone && g.phone.indexOf(q) >= 0) ||
        (g.email && g.email.toLowerCase().indexOf(q) >= 0)
      ) {
        matches.push({ label: g.name + " (Member)", id: g.id });
      }
    });
    guestList.innerHTML = matches
      .map(
        (m) =>
          `<div class="ac-item" data-id="${m.id}"><span>${esc(m.label)}</span></div>`,
      )
      .join("");
    guestList.style.display = "block";
    guestList.querySelectorAll(".ac-item").forEach((el) => {
      el.addEventListener("mousedown", function (ev) {
        ev.preventDefault();
        chooseGuestLink(el.getAttribute("data-id"));
      });
    });
  }

  function chooseGuestLink(id) {
    guestLinkId = id;
    if (id === "nonmember") {
      guestInput.value = '<ion-icon name="walk"></ion-icon> Non-member';
      guestPreview.innerHTML =
        "Non-member — no points earned, but will still show as a booking.";
      nonMemberGroup.style.display = "block";
    } else {
      const g = byId(guests, parseInt(id));
      guestInput.value = g ? g.name + " (Member)" : "";
      guestPreview.innerHTML = g
        ? `Member — will earn ${earnRateLabel()} and count toward their stats.`
        : "";
      nonMemberGroup.style.display = "none";
    }
    guestList.style.display = "none";
  }

  guestInput.addEventListener("focus", renderGuestLinkAC);
  guestInput.addEventListener("input", function () {
    guestLinkId = null;
    nonMemberGroup.style.display = "none";
    renderGuestLinkAC();
  });
  guestInput.addEventListener("blur", function () {
    setTimeout(() => {
      guestList.style.display = "none";
    }, 150);
  });

  function updateSubcatUI(label) {
    const items = label && subCategories[label] ? subCategories[label] : null;
    if (items && items.length) {
      subcatSel.innerHTML =
        '<option value="">— Select item (optional) —</option>' +
        items
          .map((s) => `<option value="${esc(s)}">${esc(s)}</option>`)
          .join("");
      subcatGroup.style.display = "block";
    } else {
      subcatSel.innerHTML = "";
      subcatGroup.style.display = "none";
    }
  }

  function updateCashTypeUI() {
    const method = methodSelect.value;
    if (adminUnlocked && method === "cash") {
      cashTypeGroup.style.display = "block";
      autoHint.style.display = "none";
    } else {
      cashTypeGroup.style.display = "none";
      if (!adminUnlocked && method === "cash" && selected) {
        const hintText =
          selected.dir === "in"
            ? '<ion-icon name="bulb"></ion-icon> Income → automatically posted to General Cash (staff mode)'
            : '<ion-icon name="bulb"></ion-icon> Expense → automatically posted to Petty Cash (staff mode)';
        autoHint.textContent = hintText;
        autoHint.style.display = "block";
      } else {
        autoHint.style.display = "none";
      }
    }
  }

  methodSelect.onchange = function () {
    updateCashTypeUI();
    if (selected) choose(selected.label);
  };

  const inp = ov.querySelector("#cb-cat"),
    list = ov.querySelector("#cb-ac"),
    prev = ov.querySelector("#cb-prev");

  function renderAC() {
    const q = inp.value.toLowerCase();
    let m = cats.filter((c) => c.label.toLowerCase().indexOf(q) >= 0);
    if (!adminUnlocked) m = m.filter((c) => c.reg === true);
    if (!m.length) {
      list.innerHTML = `<div class="ac-empty">${adminUnlocked ? "No match. Try different keywords." : "No staff categories match. Unlock admin for more."}</div>`;
      list.style.display = "block";
      return;
    }
    // list.innerHTML = m.map(c =>
    //     `<div class="ac-item" data-label="${esc(c.label)}"><span>${esc(c.label)}</span><span class="ac-tag ${c.dir==='in'?'ac-in':'ac-out'}">${c.dir==='in'?'Money In':'Money Out'}</span></div>`
    // ).join('');
    list.innerHTML = m
      .map((c) => {
        let tagClass =
          c.dir === "in" ? "ac-in" : c.dir === "out" ? "ac-out" : "ac-both";
        let tagText =
          c.dir === "in"
            ? "Money In"
            : c.dir === "out"
              ? "Money Out"
              : "Money In / Out";

        return (
          `<div class="ac-item" data-label="${esc(c.label)}">` +
          `<span>${esc(c.label)}</span>` +
          `<span class="ac-tag ${tagClass}">${tagText}</span>` +
          `</div>`
        );
      })
      .join("");
    list.style.display = "block";
    list.querySelectorAll(".ac-item").forEach((el) => {
      el.addEventListener("mousedown", function (ev) {
        ev.preventDefault();
        choose(el.getAttribute("data-label"));
      });
    });
  }

  function choose(label) {
    selected = cats.find((c) => c.label === label) || null;
    inp.value = label;
    list.style.display = "none";
    updateSubcatUI(selected ? selected.label : null);
    updateGuestLinkUI(selected ? selected.label : null);
    if (selected) {
      prev.innerHTML = `<span style="color:${selected.dir === "in" ? "var(--teal)" : "var(--coral)"};font-weight:600;">${selected.dir === "in" ? "Money In" : "Money Out"}</span> → posts to ledger account: <strong>${esc(selected.account)}</strong> <span class="text-muted">(paid via ${esc(methodLabel(methodSelect.value, adminUnlocked ? (ov.querySelector("#cb-cash-type") ? ov.querySelector("#cb-cash-type").value : "general") : selected.dir === "in" ? "general" : "petty"))})</span>`;
      if (!adminUnlocked) {
        const hintText =
          selected.dir === "in"
            ? '<ion-icon name="bulb"></ion-icon> Income → automatically posted to General Cash (staff mode)'
            : '<ion-icon name="bulb"></ion-icon> Expense → automatically posted to Petty Cash (staff mode)';
        autoHint.textContent = hintText;
        autoHint.style.display = "block";
      } else {
        autoHint.style.display = "none";
      }
      updateCashTypeUI();
      if (adminUnlocked && methodSelect.value === "cash") {
        cashTypeGroup.style.display = "block";
      }
    }
  }
  inp.addEventListener("focus", renderAC);
  inp.addEventListener("input", function () {
    selected = null;
    updateSubcatUI(null);
    updateGuestLinkUI(null);
    renderAC();
  });
  inp.addEventListener("blur", function () {
    setTimeout(() => {
      list.style.display = "none";
    }, 150);
  });

  ov.querySelectorAll(".fav-chip").forEach((chip) => {
    chip.addEventListener("click", function () {
      choose(chip.getAttribute("data-label"));
    });
  });

  setTimeout(() => {
    updateCashTypeUI();
    if (adminUnlocked && methodSelect.value === "cash") {
      cashTypeGroup.style.display = "block";
    }
    if (presetCategoryLabel) {
      const match = cats.find((c) => c.label === presetCategoryLabel);
      if (match) choose(presetCategoryLabel);
    }
  }, 50);
}

function openCapitalInjection() {
  openCashEntry("Owner's Capital");
}

function openOwnerWithdrawal() {
  openCashEntry("Owner's Drawings");
}

// ─── MANAGE SUBCATEGORIES (admin) ──────────────────────
function openManageSubcategories() {
  if (!adminUnlocked) {
    alert("Admin mode required to edit subcategories.");
    return;
  }
  const cats = getCashCategories();
  const inCats = cats.filter((c) => c.dir === "in");
  const outCats = cats.filter((c) => c.dir === "out");
  let opts = "";
  if (inCats.length) {
    opts += `<optgroup label="Money In (Revenue)">`;
    inCats.forEach((c) => {
      opts += `<option value="${esc(c.label)}">${esc(c.label)}</option>`;
    });
    opts += `</optgroup>`;
  }
  if (outCats.length) {
    opts += `<optgroup label="Money Out (Expenses)">`;
    outCats.forEach((c) => {
      opts += `<option value="${esc(c.label)}">${esc(c.label)}</option>`;
    });
    opts += `</optgroup>`;
  }
  const b =
    `<div class="alert alert-info">Add or edit the item list shown when a category is chosen in the Cash Book — works for revenue categories (Room income, Restaurant income, etc.) just as well as expense categories. Put one item per line — edit a line to rename it, delete a line to remove it, or add a new line. A category with no items here simply won't show a subcategory box. Changes save when you click Save.</div>` +
    `<div class="form-group"><label>Category</label><select id="sc-cat">${opts}</select></div>` +
    `<div class="form-group"><label>Items (one per line)</label><textarea id="sc-items" rows="10" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-family:inherit;font-size:14px;resize:vertical;background:var(--surface);color:var(--text);" placeholder="e.g. Weekday booking&#10;Weekend booking&#10;Corporate rate"></textarea></div>`;
  const ov = modal(
    '<ion-icon name="pricetags"></ion-icon> Edit Subcategories',
    b,
    function (ov) {
      work[currentKey] = readLines();
      // Drop empty lists so we don't accumulate clutter for categories that were only browsed, not edited.
      Object.keys(work).forEach((k) => {
        if (!work[k] || !work[k].length) delete work[k];
      });
      subCategories = work;
      saveSubCategories();
      toast("Subcategories updated.");
      return true;
    },
    "Save",
  );
  const sel = ov.querySelector("#sc-cat");
  const ta = ov.querySelector("#sc-items");
  const work = JSON.parse(JSON.stringify(subCategories));
  let currentKey = sel.value;
  function readLines() {
    return ta.value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  function loadKey(k) {
    currentKey = k;
    ta.value = (work[k] || []).join("\n");
  }
  sel.onchange = function () {
    work[currentKey] = readLines();
    loadKey(sel.value);
  };
  loadKey(currentKey);
}

// function postCashEntry(date, cat, amt, method, cashType, desc, month, silent) {
//   cbSeq++;
//   try {
//     localStorage.setItem("hms_cbseq", JSON.stringify(cbSeq));
//   } catch (e) {}
//   const ref = "CB-" + pad3(cbSeq),
//     id = uid(),
//     note = desc || cat.label;
//   const cashAcct = methodAccountName(method, cashType);
//   cashbook.unshift({
//     id,
//     seq: cbSeq,
//     date,
//     desc,
//     catLabel: cat.label,
//     account: cat.account,
//     dir: cat.dir,
//     method,
//     amount: amt,
//     ref,
//     cashType: cashType || "general",
//     month: month,
//     archived: false,
//   });
//   if (cat.dir === "in") {
//     journal.unshift({
//       id: uid(),
//       date,
//       ref,
//       account: cashAcct,
//       desc: note,
//       dr: amt,
//       cr: 0,
//       source: "cashbook",
//       cbId: id,
//     });
//     journal.unshift({
//       id: uid(),
//       date,
//       ref,
//       account: cat.account,
//       desc: note,
//       dr: 0,
//       cr: amt,
//       source: "cashbook",
//       cbId: id,
//     });
//   } else {
//     journal.unshift({
//       id: uid(),
//       date,
//       ref,
//       account: cat.account,
//       desc: note,
//       dr: amt,
//       cr: 0,
//       source: "cashbook",
//       cbId: id,
//     });
//     journal.unshift({
//       id: uid(),
//       date,
//       ref,
//       account: cashAcct,
//       desc: note,
//       dr: 0,
//       cr: amt,
//       source: "cashbook",
//       cbId: id,
//     });
//   }
//   save();
//   render();
//   if (!silent) toast("Saved to cash book and posted to the ledger.");
//   return id;
// }

function postCashEntry(date, cat, amt, method, cashType, desc, month, silent) {
  cbSeq++;
  try {
    localStorage.setItem("hms_cbseq", JSON.stringify(cbSeq));
  } catch (e) {}
  const ref = "CB-" + pad3(cbSeq),
    id = uid(),
    note = desc || cat.label;

  const isPettyCategory = cat.label === "Petty Cash" || cat.account === "Petty Cash";

  // CASE 1: Petty Cash Top-up (General Cash -> Petty Cash)
  // Jab Account General Cash ho aur Petty Cash (Money In) select karein
  if (isPettyCategory && cat.dir === "in") {
    cashbook.unshift({
      id,
      seq: cbSeq,
      date,
      desc,
      catLabel: cat.label,
      account: "Petty Cash",
      dir: "in",
      method,
      amount: amt,
      ref,
      cashType: "general",
      month: month,
      archived: false,
    });

    // Petty Cash (Debit) +amt -> Increases Petty Cash
    journal.unshift({
      id: uid(),
      date,
      ref,
      account: "Petty Cash",
      desc: note,
      dr: amt,
      cr: 0,
      source: "cashbook",
      cbId: id,
    });

    // General Cash (Credit) -amt -> Deducts from General Cash
    journal.unshift({
      id: uid(),
      date,
      ref,
      account: "General Cash",
      desc: note,
      dr: 0,
      cr: amt,
      source: "cashbook",
      cbId: id,
    });
  } 
  // CASE 2: Petty Cash Expense (Money Out directly from Petty Cash)
  else if (isPettyCategory && cat.dir === "out") {
    cashbook.unshift({
      id,
      seq: cbSeq,
      date,
      desc,
      catLabel: cat.label,
      account: cat.account,
      dir: "out",
      method,
      amount: amt,
      ref,
      cashType: "petty",
      month: month,
      archived: false,
    });

    // Expense Account Debit
    journal.unshift({
      id: uid(),
      date,
      ref,
      account: cat.account,
      desc: note,
      dr: amt,
      cr: 0,
      source: "cashbook",
      cbId: id,
    });

    // Petty Cash Credit -> Deducts from Petty Cash (General Cash safe rehta hai)
    journal.unshift({
      id: uid(),
      date,
      ref,
      account: "Petty Cash",
      desc: note,
      dr: 0,
      cr: amt,
      source: "cashbook",
      cbId: id,
    });
  } 
  // CASE 3: Standard Income/Expense (Baaqi tamam normal categories)
  else {
    const cashAcct = methodAccountName(method, cashType || "general");

    cashbook.unshift({
      id,
      seq: cbSeq,
      date,
      desc,
      catLabel: cat.label,
      account: cat.account,
      dir: cat.dir,
      method,
      amount: amt,
      ref,
      cashType: cashType || "general",
      month: month,
      archived: false,
    });

    if (cat.dir === "in") {
      journal.unshift({
        id: uid(),
        date,
        ref,
        account: cashAcct,
        desc: note,
        dr: amt,
        cr: 0,
        source: "cashbook",
        cbId: id,
      });
      journal.unshift({
        id: uid(),
        date,
        ref,
        account: cat.account,
        desc: note,
        dr: 0,
        cr: amt,
        source: "cashbook",
        cbId: id,
      });
    } else {
      journal.unshift({
        id: uid(),
        date,
        ref,
        account: cat.account,
        desc: note,
        dr: amt,
        cr: 0,
        source: "cashbook",
        cbId: id,
      });
      journal.unshift({
        id: uid(),
        date,
        ref,
        account: cashAcct,
        desc: note,
        dr: 0,
        cr: amt,
        source: "cashbook",
        cbId: id,
      });
    }
  }

  save();
  render();
  if (!silent) toast("Saved to cash book and posted to the ledger.");
  return id;
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
