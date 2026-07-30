# System Wiring Reference — Anjaneya Nagar Living Room
### Combined 2-Channel Stereo + 9.1.6 Home Theater (Shared Sopra Fronts)

> **Drawing:** [`wiring-diagram.svg`](./wiring-diagram.svg) — full signal-flow schematic of everything below.

---

## Design principle

The stereo chain (Linn / Ayon → Michi P5 → Michi M5 → Sopra No3) stays **completely untouched**. The home theater borrows the Sopras through the P5's theater-bypass input. No speaker cable is ever moved; switching between music and movies is one input change on the P5.

---

## 1. Source connections

| Source | Connection | Destination |
|---|---|---|
| Linn Selekt DSM Organic | Balanced XLR (preferred) or RCA | Michi P5 — Input 1 |
| Ayon CD-10 II T | Balanced XLR (preferred) or RCA | Michi P5 — Input 2 |
| 4K UHD disc player (UB9000 / Magnetar — pending) | HDMI | MP-60 — HDMI In 1 |
| Streaming device / set-top | HDMI | MP-60 — HDMI In 2 |
| MP-60 HDMI Out (eARC-capable main out) | HDMI | SIM2 Crystal 4 SH |

> The Ayon's analog output should go **only** to the P5. If you ever want CDs through the theater system, use the MP-60's digital input from the Ayon's digital out instead — keep the tube analog stage exclusive to the stereo path.

---

## 2. The bridge: MP-60 → Michi P5 (theater bypass)

| From | Cable | To | Setting |
|---|---|---|---|
| MP-60 pre-out: **Front L + Front R** (XLR) | 1 × XLR pair | Michi P5 — spare balanced input (e.g. Input 3) | Set this P5 input to **Fixed Gain / Bypass / Pass-through** in the P5 menu |

**How it behaves:**
- Stereo listening: select Input 1 or 2 on the P5. MP-60 and MXAs can stay off.
- Movie night: select the bypass input on the P5, power the M5. The MP-60 now controls volume for all 16 channels including the Sopras.
- **Critical:** the bypass input must be unity/fixed gain. If the P5 volume knob still works on that input, it is NOT in bypass — recheck the menu. A variable-gain loop here risks full-scale output into the Sopras.

---

## 3. Amplifier and speaker map (16 channels)

### Michi M5 (2 ch) — front L/R
| Channel | Speaker | Cable |
|---|---|---|
| Front L / Front R | Focal Sopra No3 pair | Van den Hul 3T The Air (2-2), existing — do not modify |

### MXA-8400 #1 (8 ch) — bed layer
| MXA ch | MP-60 output | Speaker |
|---|---|---|
| 1 | Center | Focal Electra center |
| 2 | Wide L | Focal Sib |
| 3 | Wide R | Focal Sib |
| 4 | Surround L | Focal Sib |
| 5 | Surround R | Focal Sib |
| 6 | Rear L | Focal Sib |
| 7 | Rear R | Focal Sib |
| 8 | — spare — | (future: second center woofer / IWA baffle wall) |

### MXA-8400 #2 (8 ch) — height layer
| MXA ch | MP-60 output | Speaker |
|---|---|---|
| 1 | Top Front L | Monitor Audio in-ceiling |
| 2 | Top Front R | Monitor Audio in-ceiling |
| 3 | Top Middle L | Monitor Audio in-ceiling |
| 4 | Top Middle R | Monitor Audio in-ceiling |
| 5 | Top Rear L | Monitor Audio in-ceiling |
| 6 | Top Rear R | Monitor Audio in-ceiling |
| 7 | — spare — | |
| 8 | — spare — | |

**Cabling for both MXAs:**
- MP-60 → MXA: balanced XLR, one per channel (13 total used)
- MXA → speakers: speaker cable terminated in the supplied Neutrik speakON connectors at the amp end (bare wire 1.5–4 mm² per clamp), bare wire/banana/spade at the speaker end
- Keep XLR runs and speaker runs separated where they cross; cross at 90° if unavoidable

### Subwoofers
| From | Cable | To |
|---|---|---|
| MP-60 Sub Out 1 | Low-level (XLR→RCA if needed) | REL HT/1508 #1 — LFE input |
| MP-60 Sub Out 2 | Low-level (XLR→RCA if needed) | REL HT/1508 #2 — LFE input |

> Use the **.1/LFE low-level input** on the HT-series RELs for theater duty, with each REL's own crossover bypassed/maxed — the MP-60 handles all bass management. Use two separate sub outputs (not a daisy chain) so RoomPerfect can measure and delay each sub independently.

---

## 4. Amp settings

| Device | Setting | Value |
|---|---|---|
| MXA-8400 (both) | Input sensitivity switch | Match to MP-60 output level — start at **low (6V)** setting; raise only if you can't reach reference level |
| MXA-8400 (both) | Bridging | **OFF** — no channel is bridged |
| MXA-8400 (both) | Trigger | MP-60 trigger out → MXA #1 trigger in → daisy-chain trigger to MXA #2 |
| Michi M5 | Trigger | Optional: P5 trigger out → M5, so the M5 wakes for both stereo and bypass use |

---

## 5. Calibration checklist (after wiring)

1. Set P5 to the bypass input and leave it there for the whole calibration.
2. Power the M5 and both MXAs.
3. Run **RoomPerfect** on the MP-60 with the full 9.1.6 + dual-sub layout active.
4. Verify channel identity with the MP-60 test tones — speakON miswires are silent failures until you check.
5. Set speaker distances/levels; confirm both RELs are individually detected.
6. Create a second MP-60 preset: **"Mono/Classic"** — center-channel-only routing, no upmixing, for the Kurosawa library.
7. Store a third preset if desired: **"Music Multichannel"** for SACD/Atmos music with lighter sub weight.

---

## 6. Signal-flow summary

```
STEREO PATH (untouched)
Linn Selekt ─┐
             ├─ XLR ─→ Michi P5 ─ XLR ─→ Michi M5 ─ VDH 3T ─→ Sopra No3 L/R
Ayon CD-10 ──┘

THEATER PATH
Disc player ─ HDMI ─→ MP-60 ─ HDMI ─→ SIM2 Crystal 4 SH
                        │
                        ├─ XLR pre-out FL/FR ─→ P5 (bypass) ─→ M5 ─→ Sopra L/R
                        ├─ XLR ×7 ─→ MXA-8400 #1 ─→ Center + 6× Sib
                        ├─ XLR ×6 ─→ MXA-8400 #2 ─→ 6× ceiling heights
                        └─ Sub out ×2 ─→ REL HT/1508 ×2 (LFE input)
```

---

## Open items

- [ ] Confirm which Michi P5 input supports fixed-gain/bypass mode (check owner's manual "Fixed Volume" setting)
- [ ] Confirm MP-60 sub outputs: XLR or RCA — order XLR→RCA adapters if the RELs need RCA
- [ ] Finalize disc player (Panasonic UB9000 vs Magnetar UDP800)
- [ ] Confirm Monitor Audio in-ceiling model for RoomPerfect speaker profiles
