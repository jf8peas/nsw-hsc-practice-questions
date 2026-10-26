-- ============================================================================
-- Teacher queries for NSW HSC Practice
--
-- How to use (Neon console -> SQL Editor):
--   1. Pick ONE query below (they are separated by "-- QUERY: <name>" lines).
--   2. Copy it into the SQL Editor.
--   3. Edit the values in its first block, "params", then click Run.
--
-- The console has no query parameters, so every query starts with a small
-- "params" block you edit in place:
--     from_date / to_date   inclusive date range, in SYDNEY dates
--     include_self          true  = count self-marked answers too
--                           false = only automatic and AI-graded answers
--     unit_id / email       which unit or student (where the query needs one)
--     max_rows              how many rows to show (3 weakest units, 5 weakest questions)
--
-- Notes
--   * Ids are the same readable ids used in the content files, e.g.
--     y11-formula-test and y11-formula-test.m12.
--   * graded_by is 'auto' (multiple choice, or an empty answer), 'llm' (AI marked)
--     or 'self' (the student marked themselves).
--   * Multiple-choice rows are the 'auto' rows with a non-empty answer: the stored
--     answer is the TEXT of the option the student chose.
--   * A "class average" is total marks earned / total marks available, so a 3-mark
--     answer counts three times as much as a 1-mark answer.
--   * Read-only: none of these change any data.
-- ============================================================================


-- QUERY: units_by_class_average
-- Units ranked by class average, lowest first. The top 3 rows are the weakest units.
WITH params AS (
  SELECT DATE '2000-01-01' AS from_date,
         DATE '2999-12-31' AS to_date,
         true              AS include_self,
         3                 AS max_rows
)
SELECT r.unit_id,
       round(100.0 * sum(r.marks_awarded) / nullif(sum(r.max_marks), 0), 1) AS class_average_pct,
       count(*)                  AS answers,
       count(DISTINCT r.user_id) AS students
FROM results r, params p
WHERE (r.created_at AT TIME ZONE 'Australia/Sydney')::date BETWEEN p.from_date AND p.to_date
  AND (p.include_self OR r.graded_by <> 'self')
GROUP BY r.unit_id, p.max_rows
ORDER BY class_average_pct ASC NULLS LAST, r.unit_id
LIMIT (SELECT max_rows FROM params);


-- QUERY: questions_in_unit_by_average
-- Questions within one unit ranked by average mark, lowest first. The top 5 rows are
-- the weakest questions. Change unit_id in params to the unit you are looking at.
WITH params AS (
  SELECT 'y11-formula-test'::text AS unit_id,
         DATE '2000-01-01'        AS from_date,
         DATE '2999-12-31'        AS to_date,
         true                     AS include_self,
         5                        AS max_rows
)
SELECT r.question_id,
       round(100.0 * sum(r.marks_awarded) / nullif(sum(r.max_marks), 0), 1) AS average_mark_pct,
       count(*)                  AS answers,
       count(DISTINCT r.user_id) AS students
FROM results r, params p
WHERE r.unit_id = p.unit_id
  AND (r.created_at AT TIME ZONE 'Australia/Sydney')::date BETWEEN p.from_date AND p.to_date
  AND (p.include_self OR r.graded_by <> 'self')
GROUP BY r.question_id, p.max_rows
ORDER BY average_mark_pct ASC NULLS LAST, answers DESC, r.question_id
LIMIT (SELECT max_rows FROM params);


-- QUERY: common_wrong_mc_option
-- For each multiple-choice question, the wrong option students chose most often.
-- Leave unit_id as NULL to cover every unit, or set it (for example to 'y11-formula-test').
-- (include_self does not matter here: multiple choice is never self-marked.)
WITH params AS (
  SELECT NULL::text        AS unit_id,
         DATE '2000-01-01' AS from_date,
         DATE '2999-12-31' AS to_date,
         true              AS include_self
),
wrong AS (
  SELECT r.unit_id, r.question_id, r.answer AS option_text, count(*) AS times_chosen
  FROM results r, params p
  WHERE r.graded_by = 'auto'
    AND btrim(r.answer) <> ''          -- multiple choice (an empty short answer is also 'auto')
    AND r.marks_awarded = 0            -- a wrong option
    AND (p.unit_id IS NULL OR r.unit_id = p.unit_id)
    AND (r.created_at AT TIME ZONE 'Australia/Sydney')::date BETWEEN p.from_date AND p.to_date
  GROUP BY r.unit_id, r.question_id, r.answer
),
ranked AS (
  SELECT w.*,
         row_number() OVER (PARTITION BY unit_id, question_id ORDER BY times_chosen DESC, option_text) AS rn,
         sum(times_chosen) OVER (PARTITION BY unit_id, question_id)                                  AS wrong_answers
  FROM wrong w
)
SELECT unit_id,
       question_id,
       option_text AS most_common_wrong_option,
       times_chosen,
       wrong_answers
FROM ranked
WHERE rn = 1
ORDER BY wrong_answers DESC, unit_id, question_id;


-- QUERY: student_history
-- One student's answers in time order (Sydney time). Set their email in params.
WITH params AS (
  SELECT 'student@example.com'::text AS email,
         DATE '2000-01-01'           AS from_date,
         DATE '2999-12-31'           AS to_date,
         true                        AS include_self
)
SELECT r.created_at AT TIME ZONE 'Australia/Sydney' AS answered_at_sydney,
       r.unit_id,
       r.question_id,
       r.marks_awarded,
       r.max_marks,
       r.graded_by,
       r.attempt_id,
       left(r.answer, 80) AS answer_preview
FROM users u
JOIN results r ON r.user_id = u.id,
     params p
WHERE lower(u.email) = lower(p.email)
  AND (r.created_at AT TIME ZONE 'Australia/Sydney')::date BETWEEN p.from_date AND p.to_date
  AND (p.include_self OR r.graded_by <> 'self')
ORDER BY r.created_at, r.question_id;


-- QUERY: students_last_active
-- Every student with their last activity (latest answer or sign-in, else account creation),
-- most recent first. from_date / to_date limit the list to students whose last activity falls
-- in the range; answers_in_range counts their answers in that range.
WITH params AS (
  SELECT DATE '2000-01-01' AS from_date,
         DATE '2999-12-31' AS to_date,
         true              AS include_self
),
activity AS (
  SELECT u.id, u.name, u.email, u.created_at, u.last_sign_in_at, u.last_answer_at,
         greatest(u.last_answer_at, u.last_sign_in_at, u.created_at) AS last_active
  FROM users u
)
SELECT a.name,
       a.email,
       a.last_active AT TIME ZONE 'Australia/Sydney' AS last_active_sydney,
       a.last_answer_at AT TIME ZONE 'Australia/Sydney' AS last_answer_sydney,
       a.last_sign_in_at AT TIME ZONE 'Australia/Sydney' AS last_sign_in_sydney,
       (SELECT count(*)
          FROM results r
         WHERE r.user_id = a.id
           AND (r.created_at AT TIME ZONE 'Australia/Sydney')::date BETWEEN p.from_date AND p.to_date
           AND (p.include_self OR r.graded_by <> 'self')) AS answers_in_range
FROM activity a, params p
WHERE (a.last_active AT TIME ZONE 'Australia/Sydney')::date BETWEEN p.from_date AND p.to_date
ORDER BY a.last_active DESC, a.email;


-- QUERY: ai_answers_used_today
-- AI-graded answers each student has used on a given Sydney day (today by default).
-- This is the same counter that enforces the daily limit (LLM_DAILY_CAP).
WITH params AS (
  SELECT (now() AT TIME ZONE 'Australia/Sydney')::date AS day
)
SELECT u.name,
       u.email,
       d.count AS ai_answers_used
FROM daily_ai_usage d
JOIN users u ON u.id = d.user_id,
     params p
WHERE d.sydney_date = p.day
  AND d.count > 0
ORDER BY d.count DESC, u.email;
