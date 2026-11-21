<!--
  English content for the whole site. Edit the text, save, and the page updates.

  Rules (see README.md for more):
  - Keep the "# Section" headings as they are (Site, Hero, About, Projects, ...).
  - "## Item" headings start a new project, service, skill group, school or certificate.
  - "### Part" headings inside a project are case-study parts (Overview, Problem, Solution,
    My role, Challenges, Results). Leave a part out to hide it.
  - Lines like "- Field: value" set a field. Leave the value empty to hide it.
  - Lists such as Technologies are comma-separated.
  - Plain paragraphs are the text. **bold**, *italic* and [links](https://example.com) work.
  - "- Site URL:" is the public address (https://example.com). It is needed for link previews,
    search-engine tags and the sitemap.
  - In a project, "- Highlights:" are short facts shown at the top of its case study
    (e.g. "40+ tests, 12 endpoints, 0 double bookings") and "- Diagram:" is an image such as
    /images/ticketing-architecture.png. Both can be added to any project; empty means hidden.
  - Contact-form messages are saved to messages/inbox.md while `npm run dev` or
    `npm run preview` runs. "- Form endpoint:" sends them to another address instead.
  - A comment line starting with "placeholder" marks the field right below it as dummy data,
    as do values using example.com or "placeholder". `npm run check` lists them all.
-->

# Site

- Name: Anas Atallah Yaghi
- Title: Backend Developer
- Initials: AY
- Photo: /images/profile.png
- Email: anas.yaghi@example.com
- GitHub: https://github.com/anasyaghi9
- LinkedIn: https://linkedin.example.com/in/anas-yaghi
- CV: /cv/placeholder-cv.pdf
- Focus: Django · DRF · PostgreSQL · REST API design
- Footer tagline: Django · DRF · PostgreSQL
- Page title: Anas Atallah Yaghi — Backend Developer
- Page description: Backend developer working with Python, Django, Django REST Framework and PostgreSQL. Selected projects, case studies and contact.
- Site URL:

# Hero

- Eyebrow: Backend Developer
- Headline: Building reliable backend systems,
- Headline muted: one well-designed solution at a time.
- Tags: Python, Django, DRF, PostgreSQL, REST APIs

I'm Anas Atallah Yaghi, a Backend Developer focused on Python, Django, Django REST Framework and PostgreSQL. I build structured APIs and backend solutions with attention to data modeling, maintainability, testing, and real product needs.

# About

- Heading: The server side, built with care

I work on the server side of products: the data models, the API contract, and the parts that have to keep behaving correctly after launch. Most of my work is in Python with Django and Django REST Framework, backed by PostgreSQL and documented REST endpoints.

My approach starts with the data. I map the entities and relationships first, then the endpoints that operate on them, then the tests that prove the edge cases hold — authentication, permissions, validation, and the concurrency cases that only show up under real traffic.

I'm studying Computer Science at Al-Azhar University, and I've been building through the Gaza Sky Geeks backend path and the Meta Back-End Developer track. I'm currently in a four-month back-end training at TAQAT, where I lead the back-end team.

Right now I'm focused on production-shaped APIs: containerised Django services, background jobs with Celery and Redis, and deployments behind Nginx.

# Projects

- Heading: Selected work
- Intro: Four projects, each documented as a case study.

## Event Ticketing Backend

- Slug: event-ticketing-backend
- Image: /images/event-ticketing.jpg
- Technologies: Django, DRF, PostgreSQL, Redis, Celery, Docker
- GitHub: https://github.com/anasyaghi9/ticketing
- Live demo: https://ticketing-demo.example.com
<!-- placeholder: dummy value, replace before launch -->
- Highlights: 0 double bookings in load tests, 10-minute seat holds, 45 automated tests
- Diagram: /images/diagrams/placeholder-ticketing.svg

Ticketing platform with double-booking protection: seat holds, JWT auth, and a Celery worker that releases expired holds.

### Problem

Two visitors can reach checkout for the same seat at the same moment. Without a reservation window both payments succeed, and the same seat is sold twice.

### Solution

A hold record is created before payment, guarded by a database constraint so only one active hold can exist per seat. A Celery beat task sweeps expired holds and returns the seat to inventory.

### My role

I designed the schema, wrote the hold and checkout endpoints, wired JWT authentication, and built the test suite.

### Challenges

The race condition lives in the database, not in the view. The fix had to hold under concurrent requests, which meant constraints and transactions rather than application-level checks.

### Results

A pytest suite covering the service layer, the API and the concurrency cases, plus a Docker Compose setup with PostgreSQL, Redis and the worker.

## MealsRater API

- Slug: mealsrater-api
- Image: /images/mealsrater.jpg
- Technologies: Django, DRF, Token Auth, SQLite
- GitHub: https://github.com/anasyaghi9/MealsRater-APIs
- Live demo: https://mealsrater-demo.example.com
<!-- placeholder: dummy value, replace before launch -->
- Highlights: 12 REST endpoints, Token auth on every write, 30 automated tests
- Diagram: /images/diagrams/placeholder-mealsrater.svg

REST API where users register, browse meals and rate them 1–5 stars, with live averages on every meal.

### Problem

Ratings need to be trustworthy: one rating per user per meal, validated stars, and an average that never drifts from the underlying rows.

### Solution

A dedicated rate_meal endpoint creates or updates the caller's rating in place, computes the average and count from the related rows, and returns explicit validation errors.

### My role

I built the models, serializers, viewsets and the endpoint contract.

### Challenges

Preventing duplicate ratings meant a unique constraint on the (user, meal) pair, with the endpoint branching between create and update responses.

## Mini Social Network

- Slug: mini-social-network
- Image: /images/mini-social-network.jpg
- Technologies: Django, PostgreSQL, Docker, Bulma
- GitHub: https://github.com/anasyaghi9/mini-social-network
- Live demo: https://social-demo.example.com
<!-- placeholder: dummy value, replace before launch -->
- Highlights: 8 data models, Paginated feed, 25 automated tests
- Diagram: /images/diagrams/placeholder-social.svg

A Django social platform with profiles, asymmetric follows and a 140-character feed, running on PostgreSQL in Docker.

### Problem

A feed is a relationship problem: who follows whom, and how a user's timeline is assembled from those relationships.

### Solution

A profile model with a non-symmetrical many-to-many follow relation, created automatically for every user, with a dashboard query that pulls posts from the followed set.

### My role

I built the data model, views, templates and the Docker Compose environment.

### Challenges

New accounts saw an empty feed until profiles followed themselves by default — a small modelling decision that fixed the first-run experience.

## Little Lemon

- Slug: little-lemon
- Image: /images/little-lemon.jpg
- Technologies: Django, PostgreSQL, Templates
- GitHub: https://github.com/anasyaghi9/littlelemon
- Live demo: https://littlelemon-demo.example.com
<!-- placeholder: dummy value, replace before launch -->
- Highlights: Booking and menu APIs, Role-based permissions, 20 automated tests
- Diagram: /images/diagrams/placeholder-littlelemon.svg

A Django restaurant project: menu data modelled in PostgreSQL and rendered through server-side templates.

### Problem

A restaurant site is only useful if the menu lives in the database rather than in hard-coded template markup.

### Solution

Menu and restaurant tables in PostgreSQL, exposed to Django views and rendered through reusable templates.

### My role

I set up the project, the models, the database connection and the templates.

# Services

- Heading: What I can build for you

## Backend development with Python & Django

Structured Django applications: models, views, admin, background tasks, and the deployment pieces around them.

## REST API development

Django REST Framework APIs with authentication, permissions, validation, and a clear endpoint contract.

## Database design & integration

Relational schemas in PostgreSQL: entities, constraints, indexes, and migrations that stay manageable as the product grows.

## API integration & backend maintenance

Connecting existing services, fixing failing endpoints, and keeping the backend predictable under real usage.

# Skills

- Heading: Tools I work with

## Languages

- Items: Python, SQL

## Backend

- Items: Django, Django REST Framework, Celery

## Databases

- Items: PostgreSQL, SQLite, Redis

Practical use in project work; still deepening production operations.

## APIs

- Items: REST API design, JWT & token auth, Permissions, Validation

## Tools

- Items: Git, GitHub, Docker, Linux, Nginx, pytest

## Learning

- Items: System design, Competitive programming, Data structures

Ongoing through coursework and Codeforces problem solving.

# Education

- Heading: Academic background

## Al-Azhar University

- Qualification: Bachelor's degree
- Field: Computer Science
- Start: 2022-09
- End: 2026-08

Coursework across algorithms, data structures, databases and software engineering, alongside backend projects and competitive programming practice.

# Certifications

- Heading: Certificates and training

## Meta Back-End Developer

- Issuer: Meta · Coursera
<!-- placeholder: dummy value, replace before launch -->
- Date: 2024-08
- Link: https://credentials.example.com/meta-back-end-developer
- File:

Ten Meta certificates completed through the Coursera / UNDP scholarship, including the Meta Back-End Developer certificate.

## Anthropic certificates

- Issuer: Anthropic
<!-- placeholder: dummy value, replace before launch -->
- Date: 2025-06
- Link: https://credentials.example.com/anthropic
- File:

Three Anthropic certificates completed.

## Competitive Programming Training — 120 hours

- Issuer: Gaza Sky Geeks · Coach Academy · Mercy Corps Pakistan
<!-- placeholder: dummy value, replace before launch -->
- Date: 2023-12
- Link: https://credentials.example.com/competitive-programming
- File:

120 hours of competitive programming training.

# Contact

- Heading: Let's talk about your backend
- Intro: Tell me what you are building and I will reply with a clear next step.
- Form endpoint:
