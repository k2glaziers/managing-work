---
name: master
description: Master router for all installed skills. Use this FIRST whenever a request is broad, vague, spans more than one area of the business, or does not obviously name a single skill — for example "sort out my week", "help me with this customer", "get the business ready for month end", "what should I do about X", or any time the user says "master", "use the right skill", or "which skill should I use". It picks the best skill (or ordered chain of skills) for the job, runs them, and combines the results into one answer. Do not use it when the user has typed a specific skill name or the request plainly belongs to exactly one skill.
---

# Master

Work out what the user actually needs, choose the skill or skills that do it best, run them, and hand back one joined-up result. The user should never need to know skill names.

## Why this exists

There are well over a hundred skills installed. A short or loosely worded request often matches several of them, or none by keyword, and the wrong pick wastes the user's time. This skill adds one deliberate routing step so that the choice is reasoned rather than a keyword accident.

## How to route

1. **Restate the job in one line.** What outcome does the user want, for whom, and by when? If the request has several parts ("chase the invoices and tell me how cash looks"), split it into separate jobs.

2. **Read the live skill list.** The list of available skills in the session is the authority; the map below is only a starting point and may be out of date. Prefer a skill whose description matches the outcome, not just the words used.

3. **Pick using these tie-breakers, in order:**
   - **Company-specific beats generic.** Skills prefixed `k2` or `brand-k2` carry this business's own standards and voice. When one covers the job, use it in place of, or after, the generic equivalent (for example, write with a marketing skill, then check against `brand-k2`).
   - **Narrow beats broad.** `small-business:invoice-chase` beats `small-business:smb-router` for chasing an invoice.
   - **Fit the size of the business.** For day-to-day running of the company, prefer `small-business:*` over the enterprise-flavoured `finance:*`, `sales:*` or `operations:*` skills, unless the user asks for the heavier treatment.
   - **File type decides the last step.** If the result must be a Word, Excel, PowerPoint or PDF file, finish with `docx`, `xlsx`, `pptx` or `pdf`.

4. **Decide: one skill, a chain, or none.**
   - One skill: invoke it and get out of the way.
   - Chain: order the skills so each feeds the next (gather, then analyse, then produce). Keep it to three or fewer; longer chains usually mean the job should be split and confirmed with the user.
   - None: if no skill genuinely fits, do the work directly. Forcing a poor match is worse than using no skill.

5. **Say what you chose in one short line, then do it.** For example: "Using invoice-chase, then cash-flow-snapshot." Do not ask permission to route; the user asked for the outcome. Ask a question only when two readings of the request would lead to materially different work, or when a step would send, pay, post or delete something.

6. **Combine.** When more than one skill ran, give a single answer organised around the user's goal, not a section per skill. Lead with what they need to know or decide.

## Routing map

A guide to families of skills. Check the live list for exact names and newer additions.

| The user wants... | Look at |
|---|---|
| Anything in the company's own voice, standards, app QA or competitor complaints | `brand-k2`, `k2-engineering-standard`, `k2eng`, `k2-app-qa`, `k2-competitor-complaints` |
| A start-of-day or start-of-week picture | `morning`, `small-business:monday-brief`, `small-business:business-pulse`, `sales:daily-briefing` |
| Money in: invoices, cash, month end, tax | `small-business:invoice-chase`, `cash-flow-snapshot`, `close-month`, `month-end-prep`, `tax-prep` |
| Money out: bills, payroll | `small-business:pay-the-bills`, `ap-processor`, `payroll-prep`, `plan-payroll` |
| New customers and leads | `small-business:lead-finder`, `lead-triage`, `speed-to-lead`, `outreach-composer`, `grow-pipeline`, `reactivate` |
| Quotes, proposals, contracts | `small-business:proposal-builder`, `contract-review`, `grant-rfp-writer` |
| Marketing, social, ads, SEO, reviews | `small-business:marketing-monday`, `social-content-engine`, `ad-manager`, `seo-ai-visibility`, `review-reputation`, `canva-creator`; `marketing:*` for bigger campaigns |
| Hiring | `small-business:job-post-builder`, `hiring-screener` |
| Stock and suppliers | `small-business:inventory-planner`, `restock`, `operations:vendor-review` |
| Inbox, tasks, memory | `small-business:inbox-manager`, `productivity:task-management`, `productivity:memory-management` |
| Writing down how something is done | `operations:process-doc`, `operations:runbook`, `engineering:documentation` |
| Risks, compliance, changes | `operations:risk-assessment`, `compliance-tracking`, `change-request` |
| Numbers, charts, dashboards | `data:analyze`, `data:build-dashboard`, `dataviz`, `xlsx` |
| Software: design, review, debug, test, ship | `engineering:*`, `code-review`, `security-review` |
| Product decisions and specs | `product-management:*` |
| Screens, UX wording, accessibility | `design:*` |
| A finished document or deck | `docx`, `pptx`, `pdf`, `xlsx`, `canvas-design` |
| Deep background research | `deep-research` |
| Making or improving a skill | `skill-creator` |

## Examples

**Request:** "Get me ready for Monday."
**Route:** `small-business:monday-brief` alone. One skill covers it.

**Request:** "Write a post about our new bifold doors and make sure it sounds like us."
**Route:** `small-business:social-content-engine`, then check against `brand-k2`. Company-specific skill gets the final say on voice.

**Request:** "Who owes us money and are we okay for payroll on Friday?"
**Route:** `small-business:invoice-chase`, then `small-business:cash-flow-snapshot`, with `plan-payroll` only if the snapshot shows a shortfall. Answer in one piece: yes or no on payroll first, then who to chase.

**Request:** "What's the capital of Portugal?"
**Route:** none. Just answer.

## Keeping the map current

When a skill is added, renamed or removed, update the table above. If you notice during routing that the map and the live list disagree, follow the live list and tell the user the map needs a refresh.
