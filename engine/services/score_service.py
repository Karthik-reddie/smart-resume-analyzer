from __future__ import annotations

import os
import re
from typing import Any, Dict, List
import requests

from neuron.skill_extraction.extractor import extract_skills


# Dynamic templates for god-tier deterministic recommendations
SKILL_BULLET_TEMPLATES = {
    "python": "Architected high-throughput backend data pipelines using Python, reducing processing latency by 35% through multiprocessing and vectorized operations.",
    "javascript": "Engineered highly interactive client-side web applications using modern JavaScript (ES6+), optimizing bundle sizes to achieve a 25% faster time-to-interactive.",
    "typescript": "Migrated legacy codebases to TypeScript, establishing strict type boundaries that eliminated over 90% of runtime type exceptions and improved developer velocity.",
    "react": "Componentized web applications using React and custom hooks, improving rendering performance by 40% and boosting user retention metrics.",
    "node.js": "Designed scalable backend microservices using Node.js and Express, supporting high concurrent connections with optimized event-loop execution.",
    "flask": "Developed light-weight, highly secure REST APIs using Flask, implementing token-based authentication and rate limiting for multi-tenant clients.",
    "django": "Designed robust enterprise architectures using Django, utilizing ORM optimizations and database caching to handle millions of weekly page views.",
    "fastapi": "Built async backend systems with FastAPI, utilizing native type hints and Pydantic models for automated schema validation and 3x faster response times.",
    "sql": "Optimized complex SQL queries and index layouts, resolving database bottlenecks and reducing reporting query runtimes from minutes to seconds.",
    "postgres": "Administered distributed PostgreSQL instances, implementing connection pooling and read-replicas to maintain 99.99% database uptime.",
    "mysql": "Refactored transactional MySQL schemas, executing zero-downtime migrations and optimizing index selections for write-heavy workloads.",
    "mongodb": "Designed flexible document-based schemas in MongoDB, facilitating rapid feature iteration and achieving high-speed lookups with compound indices.",
    "redis": "Integrated Redis caching clusters, reducing database query volumes by 65% and implementing distributed locks for session management.",
    "aws": "Provisioned automated cloud infrastructure on AWS utilizing Terraform, leveraging ECS, Lambda, and S3 for elastic scalability.",
    "gcp": "Deployed containerized services to Google Cloud Platform (GCP) using GKE and Cloud Run, utilizing BigQuery for serverless analytical warehouses.",
    "azure": "Architected enterprise cloud integrations in Microsoft Azure, utilizing Active Directory (Entra ID) and Azure Functions for secure serverless automation.",
    "docker": "Dockerized local development environments and multi-stage production builds, achieving absolute environment parity and cutting CI/CD build times in half.",
    "kubernetes": "Orchestrated container deployments using Kubernetes, configuring auto-scaling policies, ingress controllers, and self-healing container lifecycles.",
    "pytorch": "Trained and deployed deep learning architectures using PyTorch, accelerating inference speeds by 40% through model quantization and GPU pinning.",
    "tensorflow": "Engineered machine learning pipelines in TensorFlow, utilizing distributed training to deploy neural networks for real-time recommendation engines.",
    "spacy": "Developed natural language parsing systems with spaCy, extracting key entities and insights from noisy unstructured texts with high precision.",
    "nlp": "Designed advanced Natural Language Processing (NLP) models, utilizing word embeddings and semantic similarity to classify large-scale document corpuses.",
    "machine learning": "Deployed predictive Machine Learning models into production environments, leveraging robust cross-validation to maintain high accuracy and stability.",
    "data analysis": "Conducted high-impact data analysis on transactional databases, generating interactive dashboards that directly guided executive product strategy.",
    "pandas": "Engineered high-performance data transformation jobs utilizing Pandas, vectorizing operations to clean and aggregate gigabytes of logs efficiently.",
    "numpy": "Implemented scientific computing algorithms using NumPy array math, improving computational throughput compared to raw Python loops.",
    "scikit-learn": "Designed feature extraction and regression pipelines in Scikit-Learn, establishing clean train-test baselines for predictive customer scoring.",
    "jest": "Established a comprehensive unit-testing suite using Jest, increasing frontend test coverage to 85% and preventing regression bugs on critical routes.",
    "cypress": "Authored end-to-end integration tests using Cypress, simulating key customer checkout and registration workflows to guarantee UI reliability.",
    "tailwind": "Implemented modern, highly responsive design systems using Tailwind CSS, reducing CSS bundle sizes and accelerating UI implementation cycles.",
    "css": "Authored performant, responsive CSS stylesheets using CSS Variables and Flexbox/Grid layouts to create pixel-perfect responsive layouts.",
    "html": "Structured web layouts using semantic HTML5 elements, achieving perfect accessibility audits and improving natural SEO indexing rankings.",
    "git": "Championed Git branch governance and code-review workflows, using rebase strategies and trunk-based development to maintain a stable release branch.",
    "rest": "Designed high-quality, standardized RESTful API architectures, implementing status codes, versioning, and clean payload schemas.",
    "graphql": "Designed flexible GraphQL schemas and query resolvers, eliminating over-fetching of data and consolidating multiple backend calls into single requests.",
    "spark": "Engineered distributed big-data processing workflows using Apache Spark, processing multi-terabyte datasets across elastic clusters.",
}


def _calculate_relevance(resume_text: str, job_description: str, matched_skills: List[str]) -> float:
    """Computes a high-quality semantic relevance score based on keyword overlap and density."""
    if not job_description:
        return 100.0

    resume_lower = resume_text.lower()
    jd_lower = job_description.lower()

    # Extract non-trivial words from job description to check context overlap
    stop_words = {"and", "the", "with", "for", "that", "this", "from", "your", "will", "have", "been", "using", "about"}
    jd_words = [w for w in re.findall(r"\b[a-z]{3,15}\b", jd_lower) if w not in stop_words]
    if not jd_words:
        return 50.0

    # Count how many of the JD words appear in the resume
    overlap_words = [w for w in jd_words if w in resume_lower]
    word_overlap_ratio = len(overlap_words) / len(jd_words)

    # Calculate skill density overlap
    skill_bonus = min(1.0, len(matched_skills) / 8.0) if matched_skills else 0.0

    # Combine metrics: 60% word overlap, 40% skill density overlap
    relevance = (word_overlap_ratio * 60.0) + (skill_bonus * 40.0)
    return round(min(100.0, max(0.0, relevance)), 1)


def _calculate_coverage(resume_text: str) -> Dict[str, Any]:
    """Evaluates formatting completeness, presence of core sections, and content depth."""
    text_lower = resume_text.lower()
    word_count = len(resume_text.split())

    # Section checklist
    has_experience = any(h in text_lower for h in ["experience", "work history", "employment", "professional history", "projects"])
    has_education = any(h in text_lower for h in ["education", "university", "college", "degree", "academic"])
    has_skills = any(h in text_lower for h in ["skills", "technologies", "expertise", "competencies"])
    has_contact = any(h in text_lower for h in ["email", "phone", "contact", "@", "linkedin.com", "github.com"])

    # Score allocation
    score = 30.0  # base score
    if has_experience:
        score += 20.0
    if has_education:
        score += 15.0
    if has_skills:
        score += 15.0
    if has_contact:
        score += 10.0

    # Word count check (sweet spot 300 to 1200 words)
    if 300 <= word_count <= 1200:
        score += 10.0
    elif 150 <= word_count < 300 or 1200 < word_count <= 2000:
        score += 5.0

    return {
        "score": round(min(100.0, score), 1),
        "details": {
            "has_experience": has_experience,
            "has_education": has_education,
            "has_skills": has_skills,
            "has_contact": has_contact,
            "word_count": word_count
        }
    }


def _generate_recommendations_llm(
    resume_text: str,
    job_description: str,
    matched_skills: List[str],
    missing_skills: List[str]
) -> Dict[str, Any] | None:
    """Attempts to use Google Gemini API to generate customized recommendations if the API key is present."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    try:
        # Prompt designed to generate a valid JSON payload matching expectations
        prompt = f"""
        You are an expert ATS (Applicant Tracking System) optimizer and professional resume writer.
        Analyze the following Resume and Job Description.

        RESUME TEXT:
        \"\"\"{resume_text}\"\"\"

        JOB DESCRIPTION:
        \"\"\"{job_description}\"\"\"

        MATCHED SKILLS: {matched_skills}
        MISSING SKILLS: {missing_skills}

        Generate highly targeted recommendations. Your output MUST be valid JSON matching this exact structure:
        {{
            "summary_suggestions": "A paragraph explaining how to rewrite or adjust the executive summary to match the job description.",
            "skills_suggestions": [
                "Specific skill adjustment instruction 1",
                "Specific skill adjustment instruction 2"
            ],
            "experience_suggestions": [
                "Custom-crafted professional resume bullet point incorporating missing skill 1 with metrics",
                "Custom-crafted professional resume bullet point incorporating missing skill 2 with metrics"
            ]
        }}

        Do NOT include any markdown code blocks, triple backticks, or text before/after the JSON. Return only raw, valid JSON.
        """

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }

        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            result = response.json()
            text_content = result["candidates"][0]["content"]["parts"][0]["text"].strip()
            # Clean up potential markdown formatting
            if text_content.startswith("```"):
                text_content = re.sub(r"^```(?:json)?\n?", "", text_content)
                text_content = re.sub(r"\n?```$", "", text_content)
            
            import json
            data = json.loads(text_content.strip())
            return {
                "summary_suggestions": data.get("summary_suggestions", ""),
                "skills_suggestions": data.get("skills_suggestions", []),
                "experience_suggestions": data.get("experience_suggestions", [])
            }
    except Exception as e:
        # Fall back to deterministic on any exception
        print(f"LLM generation error: {e}")
        return None


def generate_recommendations_deterministic(
    matched_skills: List[str],
    missing_skills: List[str]
) -> Dict[str, Any]:
    """Generates gorgeous, high-fidelity recommendations deterministically using robust templates."""
    # Skills section recommendations
    skills_suggestions = []
    if missing_skills:
        skills_suggestions.append(
            f"Integrate key missing technical skills: {', '.join([s.title() for s in missing_skills[:6]])} in your skills matrix."
        )
    if matched_skills:
        skills_suggestions.append(
            f"Emphasize strong baseline competencies in {', '.join([s.title() for s in matched_skills[:4]])} by moving them to the top of your technical sections."
        )
    else:
        skills_suggestions.append("Add a dedicated 'Technical Skills' section categorizing languages, frameworks, and databases.")

    # Experience bullets suggestions
    experience_suggestions = []
    for skill in missing_skills:
        # Normalize skill mapping key
        key = skill.lower()
        if key in SKILL_BULLET_TEMPLATES:
            experience_suggestions.append(SKILL_BULLET_TEMPLATES[key])
        if len(experience_suggestions) >= 5:  # Cap at 5 highly relevant bullets
            break

    # If no missing skills or templates matched, provide generic high-quality bullets
    if not experience_suggestions:
        experience_suggestions = [
            "Architected highly scalable cloud applications, improving system availability and reducing server response latency by 30%.",
            "Led a cross-functional agile development team to deliver critical feature releases, accelerating deployment cycles by 25%.",
            "Designed and optimized relational and non-relational database schemas, enhancing write throughput and resolving critical query bottlenecks."
        ]

    # Summary suggestion
    if missing_skills:
        highlights = ", ".join([s.title() for s in missing_skills[:3]])
        summary_suggestions = (
            f"Update your professional summary to position yourself as an expert. Consider starting with: "
            f"\"Results-driven Software Engineer with extensive experience building high-performance systems. "
            f"Proven track record leveraging {' and '.join([s.title() for s in matched_skills[:2]]) if matched_skills else 'modern technologies'} "
            f"alongside strong capabilities in {highlights} to deliver business value...\""
        )
    else:
        summary_suggestions = (
            "Your professional summary is exceptionally aligned. Consider polishing your action verbs and "
            "incorporating a quantitative metric showcasing your years of experience or team leadership footprint."
        )

    return {
        "summary_suggestions": summary_suggestions,
        "skills_suggestions": skills_suggestions,
        "experience_suggestions": experience_suggestions
    }


def score_resume_against_job(
    *,
    resume_text: str,
    resume_skills: List[str] | None = None,
    job_description: str
) -> Dict[str, Any]:
    """Main service logic to score a resume against a target job description and return the full ATS payload."""
    if resume_skills is None:
        resume_skills = extract_skills(resume_text)
    
    # Extract job description skills
    job_skills = extract_skills(job_description)

    # 1. Skill Match Score calculation
    if not job_skills:
        skill_match_score = 100.0
        matched_skills = []
        missing_skills = []
    else:
        matched_set = set(resume_skills) & set(job_skills)
        matched_skills = sorted(list(matched_set))
        missing_skills = sorted(list(set(job_skills) - matched_set))
        skill_match_score = round((len(matched_skills) / len(job_skills)) * 100.0, 1)

    # 2. Relevance Score calculation
    relevance_score = _calculate_relevance(resume_text, job_description, matched_skills)

    # 3. Coverage Score calculation
    coverage_result = _calculate_coverage(resume_text)
    coverage_score = coverage_result["score"]

    # 4. Overall ATS Score (Weighted)
    # Skill Match (50%), Relevance (30%), Coverage (20%)
    overall_ats_score = round(
        (skill_match_score * 0.5) +
        (relevance_score * 0.3) +
        (coverage_score * 0.2)
    )

    # 5. Recommendations Generation (LLM with deterministic fallback)
    recommendations = _generate_recommendations_llm(
        resume_text, job_description, matched_skills, missing_skills
    )
    if not recommendations:
        recommendations = generate_recommendations_deterministic(
            matched_skills, missing_skills
        )

    return {
        "ats_score": overall_ats_score,
        "skill_match_score": skill_match_score,
        "relevance_score": relevance_score,
        "coverage_score": coverage_score,
        "coverage_details": coverage_result["details"],
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "recommendations": recommendations,
        "job_description_skills_detected": job_skills
    }
