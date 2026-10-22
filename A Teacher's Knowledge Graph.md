# Concepts First, Curricula Second: A Teacher's Knowledge Graph

## Abstract

Teachers usually organise their knowledge around curricula: a folder per programme, a unit per term, a lesson per week. When a school changes programmes, or a teacher works with several at once (a national standard, Cambridge, AP, an internal K-12 framework), the same idea gets rewritten in each one, and the copies slowly drift apart. This article proposes turning that structure around. The stable unit of a teacher's knowledge is the **concept**: a single teachable idea, written once, linked to its prerequisites, and carrying its own evidence of mastery. A **curriculum** is then a *view* over that graph. It selects concepts, puts them in order, and maps them to the codes of one external standard. With this structure a single personal knowledge base can serve, check coverage against, and help design several curricula. The approach comes from the author's own practice as an ICT teacher. It is compared with Marble's recently released open skill taxonomy, which applies the same idea at the scale of an open dataset. The article closes with a research agenda and the limitations of the approach.

## 1. The problem: curriculum-first knowledge

Take a concept like *Algorithm*. In one school year an ICT teacher may meet it in:

- a primary syllabus (Grade 3: "follow and create simple sequences of instructions"),
- a lower-secondary programme (decomposition, flowcharts, selection and iteration),
- Cambridge IGCSE / AS (pseudocode, trace tables, standard algorithms),
- AP Computer Science Principles (algorithms and programming, efficiency),
- an internal school framework that borrows from all of the above.

If the teacher organises notes curriculum-first, *Algorithm* exists five times. Each copy holds part of the explanation, a few examples, and a different set of exercises. When a better example turns up, it goes into one copy only. When the school adopts a new programme, the teacher starts a sixth copy. The teacher's real expertise, meaning how the idea works, what students must know first, which misconceptions come up, and what mastery looks like, does not belong to any one curriculum. Yet it ends up scattered across all of them.

Curricula change on political and institutional timescales: new standards, new exam boards, new school owners. Concepts change much more slowly. *Binary representation* or *abstraction* means the same thing whichever document requires it. A knowledge base should be built around the part that stays stable.

## 2. The inversion: concepts as nodes, curricula as views

The proposal rests on three claims.

1. **A concept is curriculum-neutral.** A concept note explains one idea well enough to teach it. It does not say which grade it belongs to or which exam board requires it.
2. **Concepts form a graph, not a list.** Concepts depend on one another (*Binary search* needs *Array* and *Algorithm*), so the knowledge base records those dependencies explicitly.
3. **A curriculum is a projection.** A programme of study is a subset of concept nodes, an ordering over them (by age band, term or unit), and an alignment table that maps nodes to the external standard's codes.

Under this model, *complying with* a curriculum and *designing* one are the same operation: choosing and ordering a path through a graph that already exists. Moving to a new programme means writing a new alignment table, not rewriting the teaching material.

## 3. Related work: Marble's open skill taxonomy

A recent open dataset makes the same move at scale. Marble's *os-taxonomy* [1, 2] models elementary learning as a directed acyclic graph. Its first release contains 1,590 "micro-topics" across eight subjects, joined by 3,221 prerequisite edges. The project describes itself as "a graph, not a list." Its design choices map closely onto the model proposed here:

| os-taxonomy | Teacher knowledge graph (this article) |
| --- | --- |
| *Micro-topic*: "a single teachable idea" with a description, a type (conceptual, procedural, representational, language, meta), an age range, and mastery evidence | *Concept note*: one idea per note, with mastery evidence in frontmatter |
| *Prerequisite edge* tagged `hard` or `soft`, with a one-line reason | Typed wikilinks / frontmatter `requires:` with a reason |
| `standards` array of `curriculum:code` keys (UK National Curriculum, Common Core, NGSS, ACARA, IB PYP…) | `standards:` field mapping a concept to Cambridge, AP CSP, national or school codes |
| Coverage reports per curriculum (fully / partly / not covered) | Generated coverage pages per programme |
| Plain UTF-8 JSON, versioned, openly licensed (ODbL / CC BY-SA) | Plain Markdown, versioned in git, published selectively |

Marble's alignment is many-to-many. One topic carries several standard codes, and one standard can be met by several topics. This is the property that lets a single graph serve many curricula. Marble's work also shows the costs. The project says it has partial coverage (for example, some Australian Mathematics standards are only "partly covered" or missing). It also states that "a curriculum citation is evidence of alignment rather than an evaluated teaching intervention" [2].

The two efforts differ in direction and scope. Marble's dataset is built **top-down**: distilled from published standards, aimed at product builders, and limited to primary school. A teacher's graph grows **bottom-up**: from lessons actually taught, misconceptions actually seen, and examples that actually worked, mostly in secondary ICT. The two can work together. A personal graph could reuse open taxonomy IDs as a shared vocabulary, and teachers' practice-grounded notes are the kind of evidence an open taxonomy lacks.

## 4. The model in practice

### 4.1 Layers

The knowledge base is organised in four layers. Each layer is a folder of plain Markdown files.

1. **Concepts** (`Concepts/`): atomic, curriculum-neutral notes such as *Algorithm*, *Abstraction*, *Binary search* or *Boolean algebra*. This is the source of truth.
2. **Resources** (`Algorithms/`, `Hardware/`, `Protocols/`, `Vizualisations/`, `Games/`…): worked examples, demos, visualisations and activities. Each one links to the concepts it illustrates.
3. **Lessons** (`Lessons/Grade N/`): concrete teaching episodes. A lesson does not re-explain a concept. It links to it, sets a goal for a particular age group, and records what happened.
4. **Programmes** (`Programs/`): one note per curriculum (Cambridge ICT, AP CSP, K-12 Computing, Engineering Design K1–8…). It holds the curriculum's own structure and its alignment to concepts.

Links only point downward. Programmes reference lessons and concepts, and lessons reference concepts. Concepts never reference a programme. This keeps the core reusable.

### 4.2 A concept note

```yaml
---
garden: true
type: conceptual            # conceptual | procedural | representational | language | meta
ages: [9, 16]
requires:
  - concept: "[[Sequence]]"
    strength: hard
    reason: "An algorithm is an ordered sequence of steps"
  - concept: "[[Boolean data]]"
    strength: soft
    reason: "Selection uses Boolean conditions"
evidence:
  - Describe an everyday process as an ordered list of unambiguous steps
  - Identify sequence, selection and iteration in a given algorithm
standards:
  - cambridge-igcse-cs:7.1
  - ap-csp:AAP-2
  - school-k12:G6.ALG.1
---
```

The body of the note holds the explanation, its history (al-Khwārizmī), the building blocks, examples, and known misconceptions. None of it depends on a particular curriculum.

### 4.3 Operations the graph makes possible

- **Compliance and coverage.** For each programme, list its codes and the concepts aligned to each. Codes with no concept show the gaps. Codes with concepts but no lesson show where material exists but has not been taught. This is the same "fully / partly / missing" report that Marble publishes per curriculum, applied here to one teacher's practice.
- **Curriculum design.** Select a target set of concepts, pull in their prerequisites, and sort the result in prerequisite order. The output is a defensible draft sequence, which the teacher then adjusts for time, age and context.
- **Spiral planning across grades.** Because *Algorithm* is one node, Grade 3 and Grade 10 lessons both link to it. The concept page then shows, through backlinks, how the idea grows across the school.
- **Programme migration.** When the school adds or replaces an exam board, the work is a new `standards:` mapping and a coverage review. Explanations, examples and activities stay where they are.
- **Cross-curricular links.** Engineering Design, Mathematics and ICT can share nodes (*Abstraction*, *algebraic thinking*, *Computational thinking*), so links between subjects become explicit edges instead of a vague intention.

## 5. Infrastructure principles

The specific tools matter less than the properties they provide. The current implementation uses Obsidian for writing and an Eleventy site for publishing, but either can be replaced as long as these properties hold:

- **Open, plain formats.** Markdown with YAML frontmatter can be read by people, by scripts, and by AI agents. The graph is in the files, not in a proprietary database.
- **Full control.** Open-source tooling at every step, from editing to building and hosting, so that no vendor can lock in the teacher's material or lose it.
- **Reliable versioning.** Every change to a concept or an alignment is recorded. Git is one option. What matters is that the history of the knowledge base can be audited.
- **Repeatability.** The setup should work on any major consumer OS, and a colleague should be able to reproduce it.
- **Machine-readability for AI.** Structured frontmatter (`requires`, `evidence`, `standards`) lets AI agents help draft alignments, check coverage, or suggest prerequisite edges, while the teacher stays the editor.

## 6. Publishing as a digital garden

Making part of the graph public turns a private knowledge base into a node in a professional learning network [3–5]. Only notes marked `garden: true` are published. Wikilinks become hyperlinks, backlinks are generated, and the site is searchable. The public site is a by-product of the concept-first structure, not its purpose. Because concepts are curriculum-neutral, a published concept page is useful to teachers on *any* programme, which is rarely true of a published unit plan.

## 7. Research agenda

The approach has not yet been evaluated. A mixed-methods pilot could address the following questions:

1. Does a concept-first structure reduce duplicated preparation for teachers who work with several curricula at once?
2. How accurate and useful are teacher-generated coverage reports compared with institutional curriculum mapping?
3. Does making prerequisites explicit change how teachers sequence lessons or diagnose student difficulties?
4. Can practice-grounded teacher graphs be aligned with open taxonomies such as os-taxonomy, and what does each side gain?
5. What barriers (time, technical confidence, institutional formats) prevent teachers from adopting the approach?

Possible data sources: pre- and post-intervention surveys, graph metrics (number of concepts, edges and aligned standards over time), planning-time logs, and semi-structured interviews.

## 8. Limitations

- **Granularity is a judgement call.** Deciding what counts as "one concept" is subjective, and graphs built by different teachers will not match exactly.
- **Alignment is not evidence of learning.** Like Marble's dataset, a `standards:` tag shows that a concept addresses a requirement, not that students have mastered it.
- **Prerequisite edges are hypotheses.** Hard and soft dependencies reflect teacher experience and need to be checked against student outcomes.
- **Maintenance cost.** Many curriculum codes are long and change between versions. Licensing also limits reuse: some standards bodies only allow citing codes, not reproducing their text [2].
- **Single-author bias.** A graph grown by one teacher reflects one teacher's practice.

## 9. Conclusion

A teacher's lasting professional knowledge is a network of concepts, prerequisites and evidence of mastery. Curricula are temporary, external orderings over that network. Organising a personal knowledge base concepts-first lets one body of work comply with several curricula, show where coverage is missing, and serve as material for designing new ones. Open taxonomies such as Marble's show that the model works at the scale of a dataset. A teacher's own graph adds what such datasets lack: knowledge grounded in actual classroom practice.

## References

[1] Zendot, "Marble Open-Sources a Skill Taxonomy of 1,590 Elementary Learning Topics Wired by Prerequisites," 19 Oct 2026. https://www.zendot.org/en/posts/withmarbleapp-os-taxonomy
[2] Marble, *os-taxonomy* (README, PROVENANCE.md, CHANGELOG.md). https://github.com/withmarbleapp/os-taxonomy
[3] N. Dabbagh and A. Kitsantas, "Personal Learning Environments, social media, and self-regulated learning: A natural formula for connecting formal and informal learning," *The Internet and Higher Education*, vol. 15, no. 1, pp. 3–8, 2012.
[4] T. Trust, D. G. Krutka, and J. P. Carpenter, "'Together we are better': Professional learning networks for teachers," *Computers & Education*, vol. 102, pp. 15–34, 2016.
[5] M. Appleton, "A Brief History & Ethos of the Digital Garden." https://maggieappleton.com/garden-history
[6] S. Whittaker, "Personal Information Management: From Information Consumption to Curation," *Annual Review of Information Science and Technology*, vol. 45, 2011.
[7] M. Bohuslavová, "Cultivating ideas: exploring digital gardening as a tool of personal information management in communities of practice," 2024. https://magdalenabohuslavova.wordpress.com/2024/08/27/cultivating-ideas-exploring-digital-gardening-as-a-tool-of-personal-information-management-in-communities-of-practice-mbib4250-1-essay/
[8] "R Markdown as a dynamic interface for teaching: Modules from math and biology classrooms." https://pmc.ncbi.nlm.nih.gov/articles/PMC9487201/
