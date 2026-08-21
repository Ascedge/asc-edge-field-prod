IGNORE ALL PREVIOUS IMPLEMENTATION INSTRUCTIONS. THIS DOCUMENT IS THE SINGLE SOURCE OF TRUTH FOR THE 14307 RIPPLING CREEK FLAGSHIP DEMO.

## 1. Repository and safety rules

Repository: `Ascedge/asc-edge-field-prod`  
Production branch: `main`  
Verified production commit: `d8cb91a02240471fbe51dd2d314b76792849cc40`  
Vercel production domain: `asc-edge-field-prod.vercel.app`

Create a feature branch named:

`demo/14307-rippling-creek`

Do not:

- Modify or commit directly to `main`
- Deploy or merge to production
- Change Supabase or Vercel settings
- Display, copy, or reproduce credentials
- Alter or delete production database records
- Rewrite Git history
- Touch similarly named repositories

First create `docs/FLAGSHIP_14307_IMPLEMENTATION_SCOPE.md` containing this specification. Then provide a consolidated implementation plan and affected-file list. Stop for approval before implementing application changes.

## 2. Product objective

Build a polished flagship Roof Passport demonstration for:

**14307 Rippling Creek**

The experience must show how ASC Edge moves a homeowner from a brief preliminary property interaction into a long-term, red-carpet roofing relationship where the roof is:

- Identified
- Photographed
- Authorized
- Documented
- Timelined
- Monitored
- Maintained
- Updated policy year after policy year

The Passport is not merely an inspection report. It is the continuing record of an important home asset and the relationship responsible for helping maintain it.

## 3. Required homeowner journey

### Stage 1 — Preliminary property record

The representative resolves the exact property address and creates or opens the correct property record.

Before requesting full access, the representative may capture a limited preliminary set of ground-level exterior photographs. The recommended set is:

1. Front elevation
2. Left-side or front-left roof overview
3. Right-side or front-right roof overview
4. One visible condition or maintenance concern, when applicable

The application must clearly label these as:

**Preliminary Exterior Documentation**

These photographs are not a complete inspection and must not be represented as one.

Each preliminary image must be associated with:

- Property
- Representative/user
- Server receipt timestamp
- Capture phase
- Original filename
- File hash
- Upload event
- Inspection/report version

Do not fabricate original camera timestamps when metadata is unavailable.

### Stage 2 — Homeowner QR handoff

After the preliminary photographs are uploaded, generate a property-specific QR code.

The homeowner scans the QR code and sees:

- Their address
- The preliminary exterior photographs
- A concise explanation of the Roof Passport
- What additional documentation is being requested
- Why a chronological property record benefits them
- The inspection and photography authorization
- A clear approve/decline choice

The QR must use a secure opaque share token or another approved access mechanism—not a guessable raw property UUID.

### Stage 3 — Permission for full documentation

Full property photography must remain locked until the homeowner gives documented permission.

Store:

- Authorization version
- Homeowner name
- Property
- Approval or decline
- Date and server timestamp
- IP/user-agent evidence where legally appropriate
- Representative
- Scope of permission
- Signature or affirmative consent evidence
- Revocation/status history

Keep these permissions separate:

1. Property inspection and documentation authorization
2. Optional marketing/media release
3. Optional contractor/policy-vault authorization

A homeowner must not be required to approve marketing use merely to receive the Passport.

If permission is declined, preserve the preliminary record and end the workflow respectfully. Do not unlock full photography.

### Stage 4 — Full photographic documentation

After approval, unlock the full documentation workflow.

Support 20 or more ground-level images organized by categories such as:

- Front elevation
- Rear elevation
- Left elevation
- Right elevation
- Roof planes
- Ridges and hips
- Valleys
- Flashing
- Chimneys
- Vents and penetrations
- Gutters and drainage
- Trees and environmental exposure
- Visible maintenance items
- Areas requiring closer inspection
- Supporting property conditions

Every image must be appended to the property timeline. Ordinary users must not be able to delete or silently overwrite evidence. Corrections should supersede prior records while preserving the original and the audit trail.

### Stage 5 — Live homeowner experience

While the representative continues taking photographs, the homeowner’s Passport must update so the homeowner can watch the documentation arrive.

Use Supabase Realtime where appropriate, with a controlled polling fallback if necessary.

The homeowner should see:

- Upload progress
- Newly added images
- Image categories and captions
- Documentation status
- Current stage of the inspection
- The growing property timeline

Required report states:

- Preliminary
- Awaiting homeowner authorization
- Authorized
- Documentation in progress
- Documentation complete
- Published
- Annual update due

This live progression is one of the primary flagship demonstration moments.

## 4. Flagship Passport report

Replace the stale report with a navigable, property-specific Passport containing:

1. Executive property summary
2. Property identity and verified address
3. Inspection date, report version and responsible user
4. Preliminary-to-complete status timeline
5. Ordered photographic record
6. Property and roof characteristics
7. Quick roof square-count estimate, clearly labeled as an estimate
8. Texas Windstorm/TWIA certificate lookup and stored certificate
9. Applicable building-code update protocol
10. Weather and storm history
11. Property-relevant hail and wind evidence
12. University or institutional hail imagery when genuinely available and properly licensed
13. Findings and normal maintenance items
14. Picture-to-Price maintenance quote workflow
15. Insurance policy storage vault
16. AI policy reader for year-over-year changes and discrepancies
17. Direction to the appropriate licensed professional when interpretation is required
18. Annual maintenance plan
19. Long-term property timeline
20. Documents, authorizations and certificates
21. Source and citation registry
22. Clear next actions

Navigation must allow the homeowner to move easily between:

- Overview
- Timeline
- Photos
- Storm history
- Maintenance
- Documents
- Policy vault
- Certificates
- Sources
- Next actions

## 5. Long-term relationship narrative

The report must logically lead the homeowner across the “epiphany bridge”:

A roof should not disappear from attention until the next storm, leak or door-knocking contractor arrives.

A replacement is a transaction. A Roof Passport creates a continuing relationship and a documented history.

The Passport should explain that:

- The roof is a major component of the home.
- Conditions and maintenance can change from year to year.
- A chronological record is more useful than disconnected inspections.
- Routine documentation can make changes easier to recognize.
- Normal maintenance may help address manageable conditions before they become larger problems.
- Insurance policies and property documentation should be reviewed over time by the appropriate qualified or licensed professionals.
- The homeowner receives a red-carpet experience resembling a personal home office for the roof and related documents.
- The goal is to replace “We have always done it this way” with an easier, better-documented and more intelligent process.

Use the working relationship title:

**Roofing Asset Manager**

Treat the final terminology as subject to brand and legal review.

## 6. Window sticker and established relationship

Include the Passport window-sticker concept.

The sticker communicates that:

- The property already has an established roofing relationship.
- The roof has a continuing documented record.
- Unsolicited contractors can verify that the homeowner is already represented or serviced.
- The homeowner can open the Passport through a secure QR experience.

Do not expose private property documents through the sticker’s public QR code.

## 7. Maintenance economics

Include an educational comparison between:

- Planned annual inspection and normal maintenance
- Repeated reactive inspections
- Deductible exposure
- Premature or unnecessary replacement cycles

Any calculator must use homeowner-entered or clearly disclosed assumptions.

Do not:

- Promise premium reductions
- Guarantee that maintenance prevents claims
- Determine insurance coverage
- Give legal, public-adjusting or insurance-agent advice
- Present generalized replacement or deductible costs as verified facts

The intended message is that an ongoing maintenance and documentation relationship can be more rational than ignoring the roof until another replacement conversation begins.

## 8. Citations and institutional evidence

Create a structured citation registry containing:

- Claim supported
- Publisher
- Document/page title
- URL
- Publication or revision date
- Access date
- Applicable report section

Prioritize authoritative sources such as:

- Texas Department of Insurance
- TWIA
- NOAA
- National Weather Service
- FEMA
- IBHS
- Recognized roofing-industry technical institutions
- Manufacturer maintenance documentation where appropriate
- Verified university weather or hail resources

Verify the precise institution behind any university hail source before naming it. Do not confuse the University of Iowa with Iowa State University or the Iowa Environmental Mesonet.

Do not invent citations or use a citation for a claim it does not support.

Clearly distinguish:

- Verified fact
- Third-party data
- Estimate
- Representative observation
- Homeowner-provided information
- Educational explanation

## 9. Insurance policy vault and authorization

Provide secure policy-document storage with year-over-year versions.

The AI reader may:

- Extract structured policy facts
- Compare policy years
- Identify changed language, limits or endorsements
- Flag items for professional review
- Produce a neutral discrepancy summary

It must not:

- Determine coverage
- Interpret legal rights
- Negotiate a claim
- Act as an insurance agent, attorney or public adjuster

When professional interpretation is required, direct the homeowner to the appropriate licensed insurance agent, public adjuster or attorney.

Include a separately approved contractor authorization workflow allowing the homeowner to request that future policy copies or related documents be forwarded to the vault. Final authorization language remains subject to legal review.

## 10. Technical hardening

Implement individual Supabase Auth accounts. Shared logins are prohibited.

Required roles include:

- Platform administrator
- Licensee owner
- Manager
- Office user
- Inspector/representative
- Homeowner
- Limited licensed-professional reviewer

Implement organization membership and tenant isolation through Row Level Security. Do not rely only on hidden interface controls.

Anonymous users must not be able to:

- Create arbitrary properties
- Modify observations
- Upload photographs
- Submit visits
- Enumerate private reports
- Access policy documents
- Trigger privileged webhooks

Reserve the Supabase service role for narrowly scoped server operations.

Treat the committed service-role credential as exposed. Remove all hardcoded credential fallbacks, but do not display or rotate production credentials from this task. Provide a separate coordinated rotation checklist for Supabase and Vercel.

Add:

- Environment-variable contract
- `.env.example` containing names only
- Server-side environment validation
- Request validation
- Upload size limits
- Image MIME/type verification
- Property and tenant authorization
- Rate limiting for public endpoints
- Idempotency for webhook events
- Structured error handling
- Audit logging

Capture the authoritative live Supabase schema, constraints, indexes, RLS policies and Storage configuration before proposing destructive migrations.

## 11. Required defect repairs

Repair:

- Missing property-read endpoint used by the presentation carousel
- Visit endpoint/schema mismatch
- Invalid placeholder representative ID
- Dropped disposition and lock fields
- Hardcoded photo count
- GoHighLevel trigger mismatch
- Missing webhook context and idempotency
- Storm-history casing mismatch
- Hardcoded canonical application URL
- Report-open event semantics
- Incomplete navigation
- Contradictory condition-score direction

A higher score must not simultaneously mean “better condition” while damage selections increase the score.

## 12. FLIR replacement

Remove the FLIR/thermal drone report from the standard report and product options.

Do not implement thermal reporting as part of this scope.

Replace it with two clearly labeled future capabilities:

- **Autonomous Drone Flight Reports — Coming Soon**
- **AI Glasses Inspection Reports — Coming Soon**

These must not be represented as currently available.

## 13. Existing photographs

Use the supplied 14307 Rippling Creek photographs as the flagship property’s demonstration dataset.

Do not imply that stripped metadata proves an original capture time or GPS location.

Classify and order the photographs by property view, roof plane, feature and visible maintenance concern. Captions must distinguish visual observation from definitive diagnosis.

## 14. Delivery sequence

### Checkpoint 1 — Plan only

Provide:

- Proposed architecture
- Data-model changes
- Authorization state machine
- Route changes
- RLS strategy
- Storage strategy
- Realtime strategy
- Affected-file list
- Migration plan
- Security-key rotation checklist
- Test plan
- Vercel preview plan

Do not implement application changes until Checkpoint 1 is approved.

### Checkpoint 2 — Safe foundation

Implement on the feature branch:

- Secret removal from source
- Environment contract
- Missing route repair
- Validation
- FLIR removal/replacement
- URL configuration
- Storm casing repair
- Upload restrictions

Run lint, type checking and production build. Show the complete diff and results.

### Checkpoint 3 — Authentication and authorization

Implement accounts, roles, RLS, protected routes, secure homeowner share tokens and Storage controls.

Provide tenant-isolation test evidence.

### Checkpoint 4 — Flagship workflow

Implement:

- Preliminary photography
- QR handoff
- Homeowner authorization
- Full documentation unlock
- Live image arrival
- Report status progression
- Immutable timeline behavior

### Checkpoint 5 — Updated Passport

Implement the complete report, navigation, citations, maintenance narrative, policy vault surfaces and long-term relationship story.

### Checkpoint 6 — Preview deployment

Create a Vercel preview deployment from the feature branch.

Do not merge to `main` or promote to production without explicit approval.

## 15. Definition of done

The flagship is complete only when:

- 14307 Rippling Creek resolves deterministically.
- Preliminary images can be captured before authorization.
- The homeowner can scan the QR code and view the preliminary record.
- Full documentation remains locked until permission is recorded.
- The homeowner can watch authorized photographs arrive.
- At least 20 categorized images can be chronologically preserved.
- The Passport clearly progresses from preliminary to complete.
- Every material factual claim has an appropriate citation or classification.
- FLIR is absent as a standard feature.
- Drone-flight and AI-glasses reports are labeled Coming Soon.
- Individual accounts and tenant isolation are enforced.
- The complete journey works without console, API or database errors.
- A safe Vercel preview exists.
- Production remains unchanged until explicit approval.