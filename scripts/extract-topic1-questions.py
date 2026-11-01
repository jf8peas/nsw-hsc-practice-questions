#!/usr/bin/env python3
"""
Extract Topic 1 (The Global Economy) questions from NSW HSC Economics trial papers.
Output: TSV file with question metadata for Stage 1 of question bank creation.

Topic 1 = The Global Economy (2009 Syllabus)
- International economic integration, globalisation, GWP
- Free trade, protection (tariffs, quotas, subsidies)
- International organisations (WTO, IMF, World Bank, UN, OECD)
- Economic forums (G20, G7/8)
- Trading blocs, monetary unions, FTAs
- Growth vs development, HDI, income distribution
- Case study of economy other than Australia

NOT Topic 1 (Topics 2-4):
- Australia's balance of payments, current account, capital account
- Australia's terms of trade, exchange rates
- Australian fiscal/monetary policy, RBA
- Australia's foreign debt/liabilities
"""

import pdfplumber
import re
import os
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional, Tuple, Set

# Topic 1 keywords for identification (global/international focus)
TOPIC1_KEYWORDS = [
    # Global economy & globalisation
    'global economy', 'gross world product', 'gwp', 'globalisation', 'globalization',
    'trade in goods', 'financial flows', 'transnational corporation', 'tnc',
    'international division of labour', 'economic integration', 'global interdependence',
    
    # Free trade & protection (general, not Australia-specific)
    'free trade', 'protection', 'protectionist', 'tariff', 'tariffs', 'quota', 'quotas',
    'subsidy', 'subsidies', 'dumping', 'infant industry', 'local content',
    'export incentive', 'trade barrier', 'trade liberalisation',
    
    # International organisations & forums
    'wto', 'world trade organisation', 'world trade organization',
    'imf', 'international monetary fund',
    'world bank', 'united nations', 'un ', 'oecd',
    'g20', 'g7', 'g8', 'economic forum',
    
    # Trading blocs
    'trading bloc', 'monetary union', 'free trade agreement', 'fta',
    'multilateral', 'bilateral', 'eu ', 'apec', 'nafta', 'asean', 'mercusor',
    
    # Growth vs development
    'economic growth', 'economic development', 'hdI', 'human development',
    'quality of life', 'income distribution', 'wealth distribution',
    'gini', 'developing economy', 'emerging economy', 'advanced economy',
    'least developed', 'low income', 'middle income', 'high income',
    
    # Case study (economy other than Australia) - specific countries
    'china', 'usa', 'united states', 'japan', 'india', 'germany', 'uk ',
    'france', 'south korea', 'singapore', 'brazil', 'russia', 'indonesia',
    'thailand', 'vietnam', 'malaysia', 'philippines', 'egypt', 'nigeria',
    'south africa', 'mexico', 'argentina', 'chile', 'new zealand',
    'economy other than australia', 'case study', 'chosen economy',
    
    # Business cycle
    'international business cycle', 'regional business cycle', 'business cycle',
    'economic fluctuation', 'spill-over', 'contagion',
    
    # Environment & globalisation effects
    'environmental sustainability', 'environmental impact', 'global environment',
    'climate change', 'carbon emissions',
    
    # Income/wealth
    ' Lorenz curve', 'income inequality', 'wealth inequality', 'poverty'
]

# Keywords that indicate NON-Topic 1 (Topics 2-4: Australian focused)
NON_TOPIC1_KEYWORDS = [
    'australia\'s balance of payments', 'australia\'s current account',
    'australia\'s capital account', 'australia\'s financial account',
    'australia\'s terms of trade', 'australian terms of trade',
    'australian dollar', 'exchange rate', 'exchange rate mechanism',
    'australia\'s foreign debt', 'australia\'s foreign liabilities',
    'australian government policy', 'australian fiscal policy',
    'australian monetary policy', 'rba ', 'reserve bank', 'cash rate',
    'australia\'s net foreign', 'australia\'s net primary', 'australia\'s secondary income',
    'cad ', 'nfa ', 'net foreign assets', 'net foreign equity',
    'australia\'s exports', 'australia\'s imports', 'australian exports', 'australian imports',
    'australia\'s trade', 'australian trade', 'australia\'s current account deficit',
    'cad ', 'current account deficit', 'current account surplus',
    'terms of trade', 'trade weighted index', 'twi', 'aud ', 'a$'
]

# Keywords that strongly indicate Topic 1 (override some non-topic1 matches)
STRONG_TOPIC1_KEYWORDS = [
    'tariff', 'quota', 'subsidy', 'dumping', 'infant industry',
    'wto', 'imf', 'world bank', 'oecd', 'g20', 'g7', 'g8',
    'nafta', 'asean', 'apec', 'eu ', 'monetary union', 'trading bloc',
    'hdi', 'human development', 'gini', 'lorenz',
    'transnational corporation', 'tnc', 'globalisation', 'globalization'
]

@dataclass
class Question:
    source: str
    school: str
    year: int
    question: str
    format: str  # MC or SA
    marks: int
    concept: str
    dot_points: str
    stimulus: str
    solutions_in_file: bool
    key_answer: str
    status: str
    reason: str
    file: str
    page: int
    stem_start: str

def extract_text_from_pdf(pdf_path: str) -> List[Tuple[int, str]]:
    """Extract text from PDF, returning list of (page_num, text) tuples."""
    pages = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                pages.append((i + 1, text))
    except Exception as e:
        print(f"Error extracting {pdf_path}: {e}")
    return pages

def identify_question_type(text: str) -> str:
    """Determine if text is MC, SA, or ER question."""
    # Check for MC indicators - options with letters
    if re.search(r'\ba\)\s*\w+', text, re.IGNORECASE) or re.search(r'\b[A-D]\.\s+\w+', text):
        return 'MC'
    if re.search(r'\([A-D]\)', text):
        return 'MC'
    # Check for extended response (15+ marks, usually Section III/IV)
    mark_match = re.search(r'(\d+)\s*marks?', text, re.IGNORECASE)
    if mark_match and int(mark_match.group(1)) >= 15:
        return 'ER'
    # Otherwise short answer
    return 'SA'

def extract_marks(text: str) -> int:
    """Extract mark value from question text."""
    match = re.search(r'(\d+)\s*marks?', text, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return 0

def is_topic1(text: str) -> Tuple[bool, List[str], bool]:
    """
    Check if question is Topic 1 based on keywords.
    Returns: (is_topic1, matching_keywords, has_strong_topic1)
    """
    text_lower = text.lower()
    
    # Check for strong Topic 1 keywords first
    strong_matches = [kw for kw in STRONG_TOPIC1_KEYWORDS if kw in text_lower]
    has_strong = len(strong_matches) > 0
    
    # Check for non-Topic 1 keywords
    non_topic_matches = [kw for kw in NON_TOPIC1_KEYWORDS if kw in text_lower]
    
    # If has strong Topic 1 keywords, it's Topic 1 regardless
    if has_strong:
        return True, strong_matches, True
    
    # If has non-Topic 1 keywords and no strong Topic 1, it's not Topic 1
    if non_topic_matches:
        return False, non_topic_matches, False
    
    # Check for Topic 1 keywords
    topic_matches = [kw for kw in TOPIC1_KEYWORDS if kw in text_lower]
    return len(topic_matches) > 0, topic_matches, False

def map_concept(keywords: List[str]) -> Tuple[str, str]:
    """Map keywords to concept id and dot points."""
    kw_str = ' '.join(keywords).lower()
    
    if any(k in kw_str for k in ['tariff', 'quota', 'subsidy', 'protection', 'dumping', 'infant industry', 'trade barrier']):
        return 'c-protection', 'A9 A10 L5'
    if any(k in kw_str for k in ['wto', 'world trade', 'imf', 'international monetary', 'world bank', 'united nations', 'oecd']):
        return 'c-international-organisations', 'A6 L7'
    if any(k in kw_str for k in ['g20', 'g7', 'g8', 'economic forum']):
        return 'c-economic-forums', 'A7'
    if any(k in kw_str for k in ['trading bloc', 'monetary union', 'nafta', 'asean', 'eu ', 'apec', 'free trade agreement', 'multilateral', 'bilateral']):
        return 'c-trading-blocs', 'A8 A8a L7'
    if any(k in kw_str for k in ['free trade', 'advantages', 'disadvantages']):
        return 'c-free-trade', 'A5'
    if any(k in kw_str for k in ['globalisation', 'globalization', 'trade in goods', 'financial flows', 'transnational', 'tnc', 'international division']):
        return 'c-globalisation', 'A3 A3a A3b A3c A3d A3e'
    if any(k in kw_str for k in ['gross world product', 'gwp', 'global economy']):
        return 'c-global-economy', 'A1 A2'
    if any(k in kw_str for k in ['growth', 'development', 'hdI', 'human development', 'quality of life']):
        return 'c-growth-vs-development', 'A11 A13'
    if any(k in kw_str for k in ['developing', 'emerging', 'advanced']):
        return 'c-economy-classification', 'A14 A15'
    if any(k in kw_str for k in ['income distribution', 'wealth distribution', 'gini', 'lorenz']):
        return 'c-income-wealth-distribution', 'A12 L3 L4'
    if any(k in kw_str for k in ['business cycle', 'fluctuation', 'spill-over', 'contagion']):
        return 'c-international-business-cycle', 'A4 A16c'
    if any(k in kw_str for k in ['environment', 'sustainability', 'climate']):
        return 'c-globalisation-effects', 'L2 A16b'
    if any(k in kw_str for k in ['case study', 'economy other than australia', 'chosen economy']):
        return 'c-development-strategies', 'L8 CS1'
    
    return 'c-globalisation', 'A3'  # Default

def extract_questions_from_paper(pdf_path: str) -> List[Question]:
    """Extract all potential Topic 1 questions from a single paper."""
    questions = []
    school_year = Path(pdf_path).stem
    # Parse school and year from filename like "Knox 2025 Economics Trials & Solutions"
    match = re.match(r'(.+?)\s+(\d{4})', school_year)
    if not match:
        return questions
    
    school = match.group(1).strip()
    year = int(match.group(2))
    
    pages = extract_text_from_pdf(pdf_path)
    
    # Track seen questions to avoid duplicates (from solutions section)
    seen_stems: Set[str] = set()
    
    for page_num, text in pages:
        if not text.strip():
            continue
        
        # Check if this page has Topic 1 content
        is_t1, keywords, has_strong = is_topic1(text)
        if not is_t1:
            continue
        
        # Find question boundaries - look for numbered questions
        question_starts = []
        for m in re.finditer(r'(?m)^(\d+)[\.\)]\s+', text):
            question_starts.append((m.start(), m.group(1)))
        
        for i, (start, q_num) in enumerate(question_starts):
            end = question_starts[i + 1][0] if i + 1 < len(question_starts) else len(text)
            q_text = text[start:end].strip()
            
            if len(q_text) < 20:  # Too short
                continue
            
            # Check for duplicates using stem_start
            stem_words = ' '.join(q_text.split()[:10]).lower()
            if stem_words in seen_stems:
                continue
            seen_stems.add(stem_words)
            
            # Determine format
            fmt = identify_question_type(q_text)
            if fmt == 'ER':  # Skip extended response
                continue
            
            # Get marks
            marks = extract_marks(q_text)
            if fmt == 'MC' and marks == 0:
                marks = 1
            elif fmt == 'SA' and marks == 0:
                # Try to infer from context
                marks = 3  # Default
            
            # Get concept
            concept, dot_points = map_concept(keywords)
            
            # Determine stimulus
            stimulus = 'none'
            if 'diagram' in q_text.lower() or 'graph' in q_text.lower() or 'figure' in q_text.lower():
                stimulus = 'diagram'
            elif 'table' in q_text.lower() or 'chart' in q_text.lower():
                stimulus = 'table'
            
            # First 15 words for stem_start
            stem_start = ' '.join(q_text.split()[:15])
            
            q = Question(
                source=f"{school} {year} Trial, Q{q_num}",
                school=school,
                year=year,
                question=q_text[:500],  # Truncate for now
                format=fmt,
                marks=marks,
                concept=concept,
                dot_points=dot_points,
                stimulus=stimulus,
                solutions_in_file=True,  # Assume yes if solutions file exists
                key_answer='',
                status='selected',
                reason='',
                file=os.path.basename(pdf_path),
                page=page_num,
                stem_start=stem_start
            )
            questions.append(q)
    
    return questions

def main():
    papers_dir = Path('resources/y12_economics_trial_exams')
    output_tsv = Path('resources/topic008/05-question-pool.tsv')
    output_notes = Path('resources/topic008/05-pool-notes.md')
    
    all_questions = []
    paper_counts = {}
    concept_counts = {}
    format_counts = {'MC': 0, 'SA': 0}
    excluded_papers = []
    
    for pdf_file in sorted(papers_dir.glob('*.pdf')):
        print(f"Processing {pdf_file.name}...")
        questions = extract_questions_from_paper(str(pdf_file))
        all_questions.extend(questions)
        paper_counts[pdf_file.stem] = len(questions)
        
        if len(questions) == 0:
            excluded_papers.append(pdf_file.stem)
        
        for q in questions:
            concept_counts[q.concept] = concept_counts.get(q.concept, 0) + 1
            format_counts[q.format] = format_counts.get(q.format, 0) + 1
        
        print(f"  Found {len(questions)} Topic 1 questions")
    
    # Write TSV
    with open(output_tsv, 'w', encoding='utf-8') as f:
        # Header
        f.write('source\tschool\tyear\tquestion\tformat\tmarks\tconcept\tdot_points\tstimulus\tsolutions_in_file\tkey_answer\tstatus\treason\tfile\tpage\tstem_start\n')
        for q in all_questions:
            # Escape tabs in question text
            q_text = q.question.replace('\t', ' ').replace('\n', ' ')
            f.write(f'{q.source}\t{q.school}\t{q.year}\t{q_text}\t{q.format}\t{q.marks}\t{q.concept}\t{q.dot_points}\t{q.stimulus}\t{q.solutions_in_file}\t{q.key_answer}\t{q.status}\t{q.reason}\t{q.file}\t{q.page}\t{q.stem_start}\n')
    
    # Write notes
    with open(output_notes, 'w', encoding='utf-8') as f:
        f.write('# Question Pool Notes\n\n')
        f.write('## Totals per paper\n\n')
        f.write('| Paper | Topic 1 Questions | Notes |\n')
        f.write('|---|---|---|\n')
        for paper, count in sorted(paper_counts.items()):
            notes = ''
            if count == 0:
                notes = 'Text extraction may have failed or paper has few Topic 1 questions'
            f.write(f'| {paper} | {count} | {notes} |\n')
        
        f.write('\n## Totals per concept\n\n')
        f.write('| Concept | Count |\n')
        f.write('|---|---|\n')
        for concept, count in sorted(concept_counts.items()):
            f.write(f'| {concept} | {count} |\n')
        
        f.write(f'\n## Format breakdown\n\n')
        f.write(f'- MC: {format_counts["MC"]}\n')
        f.write(f'- SA: {format_counts["SA"]}\n')
        
        f.write(f'\n## Summary\n\n')
        f.write(f'Total questions identified: {len(all_questions)}\n')
        
        if excluded_papers:
            f.write(f'\n## Papers with no questions extracted\n\n')
            for paper in excluded_papers:
                f.write(f'- {paper}\n')
            f.write('\nThese may need manual review (OCR or viewing pages directly).\n')
    
    print(f"\nWrote {len(all_questions)} questions to {output_tsv}")
    print(f"Notes written to {output_notes}")
    print(f"\nConcept breakdown: {concept_counts}")
    print(f"Format breakdown: MC={format_counts['MC']}, SA={format_counts['SA']}")

if __name__ == '__main__':
    main()
