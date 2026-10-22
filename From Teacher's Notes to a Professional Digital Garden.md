# Teacher's Knowledge Management Workflow from Second Brain to Digital Garden

## Abstract

This article presents a workflow for transforming an Obsidian-based "Second Brain" of private teacher notes into a public-facing "Digital Garden" using the Eleventy (11ty) static site generator. I propose a proof-of-concept (PoC) for publishing curated notes from an Obsidian Vault, facilitating the transition from isolated personal knowledge management (PKM) to an open, interconnected professional learning network. This study protocol outlines a mixed-methods longitudinal pilot to investigate the impact of this workflow on teacher reflective practice, knowledge sharing, and professional development.

## 1. Introduction

The modern educator navigates a complex information landscape, necessitating robust personal knowledge management (PKM) strategies [](https://bianke.cnki.net/Web/SearchArticle?kw=%E4%B8%AA%E4%BA%BA%E7%9F%A5%E8%AF%86%E7%AE%A1%E7%90%86&field=0&page=68#1). Tools like Obsidian have emerged as powerful "Second Brain" solutions, enabling teachers to capture, link, and synthesize their professional knowledge in a networked manner [](https://www.vhs-lennetal.de/beruf-edv-medienkompetenz/kw/bereich/kursdetails/kurs/26F50151/kursname/Obsidian%20Second%20Brain%20Flexibles%20Werkzeug%20fuer%20vernetztes%20Denken%20Online-Kurs/kategorie-id/37/)[](https://digitalfueralle.de/aktion/Online-Seminar%3A%20Obsidian%20%E2%80%93%20Second%20Brain). The concept of the "Digital Garden" extends this metaphor, advocating for the "rewilding" of private notes into public, interconnected spaces for sharing and collaboration [](https://reclaimopen.com/session/federating-your-second-brain-rewilding-notes-into-gardens-newsletters-and-networks/?ref=blog.reclaimhosting.com)[](https://wiobyrne.com/tags/knowledge-systems/#main-content). This article explores the intersection of these concepts, detailing a workflow to publish an Obsidian Vault as a Digital Garden via the Eleventy static site generator.

## 2. Theoretical Framework

This work is grounded in theories of PKM, reflective practice, and professional learning networks (PLNs). Teachers engage in continuous knowledge creation, but these insights often remain siloed in private notes. Research on Personal Learning Environments (PLEs) [](https://bianke.cnki.net/Web/SearchArticle?kw=%E4%B8%AA%E4%BA%BA%E7%9F%A5%E8%AF%86%E7%AE%A1%E7%90%86&field=0&page=68#1) emphasizes the need for learner-controlled, flexible systems that integrate formal and informal learning. Similarly, PLNs [](https://bianke.cnki.net/Web/SearchArticle?kw=%E4%B8%AA%E4%BA%BA%E7%9F%A5%E8%AF%86%E7%AE%A1%E7%90%86&field=0&page=68#1) highlight the importance of connecting with peers and resources beyond institutional boundaries. The Digital Garden serves as a bridge, transforming a private PLE into a public PLN node, thereby aligning with the shift from knowledge consumption to knowledge curation [](https://bianke.cnki.net/Web/SearchArticle?kw=%E4%B8%AA%E4%BA%BA%E7%9F%A5%E8%AF%86%E7%AE%A1%E7%90%86&field=0&page=68#1). The workflow also draws upon the concept of "atomic notes"—interlinked, self-contained ideas—to build a robust knowledge base [](https://wiobyrne.com/tags/knowledge-systems/#main-content).

Important aspect open source and full control through all workflow
Using Obsidian is not really important, but using md is.
Using MD help to incorporate AI agents into workflow later on

Using 11ty is not important, it is just fast, minimal and allow to control all aspect of informational architecture and design for digital garden
Versioning with git also not that important, but reliable versioning system is important
Repeatability all chosen solution should work well on all major consumer OS and easily be reaped

## 3. Methodology: Proof-of-Concept Workflow

Our PoC workflow demonstrates a seamless integration between Obsidian's note-taking environment and Eleventy's static site generation capabilities.

### 3.1. Components

- **Obsidian:** The primary tool for creating and managing all notes. Its strength lies in its support for Markdown, internal wikilinks (`[[Note]]`), and a rich ecosystem of plugins [](https://github.com/gofullthrottle/obsidian-publisher#1)[](https://www.vhs-lennetal.de/beruf-edv-medienkompetenz/kw/bereich/kursdetails/kurs/26F50151/kursname/Obsidian%20Second%20Brain%20Flexibles%20Werkzeug%20fuer%20vernetztes%20Denken%20Online-Kurs/kategorie-id/37/).
    
- **Eleventy (11ty):** A static site generator that builds the Digital Garden website from Markdown files. Its flexibility and simplicity make it ideal for this purpose [](https://github.com/oleeskild/obsidian-digital-garden/discussions/389#1)[](https://techhub.social/@NearerAndFarther/114321715364106120)[](https://techlifeweb.com/blog/2026/02/post-2026-02-22T190938/).
    
- **11ty Plugins:** Key to this integration is the `eleventy-plugin-interlinker`, which adds support for Obsidian-style wikilinks and automatically tracks backlinks for the web version [](https://techhub.social/@NearerAndFarther/114321715364106120)[](https://techlifeweb.com/blog/2026/02/post-2026-02-22T190938/)[](https://nearerandfarther.com/notes/setting-up-a-digital-garden-with-obsidian-and-eleventy/#added-anchored-headings).

pagefind - WASM search solution that works in client browser
mathjax - TeX render engine


### 3.2. Setup and Publishing Process

1. **Project Setup:** Create a new Eleventy project. Install the `eleventy-plugin-interlinker` and other necessary dependencies.
    
2. **Vault Configuration:** Open the Eleventy project folder as an Obsidian Vault.
    
3. **Excluding Private Content:** Use Obsidian's "Excluded Files" feature to hide system folders (e.g., `node_modules`) and private notes from the build process [](https://sanlive.com/obsidian-11ty-local/). Alternatively, implement a draft system using frontmatter (e.g., `draft: true`) to prevent certain notes from being published [](https://nearerandfarther.com/notes/setting-up-a-digital-garden-with-obsidian-and-eleventy/#added-anchored-headings).
    
4. **Creating Content:** Write notes in Obsidian using standard Markdown and internal wikilinks. The template system in Obsidian can be used to generate consistent YAML frontmatter (title, date, tags) for all new notes [](https://techlifeweb.com/blog/2026/02/post-2026-02-22T190938/)[](https://nearerandfarther.com/notes/setting-up-a-digital-garden-with-obsidian-and-eleventy/#added-anchored-headings).
    
5. **Building the Garden:** Run the Eleventy build command (`npm run build`), which uses the plugin to convert wikilinks to standard HTML links and generate the static site [](https://techhub.social/@NearerAndFarther/114321715364106120)[](https://techlifeweb.com/blog/2026/02/post-2026-02-22T190938/).
    
6. **Deployment:** The built site (typically in a `dist` folder) can be deployed to various hosting services, including GitHub Pages [](https://github.com/oleeskild/obsidian-digital-garden/discussions/389#1), Vercel [](https://github.com/gofullthrottle/obsidian-publisher#1), Netlify [](https://stackapps.com/revisions/d55ffde2-bc47-48b9-88db-e996cc060dcc/view-source), or Cloudflare Pages [](https://nickdirienzo.com/obsidian-digital-garden-on-cloudflare/).
    

_Figure 1: Diagram of the Obsidian-to-Digital-Garden Workflow_

### 3.3. Deployment Options

- **Vercel/Netlify:** The `obsidian-digital-garden` community template provides one-click deployment options [](https://github.com/gofullthrottle/obsidian-publisher#1)[](https://stackapps.com/revisions/d55ffde2-bc47-48b9-88db-e996cc060dcc/view-source).
    
- **GitHub Actions:** A custom workflow can be set up to automatically build and deploy the site to GitHub Pages on each push to the repository [](https://github.com/oleeskild/obsidian-digital-garden/discussions/389#1).
    
- **Local Build:** The site can also be generated locally and then manually deployed to a server [](https://sanlive.com/obsidian-11ty-local/).
    

## 4. Proposed Research Study

To evaluate the efficacy of this workflow, we propose a mixed-methods, longitudinal pilot study with teacher participants. The study is designed as a "pre-data protocol" with placeholders for future results.

### 4.1. Research Questions

1. How does implementing a Second-Brain-to-Digital-Garden workflow influence teachers' reflective practice?
    
2. To what extent does the Digital Garden facilitate knowledge sharing and collaboration among educators?
    
3. What are the perceived barriers and enablers for teachers in adopting this PKM and publishing workflow?
    

### 4.2. Study Design

- **Phase 1 (Baseline):** Participants document their current PKM and professional sharing practices.
    
- **Phase 2 (Intervention):** Participants are trained on the Obsidian + Eleventy workflow and use it for a semester to manage and publish their teaching notes.
    
- **Phase 3 (Analysis):** Data collection includes pre/post-intervention surveys (assessing technology self-efficacy and perceptions of knowledge sharing), analysis of Digital Garden content (number of notes, links, and updates), and semi-structured interviews to gather qualitative insights.
    

### 4.3. Placeholder for Results

_[Data to be collected and analyzed post-study. Findings will be reported in the final manuscript.]_

## 5. Related Work

This PoC aligns with existing research on PKM. Studies have explored teacher knowledge management and the creation of personal digital resource libraries [](https://bianke.cnki.net/Web/SearchArticle?kw=%E4%B8%AA%E4%BA%BA%E7%9F%A5%E8%AF%86%E7%AE%A1%E7%90%86&field=0&page=68#1). The broader discourse on "Digital Gardens" and "rewilding" notes emphasizes moving beyond private archiving toward public contribution [](https://reclaimopen.com/session/federating-your-second-brain-rewilding-notes-into-gardens-newsletters-and-networks/?ref=blog.reclaimhosting.com)[](https://wiobyrne.com/tags/knowledge-systems/#main-content). Specific technical workflows for integrating Obsidian and Eleventy have been documented in online tutorials and community discussions, but formal academic research on its impact in educational contexts remains nascent [](https://techhub.social/@NearerAndFarther/114321715364106120)[](https://nearerandfarther.com/notes/setting-up-a-digital-garden-with-obsidian-and-eleventy/#added-anchored-headings)[](https://sanlive.com/obsidian-11ty-local/).

## 6. Conclusion

The Obsidian + Eleventy workflow offers a powerful, open, and customizable solution for teachers to transform their private knowledge repositories into professional Digital Gardens. This study protocol provides a foundation for future empirical research to systematically investigate the pedagogical benefits of such systems, moving from the **Second Brain** to the **First Space** for professional sharing and growth.

## References

[1] Obsidian Digital Garden Documentation. [https://dg-docs.ole.dev/](https://dg-docs.ole.dev/)  
[2] K. Jones, "Personal Information Management," 2007.  
[3] S. Whittaker, "Personal Information Management: From Information Consumption to Curation," 2011.  
[4] N. Dabbagh and A. Kitsantas, "Personal Learning Environments, social media, and self-regulated learning: A natural formula for connecting formal and informal learning," _The Internet and Higher Education_, vol. 15, no. 1, pp. 3-8, 2012.  
[5] T. Trust, D. G. Krutka, and J. P. Carpenter, "‘Together we are better’: Professional learning networks for teachers," _Computers & Education_, vol. 102, pp. 15-34, 2016.  
[6] S. Oddone, et al., "Teachers' Professional Learning Networks: A review of the literature," 2019.  
[7] C. L. Poortman, et al., "Teacher professional learning networks," 2022.  
[8] M. Körkkö, "The use of blogs in reflective practice," 2021.  
[9] S. C. Kong, "Web-enabled video," 2010.  
[10] M. Appleton, "A Brief History & Ethos of the Digital Garden." [https://maggieappleton.com/garden-history](https://maggieappleton.com/garden-history)  
[11] "Publishing from Obsidian using 11ty," DeepakNess. [https://deepakness.com/](https://deepakness.com/)  
[12] "Adding Wiki Links to 11ty," Photogabble. [https://photogabble.co.uk/](https://photogabble.co.uk/)

Digital Gardening and Personal Knowledge Management for Developing Reflective Teaching Competence


https://magdalenabohuslavova.wordpress.com/2024/08/27/cultivating-ideas-exploring-digital-gardening-as-a-tool-of-personal-information-management-in-communities-of-practice-mbib4250-1-essay/

> “Markdown note‑taking is used by a small but growing minority of teachers, concentrated in technical and higher‑education contexts; there is no reliable global percentage, but it is clearly far from mainstream compared with Word/Google Docs.” # R Markdown as a dynamic interface for teaching: Modules from math and biology classrooms https://pmc.ncbi.nlm.nih.gov/articles/PMC9487201/